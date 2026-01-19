/**
 * Unified selection highlighting for graph nodes and edges.
 * Manages visual state based on selection changes.
 * Uses blur filters for non-highlighted nodes.
 */
import { BlurFilter, type Container } from 'pixi.js';
import type { LineageGraph, LineageEdgeData, Workflow, Phase } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { SelectionTarget } from '../../../stores/lineageState.js';
import { renderEdges, renderWorkflowEdges } from '../rendering/edgeRenderer.js';
import { DEFAULT_NODE_ALPHA } from '../rendering/nodeRenderer.js';
import { getCssVarFloat, getCssVarInt } from '../../../themes/index.js';

// Cache blur filters to avoid creating new ones on every update
const nodeBlurFilters = new Map<string, BlurFilter>();

/**
 * Gets or creates a blur filter for a node.
 */
const getBlurFilter = (nodeId: string): BlurFilter => {
  let filter = nodeBlurFilters.get(nodeId);
  if (!filter) {
    filter = new BlurFilter({ strength: 0, quality: 4 });
    nodeBlurFilters.set(nodeId, filter);
  }
  return filter;
};

/**
 * Applies blur to a node.
 */
const setNodeBlur = (node: GraphNode, blur: number): void => {
  const filter = getBlurFilter(node.nodeData.id);
  filter.strength = blur;

  if (blur > 0) {
    if (!node.filters || !node.filters.includes(filter)) {
      node.filters = node.filters ? [...node.filters, filter] : [filter];
    }
  } else {
    if (node.filters) {
      node.filters = node.filters.filter((f) => f !== filter);
      if (node.filters.length === 0) {
        node.filters = null;
      }
    }
  }
};

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
  workflowEdgeLayer: Container;
  edges: LineageEdgeData[];
  workflows: Workflow[];
  verticalAdjacency: VerticalAdjacencyMap;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  useBlur?: boolean;
}

/**
 * Helper to set visibility state for a map of nodes.
 * Uses alpha for dimming in normal view, blur when useBlur is true.
 */
function setNodeMapVisibility(
  nodeMap: Map<string, GraphNode>,
  setNodeAlpha: (id: string, alpha: number) => void,
  isHighlighted: (id: string) => boolean,
  isSelected: (id: string) => boolean,
  useBlur: boolean = false
): void {
  const blurStrength = getCssVarInt('--faded-node-blur');
  const fadedAlpha = getCssVarFloat('--faded-node-alpha');

  nodeMap.forEach((node, nodeId) => {
    const highlighted = isHighlighted(nodeId);
    const selected = isSelected(nodeId);

    if (useBlur) {
      // Use blur for fading
      setNodeBlur(node, highlighted ? 0 : blurStrength);
      setNodeAlpha(nodeId, 1);
    } else {
      // Use alpha for fading
      setNodeBlur(node, 0);
      setNodeAlpha(nodeId, highlighted ? 1 : fadedAlpha);
    }
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
  const { nodeMap, workflowNodeMap, edgeLayer, workflowEdgeLayer, edges, workflows, verticalAdjacency, setNodeAlpha, useBlur = false } = deps;
  const verticallyConnected = verticalAdjacency.getConnectedNodeIds(selectedId);

  // Highlight nodes in expanded view
  setNodeMapVisibility(
    nodeMap,
    setNodeAlpha,
    (id) => id === selectedId || verticallyConnected.has(id),
    (id) => id === selectedId,
    useBlur
  );

  // Dim workflow nodes and edges (for collapsed view consistency)
  const blurStrength = getCssVarInt('--faded-node-blur');
  const fadedAlpha = getCssVarFloat('--faded-node-alpha');
  workflowNodeMap.forEach((node) => {
    if (useBlur) {
      setNodeBlur(node, blurStrength);
    } else {
      setNodeBlur(node, 0);
      node.alpha = fadedAlpha;
    }
    node.setSelected(false);
  });

  renderEdges(edgeLayer, edges, nodeMap, {
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
  const { nodeMap, workflowNodeMap, workflowEdgeLayer, workflows, setNodeAlpha, useBlur = false } = deps;
  const blurStrength = getCssVarInt('--faded-node-blur');
  const fadedAlpha = getCssVarFloat('--faded-node-alpha');

  // Highlight only selected workflow node
  workflowNodeMap.forEach((node, nodeId) => {
    const highlighted = nodeId === workflowId;
    if (useBlur) {
      setNodeBlur(node, highlighted ? 0 : blurStrength);
      node.alpha = 1;
    } else {
      setNodeBlur(node, 0);
      node.alpha = highlighted ? 1 : fadedAlpha;
    }
    node.setSelected(highlighted);
  });

  // Dim all expanded nodes for consistency
  setNodeMapVisibility(
    nodeMap,
    setNodeAlpha,
    () => false,
    () => false,
    useBlur
  );

  // Re-render workflow edges with selection highlighting
  renderWorkflowEdges(workflowEdgeLayer, workflows, workflowNodeMap, workflowId);
};

/**
 * Clears all selection visuals, restoring default state (no blur).
 */
export const clearSelectionVisuals = (deps: SelectionHighlighterDeps): void => {
  const { nodeMap, workflowNodeMap, edgeLayer, workflowEdgeLayer, edges, workflows, setNodeAlpha } = deps;

  nodeMap.forEach((node, nodeId) => {
    setNodeAlpha(nodeId, DEFAULT_NODE_ALPHA);
    setNodeBlur(node, 0);
    node.setSelected(false);
  });

  workflowNodeMap.forEach((node) => {
    node.alpha = DEFAULT_NODE_ALPHA;
    setNodeBlur(node, 0);
    node.setSelected(false);
  });

  renderEdges(edgeLayer, edges, nodeMap, {
    view: 'workflow',
    selectedId: null,
    highlightedIds: null,
  });
  renderWorkflowEdges(workflowEdgeLayer, workflows, workflowNodeMap, null);
};

/**
 * Applies phase filter, blurring nodes that don't match the selected phase.
 */
export const applyPhaseFilter = (
  phase: Phase | null,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap, workflowNodeMap, workflows } = deps;
  const blurStrength = getCssVarInt('--faded-node-blur');

  if (!phase) {
    // Clear filter - remove blur from all nodes
    nodeMap.forEach((node) => {
      setNodeBlur(node, 0);
    });
    workflowNodeMap.forEach((node) => {
      setNodeBlur(node, 0);
    });
    return;
  }

  // Build set of workflow IDs that match the phase
  const matchingWorkflowIds = new Set(
    workflows.filter((w) => w.phase === phase).map((w) => w.id)
  );

  // Blur nodes that don't match the phase
  nodeMap.forEach((node) => {
    const matches = node.nodeData.phase === phase;
    setNodeBlur(node, matches ? 0 : blurStrength);
  });

  // Blur workflow nodes that don't match
  workflowNodeMap.forEach((node, workflowId) => {
    const matches = matchingWorkflowIds.has(workflowId);
    setNodeBlur(node, matches ? 0 : blurStrength);
  });
};
