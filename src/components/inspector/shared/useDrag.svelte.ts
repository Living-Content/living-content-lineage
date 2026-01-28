/**
 * Composable for drag-to-reposition functionality.
 * Tracks drag state and updates position based on mouse movement.
 */

export interface DragState {
  readonly isDragging: boolean;
  readonly customPosition: { x: number; y: number } | null;
}

export interface DragHandlers {
  startDrag: (e: MouseEvent, currentPosition: { x: number; y: number }) => void;
  resetPosition: () => void;
}

export function useDrag(): DragState & DragHandlers {
  let isDragging = $state(false);
  let customPosition = $state<{ x: number; y: number } | null>(null);
  let dragOffset = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDragMove = (e: MouseEvent): void => {
    if (!isDragging) return;
    customPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    };
  };

  const handleDragEnd = (): void => {
    isDragging = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  const startDrag = (e: MouseEvent, currentPosition: { x: number; y: number }): void => {
    isDragging = true;
    dragOffset = {
      x: e.clientX - currentPosition.x,
      y: e.clientY - currentPosition.y,
    };
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const resetPosition = (): void => {
    customPosition = null;
  };

  return {
    get isDragging() {
      return isDragging;
    },
    get customPosition() {
      return customPosition;
    },
    startDrag,
    resetPosition,
  };
}
