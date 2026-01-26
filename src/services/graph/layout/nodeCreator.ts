/**
 * Node creation and layout for the graph.
 * Handles creating graph nodes and repositioning with edge gaps.
 */
import type { Ticker, Container } from 'pixi.js';
import type { TraceNodeData } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { getCssVarInt } from '../../../themes/index.js';
import { traceState } from '../../../stores/traceState.svelte.js';
import {
  createNode,
  addElementsToLayer,
  populateElementMap,
  type HoverPayload,
  type CreateElementConfig,
  type HoverCallbackConfig,
} from './utils.js';

interface NodeCreatorCallbacks {
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
  onNodeClick?: (node: TraceNodeData) => void;
}

interface NodeCreatorDeps {
  container: HTMLElement;
  nodeLayer: Container;
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
    onNodeClick: deps.callbacks.onNodeClick,
  };

  return {
    graphScale: deps.graphScale,
    ticker: deps.ticker,
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
  const { hoverConfig } = config;

  const elements = await Promise.all(
    nodes.map((node) => createNode({
      id: node.id,
      data: node,
      type: 'node',
      onClick: () => {
        if (hoverConfig.onNodeClick) {
          hoverConfig.onNodeClick(node);
        } else {
          traceState.selectNode(node);
        }
      },
    }, config))
  );

  addElementsToLayer(elements, deps.nodeLayer);
  populateElementMap(elements, nodeMap);
};

/**
 * Repositions nodes: left-aligned within each step column, stacked vertically.
 * Claims and Actions keep their original Y positions - only regular asset nodes stack.
 * Used for expanded view nodes.
 */
export const repositionNodesWithGaps = (nodeMap: Map<string, GraphNode>): void => {
  // Separate nodes into stackable (regular assets) and non-stackable (claims, actions)
  const isStackable = (node: GraphNode): boolean => {
    const data = node.nodeData;
    return data.nodeType !== 'claim' && data.assetType !== 'Action';
  };

  // Group nodes by their original X position (step column)
  const nodesByX = new Map<number, { stackable: GraphNode[]; fixed: GraphNode[] }>();
  nodeMap.forEach((node) => {
    const x = Math.round(node.position.x);
    if (!nodesByX.has(x)) nodesByX.set(x, { stackable: [], fixed: [] });
    const group = nodesByX.get(x)!;
    if (isStackable(node)) {
      group.stackable.push(node);
    } else {
      group.fixed.push(node);
    }
  });

  // Sort groups by X position (left to right)
  const sortedGroups = Array.from(nodesByX.entries())
    .sort((a, b) => a[0] - b[0])
    .map((entry) => entry[1]);

  // Sort stackable nodes within each group by Y position (top to bottom)
  for (const group of sortedGroups) {
    group.stackable.sort((a, b) => a.position.y - b.position.y);
  }

  const nodeGap = getCssVarInt('--node-vertical-gap');
  let rightEdge = -Infinity;

  for (const group of sortedGroups) {
    const allNodes = [...group.stackable, ...group.fixed];
    if (allNodes.length === 0) continue;

    // All nodes in the same group have the same width (per-group max from traceState)
    const maxWidth = group.stackable[0]?.nodeWidth ?? group.fixed[0]?.nodeWidth ?? 0;

    // Calculate new X position (left edge of column)
    const firstNode = group.stackable[0] ?? group.fixed[0];
    const columnLeftX = rightEdge === -Infinity
      ? firstNode.position.x - maxWidth / 2
      : rightEdge + getCssVarInt('--expanded-edge-gap');

    // Stack only stackable nodes vertically, left-aligned
    if (group.stackable.length > 0) {
      let currentY = group.stackable[0].position.y - group.stackable[0].nodeHeight / 2;

      for (const node of group.stackable) {
        const newX = columnLeftX + node.nodeWidth / 2;
        const newY = currentY + node.nodeHeight / 2;

        node.position.x = newX;
        node.position.y = newY;

        currentY += node.nodeHeight + nodeGap;
      }
    }

    // Fixed nodes (claims, actions) only get X repositioned, keep original Y
    for (const node of group.fixed) {
      const newX = columnLeftX + maxWidth / 2; // Center in column
      node.position.x = newX;
    }

    // Update right edge for next column
    rightEdge = columnLeftX + maxWidth;
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

    rightEdge = newX + halfWidth;
  }
};
