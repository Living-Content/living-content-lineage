/**
 * Viewport controller for zoom/pan with coordinate transforms.
 */
import { Container } from 'pixi.js';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_DEFAULT } from '../../../config/viewport.js';

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export interface ViewportBounds {
  topWorldY: number;    // World Y of topmost node
  bottomWorldY: number; // World Y of bottommost node
  topMargin: number;    // Screen Y where top bound should stop
  bottomMargin: number; // Screen Y offset from bottom where content should still be visible
}

export interface ViewportCallbacks {
  onZoom: (scale: number) => void;
  onPan: () => void;
  onPanStart: () => void;
  onPanEnd: () => void;
  isZoomBlocked?: () => boolean;
  isInteractionBlocked?: () => boolean;
  getBounds?: () => ViewportBounds | null;
}

export const screenToWorld = (
  screenX: number,
  screenY: number,
  state: ViewportState
): { x: number; y: number } => {
  return {
    x: (screenX - state.x) / state.scale,
    y: (screenY - state.y) / state.scale,
  };
};

export const worldToScreen = (
  worldX: number,
  worldY: number,
  state: ViewportState
): { x: number; y: number } => {
  return {
    x: state.x + worldX * state.scale,
    y: state.y + worldY * state.scale,
  };
};

export const createViewportState = (width: number, height: number): ViewportState => {
  return {
    x: width / 2,
    y: height / 2,
    scale: ZOOM_DEFAULT,
    width,
    height,
  };
};

export const createViewportHandlers = (
  canvas: HTMLCanvasElement,
  viewport: Container,
  container: HTMLElement,
  state: ViewportState,
  callbacks: ViewportCallbacks
): { destroy: () => void } => {
  let isDragging = false;
  let lastPointerPos = { x: 0, y: 0 };

  /**
   * Clamps the viewport position to keep content within bounds.
   */
  const clampPosition = (): void => {
    const bounds = callbacks.getBounds?.();
    if (!bounds) return;

    // Convert world bounds to screen positions
    // Upper bound: top node screen Y should not go below topMargin
    // topScreenY = state.y + bounds.topWorldY * state.scale
    // Ensure: topScreenY >= topMargin
    // state.y >= topMargin - bounds.topWorldY * state.scale
    const minY = bounds.topMargin - bounds.topWorldY * state.scale;

    // Lower bound: bottom node screen Y should not go above (height - bottomMargin)
    // bottomScreenY = state.y + bounds.bottomWorldY * state.scale
    // Ensure: bottomScreenY <= height - bottomMargin
    // state.y <= height - bottomMargin - bounds.bottomWorldY * state.scale
    const maxY = state.height - bounds.bottomMargin - bounds.bottomWorldY * state.scale;

    // Only clamp if bounds make sense (min < max means we have room to move)
    if (minY < maxY) {
      state.y = Math.max(minY, Math.min(maxY, state.y));
    }
  };

  const handleWheel = (e: WheelEvent): void => {
    e.preventDefault();

    // Block zoom during LOD animation or when interaction is blocked (detail view)
    if (callbacks.isZoomBlocked?.() || callbacks.isInteractionBlocked?.()) return;

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

    clampPosition();

    viewport.scale.set(state.scale);
    viewport.position.set(state.x, state.y);

    callbacks.onZoom(state.scale);
  };

  const handlePointerDown = (e: PointerEvent): void => {
    // Block pan when interaction is blocked (detail view)
    if (callbacks.isInteractionBlocked?.()) return;

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

    clampPosition();

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
};
