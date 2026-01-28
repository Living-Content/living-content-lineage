/**
 * Unified selection highlighting for graph nodes.
 * Manages visual state (alpha, blur) based on selection changes.
 * Edge rendering is handled by workflowRenderer (decoupled).
 */
import { BlurFilter } from 'pixi.js';
import type { Phase } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { SelectionTarget } from '../../../stores/traceState.svelte.js';
import { getCssVarFloat, getCssVarInt } from '../../../themes/index.js';

// Cache blur filters to avoid creating new ones on every update
const nodeBlurFilters = new Map<string, BlurFilter>();

/**
 * Gets cached fading style values from CSS variables.
 */
const getFadeStyles = (): { blurStrength: number; fadedAlpha: number } => ({
  blurStrength: getCssVarInt('--node-faded-blur'),
  fadedAlpha: getCssVarFloat('--node-faded-alpha'),
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
 * Applies blur effect to a node.
 * Alpha is handled separately via setNodeAlpha for smooth animation.
 */
const applyNodeBlur = (
  node: GraphNode,
  highlighted: boolean,
  useBlur: boolean,
  styles: { blurStrength: number }
): void => {
  setNodeBlur(node, useBlur && !highlighted ? styles.blurStrength : 0);
};

export interface SelectionHighlighterDeps {
  nodeMap: Map<string, GraphNode>;
  stepNodeMap: Map<string, GraphNode>;
  stepEdgeLayer: unknown;
  steps: unknown[];
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  useBlur?: boolean;
}

/**
 * Helper to set visibility state for a map of nodes.
 * Uses alpha for dimming in normal view, blur when useBlur is true.
 */
function setNodeMapVisibility(
  nodeMap: Map<string, GraphNode>,
  setNodeAlpha: (nodeId: string, alpha: number) => void,
  isHighlighted: (id: string) => boolean,
  isSelected: (id: string) => boolean,
  useBlur: boolean = false
): void {
  const styles = getFadeStyles();
  const defaultAlpha = getCssVarFloat('--node-alpha');

  nodeMap.forEach((node, nodeId) => {
    const highlighted = isHighlighted(nodeId);
    applyNodeBlur(node, highlighted, useBlur, styles);
    const alpha = highlighted ? 1 : (useBlur ? styles.fadedAlpha : defaultAlpha);
    setNodeAlpha(nodeId, alpha);
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
    clearSelection(deps);
    return;
  }

  if (selection.type === 'node') {
    highlightNode(selection.nodeId, deps);
  }
};

/**
 * Applies selection highlighting to a specific node.
 * Fades all other nodes. Edge rendering handled by workflowRenderer.
 */
const highlightNode = (
  selectedId: string,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap, setNodeAlpha, useBlur = false } = deps;

  // Highlight only the selected node
  setNodeMapVisibility(
    nodeMap,
    setNodeAlpha,
    (id) => id === selectedId,
    (id) => id === selectedId,
    useBlur
  );
};

/**
 * Clears all selection visuals, restoring default state (no blur).
 * Workflow edge rendering handled by workflowRenderer.
 */
export const clearSelection = (deps: SelectionHighlighterDeps): void => {
  const { nodeMap, setNodeAlpha } = deps;

  const nodeAlpha = getCssVarFloat('--node-alpha');
  nodeMap.forEach((node, nodeId) => {
    setNodeAlpha(nodeId, nodeAlpha);
    setNodeBlur(node, 0);
    node.setSelected(false);
  });
};

/**
 * Applies phase filter, blurring nodes that don't match the selected phase.
 */
export const applyPhaseFilter = (
  phase: Phase | null,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap } = deps;
  const { blurStrength } = getFadeStyles();

  if (!phase) {
    // Clear filter - remove blur from all nodes
    nodeMap.forEach((node) => setNodeBlur(node, 0));
    return;
  }

  // Blur nodes that don't match the phase
  nodeMap.forEach((node) => {
    const matches = node.nodeData.phase === phase;
    setNodeBlur(node, matches ? 0 : blurStrength);
  });
};
