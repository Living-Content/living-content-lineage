/**
 * Keyboard navigation for graph nodes.
 * Handles arrow key navigation between nodes and Enter/Escape for expand/collapse.
 */
import { traceState } from '../../../stores/traceState.svelte.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { TraceNodeData } from '../../../config/types.js';

export interface KeyboardNavigationDeps {
  nodeMap: Map<string, GraphNode>;
  nodes: TraceNodeData[];
  onExpand: (node: TraceNodeData) => void;
  onCollapse: () => void;
  centerOnNode: (nodeId: string) => void;
}

export interface KeyboardNavigationController {
  attach: () => void;
  detach: () => void;
}

/**
 * Sorts nodes by their visual position for navigation.
 * Sorts primarily by Y (top to bottom), then by X (left to right).
 */
const sortNodesByPosition = (nodes: TraceNodeData[]): TraceNodeData[] => {
  return [...nodes].sort((a, b) => {
    const yDiff = (a.y ?? 0.5) - (b.y ?? 0.5);
    if (Math.abs(yDiff) > 0.01) return yDiff;
    return (a.x ?? 0.5) - (b.x ?? 0.5);
  });
};

/**
 * Finds the nearest node in the specified direction.
 */
const findNearestNode = (
  currentNode: TraceNodeData,
  nodes: TraceNodeData[],
  direction: 'up' | 'down' | 'left' | 'right'
): TraceNodeData | null => {
  const currentX = currentNode.x ?? 0.5;
  const currentY = currentNode.y ?? 0.5;

  let candidates: TraceNodeData[] = [];

  switch (direction) {
    case 'up':
      candidates = nodes.filter(n => (n.y ?? 0.5) < currentY && n.id !== currentNode.id);
      break;
    case 'down':
      candidates = nodes.filter(n => (n.y ?? 0.5) > currentY && n.id !== currentNode.id);
      break;
    case 'left':
      candidates = nodes.filter(n => (n.x ?? 0.5) < currentX && n.id !== currentNode.id);
      break;
    case 'right':
      candidates = nodes.filter(n => (n.x ?? 0.5) > currentX && n.id !== currentNode.id);
      break;
  }

  if (candidates.length === 0) return null;

  return candidates.reduce((nearest, node) => {
    const nodeX = node.x ?? 0.5;
    const nodeY = node.y ?? 0.5;
    const nearestX = nearest.x ?? 0.5;
    const nearestY = nearest.y ?? 0.5;

    const nodeDist = Math.sqrt(
      Math.pow(nodeX - currentX, 2) + Math.pow(nodeY - currentY, 2)
    );
    const nearestDist = Math.sqrt(
      Math.pow(nearestX - currentX, 2) + Math.pow(nearestY - currentY, 2)
    );

    return nodeDist < nearestDist ? node : nearest;
  });
};

/**
 * Creates a keyboard navigation controller for graph nodes.
 */
export const createKeyboardNavigation = (deps: KeyboardNavigationDeps): KeyboardNavigationController => {
  const { nodeMap, nodes, onExpand, onCollapse, centerOnNode } = deps;

  const selectableNodes = nodes.filter(n => n.assetType !== 'Action');
  const sortedNodes = sortNodesByPosition(selectableNodes);

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const selection = traceState.selection;
    const isExpanded = traceState.isExpanded;

    switch (event.key) {
      case 'Escape':
        if (isExpanded) {
          event.preventDefault();
          onCollapse();
        } else if (selection) {
          event.preventDefault();
          traceState.clearSelection();
        }
        break;

      case 'Enter':
        if (selection?.type === 'node' && !isExpanded) {
          event.preventDefault();
          onExpand(selection.data);
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();

        // Get current node - use expanded node if overlay open, otherwise selection
        const currentNode = isExpanded
          ? traceState.expandedNode
          : selection?.type === 'node' ? selection.data : null;

        if (currentNode) {
          const direction = event.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
          const nextNode = findNearestNode(currentNode, selectableNodes, direction);
          if (nextNode) {
            traceState.selectNode(nextNode);
            // If overlay is open, expand the new node (keeps overlay open, updates content)
            if (isExpanded) {
              onExpand(nextNode);
            }
            centerOnNode(nextNode.id);
          }
        } else if (sortedNodes.length > 0) {
          traceState.selectNode(sortedNodes[0]);
          centerOnNode(sortedNodes[0].id);
        }
        break;
    }
  };

  const attach = (): void => {
    document.addEventListener('keydown', handleKeyDown);
  };

  const detach = (): void => {
    document.removeEventListener('keydown', handleKeyDown);
  };

  return { attach, detach };
};
