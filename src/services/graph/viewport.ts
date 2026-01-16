/**
 * Viewport controller for zoom/pan with coordinate transforms.
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

export interface ViewportCallbacks {
  onZoom: (scale: number) => void;
  onPan: () => void;
  onPanStart: () => void;
  onPanEnd: () => void;
  isZoomBlocked?: () => boolean;
}

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

export function createViewportState(width: number, height: number): ViewportState {
  return {
    x: width / 2,
    y: height / 2,
    scale: ZOOM_DEFAULT,
    width,
    height,
  };
}

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

    // Block zoom during LOD animation
    if (callbacks.isZoomBlocked?.()) return;

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
