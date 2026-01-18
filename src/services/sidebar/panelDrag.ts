/**
 * Panel drag functionality for repositioning the info panel.
 */
import {
  PANEL_MARGIN,
  PANEL_MIN_EXPANDED_WIDTH,
  PANEL_MIN_EXPANDED_HEIGHT,
  MOBILE_BREAKPOINT,
} from '../../config/constants.js';

export interface DragState {
  isDragging: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  panelX: number | null;
  panelY: number | null;
}

export interface DragCallbacks {
  onDragStateChange: (state: Partial<DragState>) => void;
}

export const createDragHandler = (
  getElement: () => HTMLElement | null,
  getState: () => DragState,
  callbacks: DragCallbacks
) => {
  const isMobile = (): boolean => {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  };

  const onDrag = (e: MouseEvent): void => {
    const element = getElement();
    const state = getState();
    if (!state.isDragging || !element) return;

    // Constrain so expanded panel has minimum usable size
    const minX = PANEL_MARGIN;
    const maxX = window.innerWidth - PANEL_MIN_EXPANDED_WIDTH - PANEL_MARGIN;
    const minY = PANEL_MARGIN;
    const maxY = window.innerHeight - PANEL_MIN_EXPANDED_HEIGHT - PANEL_MARGIN;

    const newX = Math.max(minX, Math.min(maxX, e.clientX - state.dragOffsetX));
    const newY = Math.max(minY, Math.min(maxY, e.clientY - state.dragOffsetY));

    // Directly set styles during drag for immediate feedback
    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
    element.style.transform = 'none';

    callbacks.onDragStateChange({ panelX: newX, panelY: newY });
  };

  const stopDrag = (): void => {
    callbacks.onDragStateChange({ isDragging: false });
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  const startDrag = (e: MouseEvent, isAnimating: boolean, isDetailOpen: boolean): void => {
    if (isAnimating || isDetailOpen || isMobile()) return;

    const element = getElement();
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const dragOffsetX = e.clientX - rect.left;
    const dragOffsetY = e.clientY - rect.top;

    // Initialize position from current visual position
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.transform = 'none';

    callbacks.onDragStateChange({
      isDragging: true,
      dragOffsetX,
      dragOffsetY,
      panelX: rect.left,
      panelY: rect.top,
    });

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const cleanup = (): void => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  return {
    startDrag,
    cleanup,
    isMobile,
  };
};
