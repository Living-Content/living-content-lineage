/**
 * Keyboard navigation for graph nodes.
 * Handles arrow key navigation between nodes and Enter/Escape for expand/collapse.
 */
import { traceState } from '../../../stores/traceState.svelte.js';
import type { TraceNodeData, StepUI } from '../../../config/types.js';
import type { NodeAccessor } from '../layout/nodeAccessor.js';

export interface KeyboardNavigationDeps {
  nodeAccessor: NodeAccessor;
  nodes: TraceNodeData[];
  steps: StepUI[];
  onExpand: (node: TraceNodeData) => void;
  onCollapse: () => void;
  onStepSelect: (step: StepUI) => void;
  centerOnNode: (nodeId: string, options?: { onComplete?: () => void }) => void;
  updateOverlayNode: () => void;
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
  const { nodeAccessor, nodes, steps, onExpand, onCollapse, onStepSelect, centerOnNode, updateOverlayNode } = deps;

  const selectableNodes = nodes.filter(n => n.assetType !== 'Action');
  const sortedNodes = sortNodesByPosition(selectableNodes);

  // Sort steps by x position for left/right navigation
  const sortedSteps = [...steps].sort((a, b) => a.xStart - b.xStart);

  /**
   * Get current step index from selection.
   */
  const getCurrentStepIndex = (): number => {
    const selection = traceState.selection;
    if (selection?.type === 'step') {
      return sortedSteps.findIndex(s => s.id === selection.stepId);
    }
    return -1;
  };

  /**
   * Handle step navigation (left/right only).
   */
  const handleStepNavigation = (direction: 'left' | 'right'): boolean => {
    const currentIndex = getCurrentStepIndex();
    let nextIndex: number;

    if (currentIndex === -1) {
      // No step selected, select first or last based on direction
      nextIndex = direction === 'right' ? 0 : sortedSteps.length - 1;
    } else {
      nextIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    }

    if (nextIndex >= 0 && nextIndex < sortedSteps.length) {
      const step = sortedSteps[nextIndex];
      onStepSelect(step);
      centerOnNode(step.id, { onComplete: updateOverlayNode });
      return true;
    }
    return false;
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const selection = traceState.selection;
    const isExpanded = traceState.isExpanded;
    const inStepView = nodeAccessor.isCollapsed();

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
        } else if (selection?.type === 'step' && inStepView) {
          // In step view, Enter on step opens the step detail
          event.preventDefault();
          const step = sortedSteps.find(s => s.id === selection.stepId);
          if (step) {
            onStepSelect(step);
          }
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        event.preventDefault();

        // In step view, only handle left/right for step navigation
        if (inStepView) {
          const direction = event.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
          if (direction === 'left' || direction === 'right') {
            handleStepNavigation(direction);
          }
          // Ignore up/down in step view
          break;
        }

        // Workflow view: standard node navigation
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
            // onExpand already handles centering with onComplete callback
            if (isExpanded) {
              onExpand(nextNode);
            } else {
              // Center on node and update overlay position after animation completes
              centerOnNode(nextNode.id, { onComplete: updateOverlayNode });
            }
          }
        } else if (sortedNodes.length > 0) {
          traceState.selectNode(sortedNodes[0]);
          if (!isExpanded) {
            centerOnNode(sortedNodes[0].id, { onComplete: updateOverlayNode });
          }
        }
        break;
      }
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
