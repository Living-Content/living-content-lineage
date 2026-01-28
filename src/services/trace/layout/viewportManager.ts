/**
 * Viewport orchestration for centering, resize handling, and updates.
 * Consolidates viewport-related logic from graphController.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { getCssVarInt } from '../../../themes/theme.js';
import { uiState } from '../../../stores/uiState.svelte.js';
import { ZOOM_MAX, ZOOM_DEFAULT, VIEWPORT_TOP_MARGIN, VIEWPORT_BOTTOM_MARGIN } from '../../../config/viewport.js';
import { ANIMATION_TIMINGS } from '../../../config/animation.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { TopNodeInfo } from '../rendering/labelRenderer.js';
import type { NodeAccessor } from './nodeAccessor.js';

export interface ViewportManagerDeps {
  nodeAccessor: NodeAccessor;
  viewport: Container;
  viewportState: ViewportState;
  onUpdate: () => void;  // Single callback - coordinator handles view-specific logic
  getTopNodeInfo: () => TopNodeInfo | null;
  getBottomNodeInfo: () => TopNodeInfo | null;
}

export interface CenterOptions {
  zoom?: boolean;
  onComplete?: () => void;
}

export interface ZoomToBoundsOptions {
  onComplete?: () => void;
}

export interface ViewportManager {
  centerOnNode: (nodeId: string, options?: CenterOptions) => void;
  zoomToBounds: (nodeId?: string, options?: ZoomToBoundsOptions) => void;
  destroy: () => void;
}

/**
 * Creates a viewport manager with node centering capabilities.
 */
export function createViewportManager(deps: ViewportManagerDeps): ViewportManager {
  const { nodeAccessor, viewport, viewportState, onUpdate, getTopNodeInfo, getBottomNodeInfo } = deps;

  const centerOnNode = (nodeId: string, options: CenterOptions = {}): void => {
    const node = nodeAccessor.getAny(nodeId);
    if (!node) {
      options.onComplete?.();
      return;
    }

    // Cancel any in-flight animation
    gsap.killTweensOf(viewportState);

    const { zoom = false, onComplete } = options;
    const targetScale = zoom ? ZOOM_MAX : viewportState.scale;

    // Always apply panel offset when detail panel is open
    const applyPanelOffset = uiState.isDetailOpen &&
      viewportState.width > getCssVarInt('--mobile-breakpoint');

    let targetX: number;
    if (applyPanelOffset) {
      const panelMargin = getCssVarInt('--panel-margin');
      const panelMaxWidth = getCssVarInt('--panel-max-width');
      const panelWidth = Math.min(viewportState.width * 0.5 - panelMargin * 2, panelMaxWidth) + panelMargin * 2;
      targetX = panelWidth + (viewportState.width - panelWidth) / 2 - node.position.x * targetScale;
    } else {
      targetX = viewportState.width / 2 - node.position.x * targetScale;
    }
    const targetY = viewportState.height / 2 - node.position.y * targetScale;

    gsap.to(viewportState, {
      x: targetX,
      y: targetY,
      scale: targetScale,
      duration: zoom ? ANIMATION_TIMINGS.VIEWPORT_ZOOM_DURATION : ANIMATION_TIMINGS.VIEWPORT_CENTER_DURATION,
      ease: 'power2.out',
      onUpdate: () => {
        viewport.position.set(viewportState.x, viewportState.y);
        viewport.scale.set(viewportState.scale);
        onUpdate();
      },
      onComplete,
    });
  };

  /**
   * Zooms out to fit content within viewport bounds, centered on a node.
   * Used when exiting detail view.
   */
  const zoomToBounds = (nodeId?: string, options: ZoomToBoundsOptions = {}): void => {
    const topNodeInfo = getTopNodeInfo();
    const bottomNodeInfo = getBottomNodeInfo();

    if (!topNodeInfo || !bottomNodeInfo) {
      options.onComplete?.();
      return;
    }

    // Cancel any in-flight animation
    gsap.killTweensOf(viewportState);

    // Calculate the scale needed to fit content within bounds
    const contentWorldHeight = (bottomNodeInfo.worldY + bottomNodeInfo.halfHeight) -
                               (topNodeInfo.worldY - topNodeInfo.halfHeight);
    const availableScreenHeight = viewportState.height - VIEWPORT_TOP_MARGIN - VIEWPORT_BOTTOM_MARGIN;

    // Use default zoom or fit to bounds, whichever is smaller
    const fitScale = availableScreenHeight / contentWorldHeight;
    const targetScale = Math.min(ZOOM_DEFAULT, fitScale);

    // Center on the selected node if provided, otherwise center content
    const node = nodeId ? nodeAccessor.getAny(nodeId) : null;
    let targetX: number;
    let targetY: number;

    if (node) {
      // Center on the selected node
      targetX = viewportState.width / 2 - node.position.x * targetScale;
      targetY = viewportState.height / 2 - node.position.y * targetScale;

      // Clamp Y to stay within bounds
      const minY = VIEWPORT_TOP_MARGIN - (topNodeInfo.worldY - topNodeInfo.halfHeight) * targetScale;
      const maxY = viewportState.height - VIEWPORT_BOTTOM_MARGIN - (bottomNodeInfo.worldY + bottomNodeInfo.halfHeight) * targetScale;
      if (minY < maxY) {
        targetY = Math.max(minY, Math.min(maxY, targetY));
      }
    } else {
      // Center content vertically
      const contentCenterWorldY = (topNodeInfo.worldY - topNodeInfo.halfHeight + bottomNodeInfo.worldY + bottomNodeInfo.halfHeight) / 2;
      const screenCenterY = VIEWPORT_TOP_MARGIN + availableScreenHeight / 2;
      targetX = viewportState.width / 2;
      targetY = screenCenterY - contentCenterWorldY * targetScale;
    }

    gsap.to(viewportState, {
      x: targetX,
      y: targetY,
      scale: targetScale,
      duration: ANIMATION_TIMINGS.VIEWPORT_ZOOM_DURATION,
      ease: 'power2.out',
      onUpdate: () => {
        viewport.position.set(viewportState.x, viewportState.y);
        viewport.scale.set(viewportState.scale);
        onUpdate();
      },
      onComplete: options.onComplete,
    });
  };

  const destroy = (): void => {
    gsap.killTweensOf(viewportState);
  };

  return {
    centerOnNode,
    zoomToBounds,
    destroy,
  };
}

export interface ResizeHandlerDeps {
  container: HTMLElement;
  viewportState: ViewportState;
  app: { resize: () => void };
  onUpdate: () => void;  // Single callback - coordinator handles view-specific logic
  centerSelectedNode: (nodeId: string) => void;
  getDetailPanelOpen: () => boolean;
  getSelectedNodeId: () => string | null;
}

/**
 * Creates a resize observer for the graph container.
 */
export function createResizeHandler(deps: ResizeHandlerDeps): {
  observer: ResizeObserver;
  destroy: () => void;
} {
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  const observer = new ResizeObserver(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      deps.viewportState.width = deps.container.clientWidth;
      deps.viewportState.height = deps.container.clientHeight;
      deps.app.resize();

      const selectedNodeId = deps.getSelectedNodeId();
      if (deps.getDetailPanelOpen() && selectedNodeId) {
        deps.centerSelectedNode(selectedNodeId);
      }

      // Coordinator handles view-specific rendering
      deps.onUpdate();
    }, 100);
  });

  observer.observe(deps.container);

  return {
    observer,
    destroy: () => {
      observer.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
    },
  };
}
