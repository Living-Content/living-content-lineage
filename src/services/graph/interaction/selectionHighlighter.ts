/**
 * Selection highlighting for graph nodes and edges.
 * Manages visual state based on selection changes.
 */
import type { LineageGraph, LineageEdgeData, Stage } from '../../../config/types.js';
import type { PillNode } from '../rendering/nodeRenderer.js';
import { renderEdges } from '../rendering/edgeRenderer.js';
import { renderStageEdges } from '../rendering/stageEdgeRenderer.js';
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
  nodeMap: Map<string, PillNode>;
  stageNodeMap: Map<string, PillNode>;
  edgeLayer: Container;
  dotLayer: Container;
  stageEdgeLayer: Container;
  edges: LineageEdgeData[];
  stages: Stage[];
  verticalAdjacency: VerticalAdjacencyMap;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
}

/**
 * Applies selection highlighting to a specific node.
 * Fades non-connected nodes and highlights the selection path.
 */
export const applySelectionHighlight = (
  selectedId: string,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap, stageNodeMap, edgeLayer, dotLayer, stageEdgeLayer, edges, stages, verticalAdjacency, setNodeAlpha } = deps;
  const verticallyConnected = verticalAdjacency.getConnectedNodeIds(selectedId);

  // Highlight nodes in expanded view
  nodeMap.forEach((node, nodeId) => {
    if (nodeId === selectedId) {
      setNodeAlpha(nodeId, 1);
      node.setSelected(true);
    } else if (verticallyConnected.has(nodeId)) {
      setNodeAlpha(nodeId, 1);
      node.setSelected(false);
    } else {
      setNodeAlpha(nodeId, FADED_NODE_ALPHA);
      node.setSelected(false);
    }
  });

  // Dim stage nodes and edges (for collapsed view consistency)
  stageNodeMap.forEach((node) => {
    node.alpha = FADED_NODE_ALPHA;
    node.setSelected(false);
  });

  renderEdges(edgeLayer, dotLayer, edges, nodeMap, selectedId, verticallyConnected);
  // Dim all stage edges when a node is selected
  renderStageEdges(stageEdgeLayer, stages, stageNodeMap, '');
};

/**
 * Applies selection highlighting to a stage node.
 */
export const applyStageSelectionHighlight = (
  stageId: string,
  deps: SelectionHighlighterDeps
): void => {
  const { nodeMap, stageNodeMap, stageEdgeLayer, stages, setNodeAlpha } = deps;

  // Dim all stage nodes except selected
  stageNodeMap.forEach((node, id) => {
    if (id === stageId) {
      node.alpha = 1;
      node.setSelected(true);
    } else {
      node.alpha = FADED_NODE_ALPHA;
      node.setSelected(false);
    }
  });

  // Also dim expanded nodes for consistency
  nodeMap.forEach((_, nodeId) => {
    setNodeAlpha(nodeId, FADED_NODE_ALPHA);
  });
  nodeMap.forEach((node) => {
    node.setSelected(false);
  });

  // Re-render stage edges with selection highlighting
  renderStageEdges(stageEdgeLayer, stages, stageNodeMap, stageId);
};

/**
 * Clears all selection visuals, restoring default alpha.
 */
export const clearSelectionVisuals = (deps: SelectionHighlighterDeps): void => {
  const { nodeMap, stageNodeMap, edgeLayer, dotLayer, stageEdgeLayer, edges, stages, setNodeAlpha } = deps;

  nodeMap.forEach((node, nodeId) => {
    setNodeAlpha(nodeId, DEFAULT_NODE_ALPHA);
    node.setSelected(false);
  });

  stageNodeMap.forEach((node) => {
    node.alpha = DEFAULT_NODE_ALPHA;
    node.setSelected(false);
  });

  renderEdges(edgeLayer, dotLayer, edges, nodeMap, null, null);
  renderStageEdges(stageEdgeLayer, stages, stageNodeMap, null);
};
