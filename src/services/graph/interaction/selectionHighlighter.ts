/**
 * Unified selection highlighting for graph nodes and edges.
 * Manages visual state based on selection changes.
 */
import type { LineageGraph, LineageEdgeData, Workflow } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { SelectionTarget } from '../../../stores/lineageState.js';
import { renderEdges, renderWorkflowEdges } from '../rendering/edgeRenderer.js';
import { FADED_NODE_ALPHA } from '../../../config/constants.js';
import { DEFAULT_NODE_ALPHA } from '../rendering/nodeRenderer.js';
import type { Container } from 'pixi.js';

export interface VerticalAdjacencyMap {
  map: Map<string, Set<string>>;
  getConnectedNodeIds: (nodeId: string) => Set<string>;
}

/**
 * Builds a map of vertically-connected nodes from edge data.
 */
export const buildVerticalAdjacencyMap = (
  nodes: LineageGraph['nodes'],
  edges: LineageEdgeData[]
): VerticalAdjacencyMap => {
  const nodePositions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    nodePositions.set(node.id, { x: node.x ?? 0.5, y: node.y ?? 0.5 });
  }

  const adjacencyMap = new Map<string, Set<string>>();
  for (const edge of edges) {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);
    if (!sourcePos || !targetPos) continue;

    const dx = Math.abs(targetPos.x - sourcePos.x);
    const dy = Math.abs(targetPos.y - sourcePos.y);
    const isVertical = dy > dx;

    if (isVertical) {
      if (!adjacencyMap.has(edge.source)) adjacencyMap.set(edge.source, new Set());
      if (!adjacencyMap.has(edge.target)) adjacencyMap.set(edge.target, new Set());
      adjacencyMap.get(edge.source)!.add(edge.target);
      adjacencyMap.get(edge.target)!.add(edge.source);
    }
  }

  const getConnectedNodeIds = (nodeId: string): Set<string> => {
    const connected = new Set<string>();
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = adjacencyMap.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          connected.add(neighbor);
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }

    return connected;
  };

  return { map: adjacencyMap, getConnectedNodeIds };
};

export interface SelectionHighlighterDeps {
  nodeMap: Map<string, GraphNode>;
  workflowNodeMap: Map<string, GraphNode>;
  edgeLayer: Container;
  dotLayer: Container;
  workflowEdgeLayer: Container;
  edges: LineageEdgeData[];
  workflows: Workflow[];
  verticalAdjacency: VerticalAdjacencyMap;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
}

/**
 * Helper to set visibility state for a map of nodes.
 */
function setNodeMapVisibility(
  nodeMap: Map<string, GraphNode>,
  setNodeAlpha: (id: string, alpha: number) => void,
  isHighlighted: (id: string) => boolean,
  isSelected: (id: string) => boolean
): void {
  nodeMap.forEach((node, nodeId) => {
    const highlighted = isHighlighted(nodeId);
    const selected = isSelected(nodeId);
    setNodeAlpha(nodeId, highlighted ? 1 : FADED_NODE_ALPHA);
    node.setSelected(selected);
  });
}

/**
 * Unified selection highlighting.
 * Dispatches to appropriate highlighter based on selection type.
 */
export const applySelectionHighlight = (
  selection: SelectionTarget,
  deps: SelectionHighlighterDeps
): void => {
  if (!selection) {
    clearSelectionVisuals(deps);
    return;
  }

  if (selection.type === 'workflow') {
    highlightWorkflow(selection.workflowId, deps);
  } else {
    highlightNode(selection.nodeId, deps);
  }
};

/**
 * Applies selection highlighting to a specific node.
 * Fades non-connected nodes and highlights the selection path.
 */
const highlightNode = (
  selectedId: string,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap, workflowNodeMap, edgeLayer, dotLayer, workflowEdgeLayer, edges, workflows, verticalAdjacency, setNodeAlpha } = deps;
  const verticallyConnected = verticalAdjacency.getConnectedNodeIds(selectedId);

  // Highlight nodes in expanded view
  setNodeMapVisibility(
    nodeMap,
    setNodeAlpha,
    (id) => id === selectedId || verticallyConnected.has(id),
    (id) => id === selectedId
  );

  // Dim workflow nodes and edges (for collapsed view consistency)
  workflowNodeMap.forEach((node) => {
    node.alpha = FADED_NODE_ALPHA;
    node.setSelected(false);
  });

  renderEdges(edgeLayer, dotLayer, edges, nodeMap, {
    view: 'workflow',
    selectedId,
    highlightedIds: verticallyConnected,
  });
  // Dim all workflow edges when a node is selected
  renderWorkflowEdges(workflowEdgeLayer, workflows, workflowNodeMap, '');
};

/**
 * Applies selection highlighting to a workflow node.
 */
const highlightWorkflow = (
  workflowId: string,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap, workflowNodeMap, workflowEdgeLayer, workflows, setNodeAlpha } = deps;

  // Highlight only selected workflow node
  setNodeMapVisibility(
    workflowNodeMap,
    (id, alpha) => { workflowNodeMap.get(id)!.alpha = alpha; },
    (id) => id === workflowId,
    (id) => id === workflowId
  );

  // Dim all expanded nodes for consistency
  setNodeMapVisibility(
    nodeMap,
    setNodeAlpha,
    () => false,
    () => false
  );

  // Re-render workflow edges with selection highlighting
  renderWorkflowEdges(workflowEdgeLayer, workflows, workflowNodeMap, workflowId);
};

/**
 * Clears all selection visuals, restoring default alpha.
 */
export const clearSelectionVisuals = (deps: SelectionHighlighterDeps): void => {
  const { nodeMap, workflowNodeMap, edgeLayer, dotLayer, workflowEdgeLayer, edges, workflows, setNodeAlpha } = deps;

  nodeMap.forEach((node, nodeId) => {
    setNodeAlpha(nodeId, DEFAULT_NODE_ALPHA);
    node.setSelected(false);
  });

  workflowNodeMap.forEach((node) => {
    node.alpha = DEFAULT_NODE_ALPHA;
    node.setSelected(false);
  });

  renderEdges(edgeLayer, dotLayer, edges, nodeMap, {
    view: 'workflow',
    selectedId: null,
    highlightedIds: null,
  });
  renderWorkflowEdges(workflowEdgeLayer, workflows, workflowNodeMap, null);
};
