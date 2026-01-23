/**
 * Node creation and layout for the graph.
 * Handles creating graph nodes and repositioning with edge gaps.
 */
import type { Ticker, Container } from 'pixi.js';
import type { TraceNodeData } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { getCssVarInt } from '../../../themes/index.js';
import {
  createNodeElement,
  addElementsToLayer,
  populateElementMap,
  type HoverPayload,
  type CreateElementConfig,
  type HoverCallbackConfig,
} from './graphLayout.js';

interface NodeCreatorCallbacks {
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
}

interface NodeCreatorDeps {
  container: HTMLElement;
  nodeLayer: Container;
  selectionLayer: Container;
  graphScale: number;
  ticker: Ticker;
  callbacks: NodeCreatorCallbacks;
  getSelectedNodeId: () => string | null;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
}

/**
 * Builds the unified element config from node creator deps.
 */
const buildElementConfig = (
  deps: NodeCreatorDeps,
  nodeMap: Map<string, GraphNode>
): CreateElementConfig => {
  const hoverConfig: HoverCallbackConfig = {
    container: deps.container,
    getSelectedNodeId: deps.getSelectedNodeId,
    setNodeAlpha: deps.setNodeAlpha,
    onHover: deps.callbacks.onHover,
    onHoverEnd: deps.callbacks.onHoverEnd,
  };

  return {
    graphScale: deps.graphScale,
    ticker: deps.ticker,
    selectionLayer: deps.selectionLayer,
    hoverConfig,
    nodeMap,
  };
};

/**
 * Creates all nodes from trace data and adds them to the node layer.
 */
export const createNodes = async (
  nodes: TraceNodeData[],
  nodeMap: Map<string, GraphNode>,
  deps: NodeCreatorDeps
): Promise<void> => {
  const config = buildElementConfig(deps, nodeMap);

  const elements = await Promise.all(
    nodes.map((node) => createNodeElement(node, config))
  );

  addElementsToLayer(elements, deps.nodeLayer);
  populateElementMap(elements, nodeMap);
};

/**
 * Repositions nodes horizontally to maintain fixed edge gaps between columns.
 * Used for expanded view nodes.
 */
export const repositionNodesWithGaps = (nodeMap: Map<string, GraphNode>): void => {
  const nodesByX = new Map<number, GraphNode[]>();
  nodeMap.forEach((node) => {
    const x = Math.round(node.position.x);
    if (!nodesByX.has(x)) nodesByX.set(x, []);
    nodesByX.get(x)!.push(node);
  });

  const sortedGroups = Array.from(nodesByX.entries())
    .sort((a, b) => a[0] - b[0])
    .map((entry) => entry[1]);

  let rightEdge = -Infinity;
  for (const group of sortedGroups) {
    let maxHalfWidth = 0;
    for (const node of group) {
      maxHalfWidth = Math.max(maxHalfWidth, node.nodeWidth / 2);
    }

    const newX = rightEdge === -Infinity ? group[0].position.x : rightEdge + getCssVarInt('--expanded-edge-gap') + maxHalfWidth;

    for (const node of group) {
      node.position.x = newX;
      if (node.selectionRing) node.selectionRing.position.x = newX;
    }

    rightEdge = newX + maxHalfWidth;
  }
};

/**
 * Repositions step nodes horizontally to maintain fixed edge gaps.
 * Used for collapsed view nodes.
 */
export const repositionStepNodesWithGaps = (stepNodeMap: Map<string, GraphNode>): void => {
  const nodes = Array.from(stepNodeMap.values()).sort((a, b) => a.position.x - b.position.x);

  let rightEdge = -Infinity;
  for (const node of nodes) {
    const halfWidth = node.nodeWidth / 2;
    const newX = rightEdge === -Infinity ? node.position.x : rightEdge + getCssVarInt('--collapsed-edge-gap') + halfWidth;

    node.position.x = newX;
    if (node.selectionRing) node.selectionRing.position.x = newX;

    rightEdge = newX + halfWidth;
  }
};
