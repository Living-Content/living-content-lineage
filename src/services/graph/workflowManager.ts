/**
 * Workflow registration and access.
 * Workflows are registered before node creation, then accessed after nodes are created.
 * Node creation is handled by workflowNodeFactory.ts.
 *
 * DATA ONLY - no rendering logic. Rendering is handled by workflowRenderer.ts.
 */
import type { Trace, TraceEdgeData, Phase } from '../../config/types.js';
import type { GraphNode } from './rendering/nodeRenderer.js';
import { getConnectorContext } from './workflowConnector.js';

export type WorkflowRelationship = 'main' | 'ancestor' | 'child' | 'replay';

/**
 * Workflow options for registration.
 */
export interface WorkflowOptions {
  yOffset: number;
  opacity: number;
  relationship: WorkflowRelationship;
  branchPointNodeId?: string | null;
  parentWorkflowId?: string | null;
}

/**
 * A registered workflow before node creation.
 */
export interface RegisteredWorkflow {
  workflowId: string;
  trace: Trace;
  yOffset: number;
  opacity: number;
  relationship: WorkflowRelationship;
  branchPointNodeId: string | null;
  parentWorkflowId: string | null;
}

/**
 * A managed workflow after node creation.
 */
export interface ManagedWorkflow extends RegisteredWorkflow {
  nodeMap: Map<string, GraphNode>;
}

/**
 * Edge data needed by renderer.
 */
export interface WorkflowEdgeData {
  workflowId: string;
  edges: readonly TraceEdgeData[];
  nodeMap: ReadonlyMap<string, GraphNode>;
  opacity: number;
}

/**
 * Workflow connector positioning and metadata.
 */
export interface WorkflowConnectorContext {
  x: number | null;
  topY: number | null;
  bottomY: number | null;
  phase: Phase | null;
  sourceNodeId: string | null;
  relationship: string | null;
  childWorkflowId: string | null;
  childWorkflowTitle: string | null;
}

export interface WorkflowManager {
  /** Register workflow trace data. No nodes created yet. */
  register(workflowId: string, trace: Trace, options: WorkflowOptions): void;

  /** Get registered workflow (before node creation). */
  getRegistered(workflowId: string): RegisteredWorkflow | undefined;

  /** Get all registered workflows. */
  getAllRegistered(): RegisteredWorkflow[];

  /** Store created nodeMap for a workflow. Called after batch node creation. */
  setNodeMap(workflowId: string, nodeMap: Map<string, GraphNode>): void;

  /** Get managed workflow with nodeMap (after node creation). */
  get(workflowId: string): ManagedWorkflow | undefined;

  /** Get all managed workflows. */
  getAll(): ManagedWorkflow[];

  /** Get all node maps from all workflows. */
  getAllNodeMaps(): Map<string, GraphNode>[];

  /** Get all edges with their node maps for rendering. */
  getAllEdges(): { edges: TraceEdgeData[]; nodeMap: Map<string, GraphNode> }[];

  /** Get bounds info for topmost node across all workflows. */
  getTopNodeInfo(): { worldY: number; halfHeight: number } | null;

  /** Get bounds info for bottommost node across all workflows. */
  getBottomNodeInfo(): { worldY: number; halfHeight: number } | null;

  /** Get edge data for rendering (read-only). */
  getEdgeData(): readonly WorkflowEdgeData[];

  /** Get connector context for rendering (read-only). */
  getConnectorContext(mainWorkflowId: string): WorkflowConnectorContext;
}

/**
 * Create a workflow manager for registration and access.
 */
export const createWorkflowManager = (): WorkflowManager => {
  const registered = new Map<string, RegisteredWorkflow>();
  const nodeMaps = new Map<string, Map<string, GraphNode>>();

  const register = (
    workflowId: string,
    trace: Trace,
    options: WorkflowOptions
  ): void => {
    registered.set(workflowId, {
      workflowId,
      trace,
      yOffset: options.yOffset,
      opacity: options.opacity,
      relationship: options.relationship,
      branchPointNodeId: options.branchPointNodeId ?? null,
      parentWorkflowId: options.parentWorkflowId ?? null,
    });
  };

  const getRegistered = (workflowId: string): RegisteredWorkflow | undefined => {
    return registered.get(workflowId);
  };

  const getAllRegistered = (): RegisteredWorkflow[] => {
    return Array.from(registered.values());
  };

  const setNodeMap = (
    workflowId: string,
    nodeMap: Map<string, GraphNode>
  ): void => {
    nodeMaps.set(workflowId, nodeMap);
  };

  const get = (workflowId: string): ManagedWorkflow | undefined => {
    const reg = registered.get(workflowId);
    const nodeMap = nodeMaps.get(workflowId);
    if (!reg || !nodeMap) return undefined;
    return { ...reg, nodeMap };
  };

  const getAll = (): ManagedWorkflow[] => {
    const result: ManagedWorkflow[] = [];
    for (const [workflowId, reg] of registered) {
      const nodeMap = nodeMaps.get(workflowId);
      if (nodeMap) {
        result.push({ ...reg, nodeMap });
      }
    }
    return result;
  };

  const getAllNodeMaps = (): Map<string, GraphNode>[] => {
    return Array.from(nodeMaps.values());
  };

  const getAllEdges = (): { edges: TraceEdgeData[]; nodeMap: Map<string, GraphNode> }[] => {
    const result: { edges: TraceEdgeData[]; nodeMap: Map<string, GraphNode> }[] = [];
    for (const [workflowId, reg] of registered) {
      const nodeMap = nodeMaps.get(workflowId);
      if (nodeMap) {
        result.push({ edges: reg.trace.edges, nodeMap });
      }
    }
    return result;
  };

  const getTopNodeInfo = (): { worldY: number; halfHeight: number } | null => {
    let minWorldY = Infinity;
    let halfHeight = 0;

    for (const nodeMap of nodeMaps.values()) {
      for (const node of nodeMap.values()) {
        if (node.position.y < minWorldY) {
          minWorldY = node.position.y;
          halfHeight = node.nodeHeight / 2;
        }
      }
    }

    return minWorldY === Infinity ? null : { worldY: minWorldY, halfHeight };
  };

  const getBottomNodeInfo = (): { worldY: number; halfHeight: number } | null => {
    let maxWorldY = -Infinity;
    let halfHeight = 0;

    for (const nodeMap of nodeMaps.values()) {
      for (const node of nodeMap.values()) {
        if (node.position.y > maxWorldY) {
          maxWorldY = node.position.y;
          halfHeight = node.nodeHeight / 2;
        }
      }
    }

    return maxWorldY === -Infinity ? null : { worldY: maxWorldY, halfHeight };
  };

  const getEdgeData = (): readonly WorkflowEdgeData[] => {
    const result: WorkflowEdgeData[] = [];
    for (const [workflowId, reg] of registered) {
      const nodeMap = nodeMaps.get(workflowId);
      if (nodeMap) {
        result.push({
          workflowId,
          edges: reg.trace.edges,
          nodeMap,
          opacity: reg.opacity,
        });
      }
    }
    return result;
  };

  const getConnectorCtx = (mainWorkflowId: string): WorkflowConnectorContext => {
    return getConnectorContext({ getAll, get }, mainWorkflowId);
  };

  return {
    register,
    getRegistered,
    getAllRegistered,
    setNodeMap,
    get,
    getAll,
    getAllNodeMaps,
    getAllEdges,
    getTopNodeInfo,
    getBottomNodeInfo,
    getEdgeData,
    getConnectorContext: getConnectorCtx,
  };
};
