/**
 * Workflow connector position and metadata calculation.
 * The connector indicates where a child workflow diverged from its parent.
 */
import type { ManagedWorkflow } from './manager.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { Phase } from '../../../config/types.js';
import { CONNECTOR_GAP } from '../../../config/edges.js';

/**
 * Minimal interface for accessing workflows.
 */
export interface WorkflowAccessor {
  getAll(): ManagedWorkflow[];
  get(workflowId: string): ManagedWorkflow | undefined;
}

/**
 * Connector positioning and metadata.
 */
export interface ConnectorContext {
  x: number | null;
  topY: number | null;
  bottomY: number | null;
  phase: Phase | null;
  sourceNodeId: string | null;
  relationship: string | null;
  childWorkflowId: string | null;
  childWorkflowTitle: string | null;
}

/**
 * Find the action node X position for a given step in a workflow.
 */
const findActionXForStep = (
  stepId: string,
  nodeMap: Map<string, GraphNode>
): number | null => {
  for (const node of nodeMap.values()) {
    if (node.nodeData.step === stepId &&
        node.nodeData.nodeType === 'process' &&
        node.nodeData.assetType === 'Action') {
      return node.position.x;
    }
  }
  return null;
};

/**
 * Find phase for a step by looking at any node in that step.
 */
const findPhaseForStep = (
  stepId: string,
  nodeMap: Map<string, GraphNode>
): Phase | null => {
  for (const node of nodeMap.values()) {
    if (node.nodeData.step === stepId) {
      return node.nodeData.phase;
    }
  }
  return null;
};

/**
 * Find the action node bottom Y for a step in a workflow.
 * This is where the connector should START (at the branch point).
 */
const findActionBottomY = (
  nodeMap: Map<string, GraphNode>,
  stepId: string
): number | null => {
  for (const node of nodeMap.values()) {
    if (node.nodeData.step === stepId &&
        node.nodeData.nodeType === 'process' &&
        node.nodeData.assetType === 'Action') {
      return node.position.y + node.nodeHeight / 2;
    }
  }
  return null;
};

/**
 * Get the top Y of a workflow (highest node top edge).
 * Includes offset for step label space above the workflow.
 */
const getWorkflowTopY = (nodeMap: Map<string, GraphNode>): number | null => {
  let minY = Infinity;
  let halfHeight = 0;

  for (const node of nodeMap.values()) {
    if (node.position.y < minY) {
      minY = node.position.y;
      halfHeight = node.nodeHeight / 2;
    }
  }

  if (minY === Infinity) return null;

  return minY - halfHeight - CONNECTOR_GAP;
};

/**
 * Calculate connector context for a single child workflow.
 */
const getConnectorForChild = (
  mainWorkflow: ManagedWorkflow,
  childWorkflow: ManagedWorkflow
): ConnectorContext | null => {
  if (!childWorkflow.branchPointNodeId) {
    return null;
  }

  // Find the source node to get its step
  const sourceNodeId = childWorkflow.branchPointNodeId;
  const sourceNode = mainWorkflow.nodeMap.get(sourceNodeId);
  if (!sourceNode) {
    return null;
  }

  const stepId = sourceNode.nodeData.step;
  if (!stepId) {
    return null;
  }

  // Get X from the action node at this step (matches label position)
  const actionX = findActionXForStep(stepId, mainWorkflow.nodeMap);
  if (actionX === null) {
    return null;
  }

  // Get phase color
  const phase = findPhaseForStep(stepId, mainWorkflow.nodeMap);

  // Calculate Y range: from branch point action node to top of child workflow
  const actionBottomY = findActionBottomY(mainWorkflow.nodeMap, stepId);
  const childTopY = getWorkflowTopY(childWorkflow.nodeMap);

  if (actionBottomY === null || childTopY === null) {
    return null;
  }

  return {
    x: actionX,
    topY: actionBottomY,
    bottomY: childTopY,
    phase,
    sourceNodeId,
    relationship: childWorkflow.relationship,
    childWorkflowId: childWorkflow.workflowId,
    childWorkflowTitle: childWorkflow.trace.title ?? null,
  };
};

/**
 * Calculate connector contexts for all child workflows.
 */
export const getAllConnectorContexts = (
  accessor: WorkflowAccessor,
  mainWorkflowId: string
): ConnectorContext[] => {
  const workflows = accessor.getAll();
  const mainWorkflow = accessor.get(mainWorkflowId);

  if (!mainWorkflow || workflows.length <= 1) {
    return [];
  }

  // Find ALL child workflows of main
  const childWorkflows = workflows.filter(wf =>
    wf.parentWorkflowId === mainWorkflowId && wf.branchPointNodeId
  );

  const contexts: ConnectorContext[] = [];
  for (const child of childWorkflows) {
    const ctx = getConnectorForChild(mainWorkflow, child);
    if (ctx) {
      contexts.push(ctx);
    }
  }

  return contexts;
};
