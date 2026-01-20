/**
 * Unified selection highlighting for graph nodes and edges.
 * Manages visual state based on selection changes.
 * Uses blur filters for non-highlighted nodes in detail view.
 */
import { BlurFilter, type Container } from 'pixi.js';
import type { LineageEdgeData, LineageNodeData, StepUI, Phase } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { SelectionTarget } from '../../../stores/lineageState.js';
import { renderEdges, renderStepEdges } from '../rendering/edgeRenderer.js';
import { DEFAULT_NODE_ALPHA } from '../rendering/nodeRenderer.js';
import { getCssVarFloat, getCssVarInt } from '../../../themes/index.js';

// Cache blur filters to avoid creating new ones on every update
const nodeBlurFilters = new Map<string, BlurFilter>();

/**
 * Gets cached fading style values from CSS variables.
 */
const getFadeStyles = (): { blurStrength: number; fadedAlpha: number } => ({
  blurStrength: getCssVarInt('--faded-node-blur'),
  fadedAlpha: getCssVarFloat('--faded-node-alpha'),
});

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
 * Applies blur filter to a node. Removes filter when blur is 0.
 */
const setNodeBlur = (node: GraphNode, blur: number): void => {
  const filter = getBlurFilter(node.nodeData.id);
  filter.strength = blur;

  if (blur > 0) {
    if (!node.filters || !node.filters.includes(filter)) {
      node.filters = node.filters ? [...node.filters, filter] : [filter];
    }
  } else if (node.filters) {
    node.filters = node.filters.filter((f) => f !== filter);
    if (node.filters.length === 0) {
      node.filters = null;
    }
  }
};

/**
 * Applies fading effect (blur or alpha) to a single node.
 */
const applyNodeFade = (
  node: GraphNode,
  highlighted: boolean,
  useBlur: boolean,
  styles: { blurStrength: number; fadedAlpha: number }
): void => {
  if (useBlur) {
    setNodeBlur(node, highlighted ? 0 : styles.blurStrength);
    node.alpha = 1;
  } else {
    setNodeBlur(node, 0);
    node.alpha = highlighted ? 1 : styles.fadedAlpha;
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
  nodes: LineageNodeData[],
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
  stepNodeMap: Map<string, GraphNode>;
  edgeLayer: Container;
  stepEdgeLayer: Container;
  edges: LineageEdgeData[];
  steps: StepUI[];
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
  const styles = getFadeStyles();

  nodeMap.forEach((node, nodeId) => {
    const highlighted = isHighlighted(nodeId);
    applyNodeFade(node, highlighted, useBlur, styles);
    if (!useBlur) {
      setNodeAlpha(nodeId, highlighted ? 1 : styles.fadedAlpha);
    } else {
      setNodeAlpha(nodeId, 1);
    }
    node.setSelected(isSelected(nodeId));
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

  if (selection.type === 'step') {
    highlightStep(selection.stepId, deps);
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
  const { nodeMap, stepNodeMap, edgeLayer, stepEdgeLayer, edges, steps, verticalAdjacency, setNodeAlpha, useBlur = false } = deps;
  const verticallyConnected = verticalAdjacency.getConnectedNodeIds(selectedId);
  const styles = getFadeStyles();

  // Highlight nodes in expanded view
  setNodeMapVisibility(
    nodeMap,
    setNodeAlpha,
    (id) => id === selectedId || verticallyConnected.has(id),
    (id) => id === selectedId,
    useBlur
  );

  // Dim all step nodes (for collapsed view consistency)
  stepNodeMap.forEach((node) => {
    applyNodeFade(node, false, useBlur, styles);
    node.setSelected(false);
  });

  renderEdges(edgeLayer, edges, nodeMap, {
    view: 'workflow',
    selectedId,
    highlightedIds: verticallyConnected,
  });
  renderStepEdges(stepEdgeLayer, steps, stepNodeMap, '');
};

/**
 * Applies selection highlighting to a step node.
 */
const highlightStep = (
  stepId: string,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap, stepNodeMap, stepEdgeLayer, steps, setNodeAlpha, useBlur = false } = deps;
  const styles = getFadeStyles();

  // Highlight only selected step node
  stepNodeMap.forEach((node, nodeId) => {
    const highlighted = nodeId === stepId;
    applyNodeFade(node, highlighted, useBlur, styles);
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

  renderStepEdges(stepEdgeLayer, steps, stepNodeMap, stepId);
};

/**
 * Clears all selection visuals, restoring default state (no blur).
 */
export const clearSelectionVisuals = (deps: SelectionHighlighterDeps): void => {
  const { nodeMap, stepNodeMap, edgeLayer, stepEdgeLayer, edges, steps, setNodeAlpha } = deps;

  nodeMap.forEach((node, nodeId) => {
    setNodeAlpha(nodeId, DEFAULT_NODE_ALPHA);
    setNodeBlur(node, 0);
    node.setSelected(false);
  });

  stepNodeMap.forEach((node) => {
    node.alpha = DEFAULT_NODE_ALPHA;
    setNodeBlur(node, 0);
    node.setSelected(false);
  });

  renderEdges(edgeLayer, edges, nodeMap, {
    view: 'workflow',
    selectedId: null,
    highlightedIds: null,
  });
  renderStepEdges(stepEdgeLayer, steps, stepNodeMap, null);
};

/**
 * Applies phase filter, blurring nodes that don't match the selected phase.
 */
export const applyPhaseFilter = (
  phase: Phase | null,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap, stepNodeMap, steps } = deps;
  const { blurStrength } = getFadeStyles();

  if (!phase) {
    // Clear filter - remove blur from all nodes
    nodeMap.forEach((node) => setNodeBlur(node, 0));
    stepNodeMap.forEach((node) => setNodeBlur(node, 0));
    return;
  }

  // Build set of step IDs that match the phase
  const matchingStepIds = new Set(
    steps.filter((s) => s.phase === phase).map((s) => s.id)
  );

  // Blur nodes that don't match the phase
  nodeMap.forEach((node) => {
    const matches = node.nodeData.phase === phase;
    setNodeBlur(node, matches ? 0 : blurStrength);
  });

  // Blur step nodes that don't match
  stepNodeMap.forEach((node, stepId) => {
    const matches = matchingStepIds.has(stepId);
    setNodeBlur(node, matches ? 0 : blurStrength);
  });
};
