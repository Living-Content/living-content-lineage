/**
 * Panel drag handler for repositioning the info panel.
 * Extracts drag logic from InfoPanel.svelte for better modularity.
 */
import {
  PANEL_MARGIN,
  PANEL_MIN_EXPANDED_WIDTH,
  PANEL_MIN_EXPANDED_HEIGHT,
  MOBILE_BREAKPOINT,
} from '../../../config/constants.js';

export interface DragState {
  isDragging: boolean;
  offsetX: number;
  offsetY: number;
  panelX: number | null;
  panelY: number | null;
}

export interface DragHandler {
  state: DragState;
  startDrag: (e: MouseEvent, element: HTMLElement) => void;
  onDrag: (e: MouseEvent, element: HTMLElement) => void;
  stopDrag: () => void;
  isMobile: () => boolean;
  destroy: () => void;
}

export function createDragHandler(
  onPositionChange: (x: number, y: number) => void
): DragHandler {
  const state: DragState = {
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    panelX: null,
    panelY: null,
  };

  let currentElement: HTMLElement | null = null;

  function isMobile(): boolean {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function startDrag(e: MouseEvent, element: HTMLElement): void {
    if (isMobile()) return;
    state.isDragging = true;
    currentElement = element;

    const rect = element.getBoundingClientRect();
    state.offsetX = e.clientX - rect.left;
    state.offsetY = e.clientY - rect.top;

    // Initialize position from current visual position
    state.panelX = rect.left;
    state.panelY = rect.top;
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.transform = 'none';

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleStopDrag);
  }

  function handleDrag(e: MouseEvent): void {
    if (!state.isDragging || !currentElement) return;

    // Constrain so expanded panel has minimum usable size
    const minX = PANEL_MARGIN;
    const maxX = window.innerWidth - PANEL_MIN_EXPANDED_WIDTH - PANEL_MARGIN;
    const minY = PANEL_MARGIN;
    const maxY = window.innerHeight - PANEL_MIN_EXPANDED_HEIGHT - PANEL_MARGIN;

    const newX = Math.max(minX, Math.min(maxX, e.clientX - state.offsetX));
    const newY = Math.max(minY, Math.min(maxY, e.clientY - state.offsetY));

    // Directly set styles during drag for immediate feedback
    currentElement.style.left = `${newX}px`;
    currentElement.style.top = `${newY}px`;
    currentElement.style.transform = 'none';

    state.panelX = newX;
    state.panelY = newY;
    onPositionChange(newX, newY);
  }

  function onDrag(e: MouseEvent, element: HTMLElement): void {
    if (!state.isDragging) return;
    currentElement = element;
    handleDrag(e);
  }

  function handleStopDrag(): void {
    state.isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleStopDrag);
  }

  function stopDrag(): void {
    handleStopDrag();
  }

  function destroy(): void {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleStopDrag);
  }

  return {
    state,
    startDrag,
    onDrag,
    stopDrag,
    isMobile,
    destroy,
  };
}
