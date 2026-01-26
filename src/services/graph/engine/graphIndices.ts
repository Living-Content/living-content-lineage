/**
 * Graph indices for efficient lookups.
 * Precomputed once during initialization.
 */
import type { TraceNodeData, TraceEdgeData } from '../../../config/types.js';

/**
 * Precomputed graph indices for efficient lookups.
 */
export interface GraphIndices {
  nodeById: Map<string, TraceNodeData>;
  nodesByStep: Map<string, TraceNodeData[]>;
  edgesByStep: Map<string, TraceEdgeData[]>;
}

/**
 * Builds lookup indices from trace data.
 * O(n+m) where n=nodes, m=edges.
 */
export const buildGraphIndices = (
  nodes: TraceNodeData[],
  edges: TraceEdgeData[]
): GraphIndices => {
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const nodesByStep = new Map<string, TraceNodeData[]>();
  const edgesByStep = new Map<string, TraceEdgeData[]>();

  for (const node of nodes) {
    if (!node.step) continue;
    const list = nodesByStep.get(node.step) ?? [];
    list.push(node);
    nodesByStep.set(node.step, list);
  }

  for (const edge of edges) {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const stepId = sourceNode?.step ?? targetNode?.step;
    if (stepId) {
      const list = edgesByStep.get(stepId) ?? [];
      list.push(edge);
      edgesByStep.set(stepId, list);
    }
  }

  return { nodeById, nodesByStep, edgesByStep };
};
