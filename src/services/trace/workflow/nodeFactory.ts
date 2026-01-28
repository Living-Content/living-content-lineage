/**
 * Per-workflow node creation with independent width calculation.
 * Each workflow calculates its own step widths for independent sizing.
 * Workflows are NOT conflated - each has its own dimensions.
 */
import type { Container, Ticker } from 'pixi.js';
import type { TraceNodeData } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { HoverPayload } from '../layout/utils.js';
import type { WorkflowManager, RegisteredWorkflow } from './manager.js';
import { GROUP_KEY_PRECISION } from '../../../config/nodes.js';
import { preCalculateNodeWidth } from '../rendering/nodeMeasurement.js';
import { createNodes, repositionNodesWithGaps } from '../layout/nodeCreator.js';

/**
 * Dependencies for node creation.
 */
export interface NodeCreationDeps {
  container: HTMLElement;
  nodeLayer: Container;
  graphScale: number;
  ticker: Ticker;
  callbacks: {
    onHover: (payload: HoverPayload) => void;
    onHoverEnd: () => void;
    onNodeClick?: (node: TraceNodeData) => void;
  };
  getSelectedNodeId: () => string | null;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
}

/**
 * Calculate step widths for a SINGLE workflow's nodes.
 * Groups nodes by their X position (step column) and finds max width per group.
 */
const calculateStepWidths = (nodes: TraceNodeData[]): Map<number, number> => {
  const widths = new Map<number, number>();

  for (const node of nodes) {
    const groupKey = Math.round((node.x ?? 0.5) * GROUP_KEY_PRECISION);
    const width = preCalculateNodeWidth(node, 1);
    const current = widths.get(groupKey) ?? 0;
    if (width > current) {
      widths.set(groupKey, width);
    }
  }

  return widths;
};

/**
 * Create visual nodes for a single workflow with its OWN width calculation.
 * Each workflow's nodes are sized based on that workflow's content only.
 */
const createWorkflowNodes = async (
  workflow: RegisteredWorkflow,
  deps: NodeCreationDeps
): Promise<Map<string, GraphNode>> => {
  const nodeMap = new Map<string, GraphNode>();

  // Calculate widths for THIS workflow only
  const stepWidths = calculateStepWidths(workflow.trace.nodes);

  await createNodes(workflow.trace.nodes, nodeMap, {
    container: deps.container,
    nodeLayer: deps.nodeLayer,
    graphScale: deps.graphScale,
    ticker: deps.ticker,
    callbacks: deps.callbacks,
    getSelectedNodeId: deps.getSelectedNodeId,
    setNodeAlpha: deps.setNodeAlpha,
    yOffset: workflow.yOffset - 0.5,
    stepWidths, // Pass THIS workflow's widths
  });

  repositionNodesWithGaps(nodeMap);

  if (workflow.opacity !== 1.0) {
    for (const node of nodeMap.values()) {
      node.alpha = workflow.opacity;
    }
  }

  return nodeMap;
};

/**
 * Create nodes for all registered workflows.
 * Each workflow calculates its own widths independently.
 */
export const createNodesForAllWorkflows = async (
  manager: WorkflowManager,
  deps: NodeCreationDeps
): Promise<void> => {
  const workflows = manager.getAllRegistered();

  // Create nodes for each workflow with independent widths
  for (const workflow of workflows) {
    const nodeMap = await createWorkflowNodes(workflow, deps);
    manager.setNodeMap(workflow.workflowId, nodeMap);
  }
};
