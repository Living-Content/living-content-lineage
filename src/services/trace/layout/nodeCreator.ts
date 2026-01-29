/**
 * Node creation and layout for the graph.
 * Handles creating graph nodes and repositioning with edge gaps.
 */
import type { Ticker, Container } from 'pixi.js';
import type { TraceNodeData } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { getCssVarInt } from '../../../themes/theme.js';
import { traceState } from '../../../stores/traceState.svelte.js';
import {
  createNode,
  addElementsToContainer,
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
  htmlContainer: HTMLElement;
  pixiContainer: Container;
  graphScale: number;
  ticker: Ticker;
  callbacks: NodeCreatorCallbacks;
  getSelectedNodeId: () => string | null;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  yOffset?: number;
  stepWidths?: Map<number, number>;
}

/**
 * Builds the unified element config from node creator deps.
 */
const buildElementConfig = (
  deps: NodeCreatorDeps,
  nodeMap: Map<string, GraphNode>
): CreateElementConfig => {
  const hoverConfig: HoverCallbackConfig = {
    container: deps.htmlContainer,
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
    stepWidths: deps.stepWidths,
  };
};

/**
 * Creates all nodes from trace data and adds them to the container.
 */
export const createNodes = async (
  nodes: TraceNodeData[],
  nodeMap: Map<string, GraphNode>,
  deps: NodeCreatorDeps
): Promise<void> => {
  const config = buildElementConfig(deps, nodeMap);
  const { hoverConfig } = config;
  const yOffset = deps.yOffset ?? 0;

  const elements = await Promise.all(
    nodes.map((node) => {
      // Apply Y offset for workflow positioning
      const positionedNode = yOffset !== 0
        ? { ...node, y: (node.y ?? 0.5) + yOffset }
        : node;

      return createNode({
        id: node.id,
        data: positionedNode,
        type: 'node',
        onClick: () => {
          if (hoverConfig.onNodeClick) {
            hoverConfig.onNodeClick(node);
          } else {
            traceState.selectNode(node);
          }
        },
      }, config);
    })
  );

  addElementsToContainer(elements, deps.pixiContainer);
  populateElementMap(elements, nodeMap);
};

/**
 * Repositions nodes: left-aligned within each step column, stacked vertically.
 * Actions keep their original Y positions - only regular asset nodes stack.
 * Claims are excluded here and repositioned separately to follow their verified nodes.
 * Used for expanded view nodes.
 */
export const repositionNodesWithGaps = (nodeMap: Map<string, GraphNode>): void => {
  // Separate nodes: stackable assets, actions, and claims (handled separately)
  const isStackable = (node: GraphNode): boolean => {
    const data = node.nodeData;
    return data.nodeType !== 'claim' && data.assetType !== 'Action';
  };
  const isAction = (node: GraphNode): boolean => node.nodeData.assetType === 'Action';
  const isClaim = (node: GraphNode): boolean => node.nodeData.nodeType === 'claim';

  // Collect claims separately - they'll be repositioned after their verified nodes
  const claimNodes: GraphNode[] = [];

  // Build a map of original X positions to nodes (BEFORE any repositioning)
  // Claims have same X as their verified node in traceLayout
  const originalXToNodes = new Map<number, GraphNode[]>();
  nodeMap.forEach((node) => {
    if (isClaim(node)) return;
    const x = Math.round(node.position.x);
    if (!originalXToNodes.has(x)) originalXToNodes.set(x, []);
    originalXToNodes.get(x)!.push(node);
  });

  // Map claims to their verified nodes using original X position
  const claimToVerifiedNode = new Map<GraphNode, GraphNode>();

  // Group nodes by their original X position (step column)
  const nodesByX = new Map<number, { stackable: GraphNode[]; actions: GraphNode[] }>();
  nodeMap.forEach((node) => {
    if (isClaim(node)) {
      claimNodes.push(node);
      // Find the verified node at same original X
      const claimX = Math.round(node.position.x);
      const candidates = originalXToNodes.get(claimX) ?? [];
      // Pick the first non-action candidate (the asset being verified)
      const verified = candidates.find((n) => n.nodeData.assetType !== 'Action');
      if (verified) {
        claimToVerifiedNode.set(node, verified);
      }
      return;
    }
    const x = Math.round(node.position.x);
    if (!nodesByX.has(x)) nodesByX.set(x, { stackable: [], actions: [] });
    const group = nodesByX.get(x)!;
    if (isStackable(node)) {
      group.stackable.push(node);
    } else if (isAction(node)) {
      group.actions.push(node);
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
    const allNodes = [...group.stackable, ...group.actions];
    if (allNodes.length === 0) continue;

    // All nodes in the same group have the same width (per-group max from traceState)
    const maxWidth = group.stackable[0]?.nodeWidth ?? group.actions[0]?.nodeWidth ?? 0;

    // Calculate new X position (left edge of column)
    const firstNode = group.stackable[0] ?? group.actions[0];
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

    // Actions only get X repositioned, keep original Y
    for (const node of group.actions) {
      const newX = columnLeftX + maxWidth / 2; // Center in column
      node.position.x = newX;
    }

    // Update right edge for next column
    rightEdge = columnLeftX + maxWidth;
  }

  // Reposition claims to follow their verified nodes
  // Use the mapping we built before repositioning
  for (const claim of claimNodes) {
    const verifiedNode = claimToVerifiedNode.get(claim);
    if (verifiedNode) {
      claim.position.x = verifiedNode.position.x;
    }
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
