/**
 * Node creation and layout for the graph.
 * Handles creating pill nodes and icon nodes, then repositioning with edge gaps.
 */
import type { Ticker, Container } from 'pixi.js';
import type { LineageNodeData } from '../../../config/types.js';
import { createPillNode, type PillNode, DEFAULT_NODE_ALPHA } from '../rendering/nodeRenderer.js';
import { createIconNode } from '../rendering/iconNodeRenderer.js';
import { getIconNodeConfig } from '../../../theme/theme.js';
import { EDGE_GAP } from '../../../config/constants.js';
import { selectNode } from '../../../stores/lineageState.js';

interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

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
 * Creates all nodes from lineage data and adds them to the node layer.
 */
export const createNodes = async (
  nodes: LineageNodeData[],
  nodeMap: Map<string, PillNode>,
  deps: NodeCreatorDeps
): Promise<void> => {
  const { container, nodeLayer, selectionLayer, graphScale, ticker, callbacks, getSelectedNodeId, setNodeAlpha } = deps;
  const nodeCreationPromises: Promise<void>[] = [];

  for (const node of nodes) {
    const nodeCallbacks = {
      onClick: () => selectNode(node),
      onHover: () => {
        container.style.cursor = 'pointer';
        if (!getSelectedNodeId()) setNodeAlpha(node.id, 1);
        const renderedNode = nodeMap.get(node.id);
        if (renderedNode) {
          const bounds = renderedNode.getBounds();
          const hoverIconConfig = getIconNodeConfig(node.nodeType);
          callbacks.onHover({
            title: node.title ?? node.label,
            nodeType: node.nodeType,
            screenX: bounds.x + bounds.width / 2,
            screenY: bounds.y,
            size: hoverIconConfig?.size ?? 28,
          });
        }
      },
      onHoverEnd: () => {
        container.style.cursor = 'grab';
        if (!getSelectedNodeId()) setNodeAlpha(node.id, DEFAULT_NODE_ALPHA);
        callbacks.onHoverEnd();
      },
    };

    const iconConfig = getIconNodeConfig(node.nodeType);
    if (iconConfig) {
      const promise = createIconNode(node, graphScale, ticker, nodeCallbacks, {
        iconPath: iconConfig.iconPath,
        size: iconConfig.size,
        selectionLayer,
      }).then((iconNode) => {
        nodeLayer.addChild(iconNode);
        nodeMap.set(node.id, iconNode);
      });
      nodeCreationPromises.push(promise);
    } else {
      const pillNode = createPillNode(node, graphScale, ticker, nodeCallbacks, { selectionLayer });
      nodeLayer.addChild(pillNode);
      nodeMap.set(node.id, pillNode);
    }
  }

  await Promise.all(nodeCreationPromises);
};

/**
 * Repositions nodes horizontally to maintain fixed edge gaps between columns.
 */
export const repositionNodesWithGaps = (nodeMap: Map<string, PillNode>): void => {
  const nodesByX = new Map<number, PillNode[]>();
  nodeMap.forEach((node) => {
    const x = Math.round(node.position.x);
    if (!nodesByX.has(x)) nodesByX.set(x, []);
    nodesByX.get(x)!.push(node);
  });

  const sortedGroups = Array.from(nodesByX.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, nodes]) => nodes);

  let rightEdge = -Infinity;
  for (const group of sortedGroups) {
    let maxHalfWidth = 0;
    for (const node of group) {
      maxHalfWidth = Math.max(maxHalfWidth, node.pillWidth / 2);
    }

    const newX = rightEdge === -Infinity ? group[0].position.x : rightEdge + EDGE_GAP + maxHalfWidth;

    for (const node of group) {
      node.position.x = newX;
      if (node.selectionRing) node.selectionRing.position.x = newX;
    }

    rightEdge = newX + maxHalfWidth;
  }
};
