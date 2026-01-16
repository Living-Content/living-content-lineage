/**
 * Viewport controller for zoom/pan with coordinate transforms.
 * Provides screen-to-world and world-to-screen conversions.
 */
import { Container } from 'pixi.js';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_DEFAULT } from '../../config/constants.js';

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ViewportCallbacks {
  onZoom: (scale: number) => void;
  onPan: () => void;
  onPanStart: () => void;
  onPanEnd: () => void;
}

/**
 * Convert screen coordinates to world coordinates.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  state: ViewportState
): { x: number; y: number } {
  return {
    x: (screenX - state.x) / state.scale,
    y: (screenY - state.y) / state.scale,
  };
}

/**
 * Convert world coordinates to screen coordinates.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  state: ViewportState
): { x: number; y: number } {
  return {
    x: state.x + worldX * state.scale,
    y: state.y + worldY * state.scale,
  };
}

/**
 * Calculate world-space bounds of the current viewport.
 * Returns the rectangular region visible in world coordinates.
 */
export function getWorldBounds(state: ViewportState, padding = 0): ViewportBounds {
  const paddingWorld = padding / state.scale;
  return {
    left: (0 - state.x) / state.scale - paddingWorld,
    right: (state.width - state.x) / state.scale + paddingWorld,
    top: (0 - state.y) / state.scale - paddingWorld,
    bottom: (state.height - state.y) / state.scale + paddingWorld,
  };
}

/**
 * Create initial viewport state centered on the container.
 */
export function createViewportState(width: number, height: number): ViewportState {
  return {
    x: width / 2,
    y: height / 2,
    scale: ZOOM_DEFAULT,
    width,
    height,
  };
}

/**
 * Create and attach viewport event handlers for zoom and pan.
 * Returns cleanup function to remove all listeners.
 */
export function createViewportHandlers(
  canvas: HTMLCanvasElement,
  viewport: Container,
  container: HTMLElement,
  state: ViewportState,
  callbacks: ViewportCallbacks
): { destroy: () => void } {
  let isDragging = false;
  let lastPointerPos = { x: 0, y: 0 };

  const handleWheel = (e: WheelEvent): void => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, state.scale * zoomFactor));

    if (newScale === state.scale) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - state.x) / state.scale;
    const worldY = (mouseY - state.y) / state.scale;

    state.scale = newScale;
    state.x = mouseX - worldX * newScale;
    state.y = mouseY - worldY * newScale;

    viewport.scale.set(state.scale);
    viewport.position.set(state.x, state.y);

    callbacks.onZoom(state.scale);
  };

  const handlePointerDown = (e: PointerEvent): void => {
    if (e.button === 1 || (e.target === canvas && e.button === 0)) {
      isDragging = true;
      lastPointerPos = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
      callbacks.onPanStart();
    }
  };

  const handlePointerMove = (e: PointerEvent): void => {
    if (!isDragging) return;

    const dx = e.clientX - lastPointerPos.x;
    const dy = e.clientY - lastPointerPos.y;

    state.x += dx;
    state.y += dy;
    viewport.position.set(state.x, state.y);

    lastPointerPos = { x: e.clientX, y: e.clientY };
    callbacks.onPan();
  };

  const handlePointerUp = (): void => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = 'grab';
      callbacks.onPanEnd();
    }
  };

  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  container.style.cursor = 'grab';

  return {
    destroy: () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
  };
}
