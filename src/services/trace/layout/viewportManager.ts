/**
 * Viewport orchestration for centering, resize handling, and updates.
 * Consolidates viewport-related logic from graphController.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { getCssVarInt } from '../../../themes/theme.js';
import { uiState } from '../../../stores/uiState.svelte.js';
import { ZOOM_MIN, ZOOM_MAX, VIEW_INITIAL_ZOOM_MIN } from '../../../config/viewport.js';
import { ANIMATION_TIMINGS } from '../../../config/animation.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { TopNodeInfo } from '../rendering/labelRenderer.js';
import type { NodeAccessor } from './nodeAccessor.js';
import type { ViewLevel } from '../../../config/types.js';

export type SetContainerScaleFn = (scale: number) => void;

export interface CardBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ViewportManagerDeps {
  nodeAccessor: NodeAccessor;
  viewport: Container;
  viewportState: ViewportState;
  onUpdate: () => void;  // Single callback - coordinator handles view-specific logic
  getTopNodeInfo: () => TopNodeInfo | null;
  getBottomNodeInfo: () => TopNodeInfo | null;
  setContainerScale: SetContainerScaleFn;  // Sets scale on active level container
  getCurrentViewLevel: () => ViewLevel;
  getWorkflowCardBounds: () => CardBounds;
  getContentSessionCardBounds: () => CardBounds;
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
  setPositionForCurrentView: () => void;  // Set position immediately, no animation
  destroy: () => void;
}

/**
 * Creates a viewport manager with node centering capabilities.
 */
export function createViewportManager(deps: ViewportManagerDeps): ViewportManager {
  const {
    nodeAccessor,
    viewport,
    viewportState,
    onUpdate,
    setContainerScale,
    getCurrentViewLevel,
    getWorkflowCardBounds,
    getContentSessionCardBounds,
  } = deps;

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
        setContainerScale(viewportState.scale);
        onUpdate();
      },
      onComplete,
    });
  };

  /**
   * Gets bounds for the current view level.
   * - content-session: single content session card
   * - workflow-overview: all workflow cards
   * - workflow-detail: all detail nodes
   */
  const getBoundsForCurrentLevel = (): { minX: number; maxX: number; minY: number; maxY: number } | null => {
    const level = getCurrentViewLevel();

    if (level === 'content-session') {
      return getContentSessionCardBounds();
    }

    if (level === 'workflow-overview') {
      return getWorkflowCardBounds();
    }

    // workflow-detail: use all nodes
    const nodeMap = nodeAccessor.getActiveMap();
    if (nodeMap.size === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodeMap.forEach((node) => {
      const halfW = node.nodeWidth / 2;
      const halfH = node.nodeHeight / 2;
      minX = Math.min(minX, node.position.x - halfW);
      maxX = Math.max(maxX, node.position.x + halfW);
      minY = Math.min(minY, node.position.y - halfH);
      maxY = Math.max(maxY, node.position.y + halfH);
    });

    return { minX, maxX, minY, maxY };
  };

  /**
   * Zooms to fit all content within viewport bounds, centered.
   * Uses view-level-aware bounds calculation.
   */
  const zoomToBounds = (nodeId?: string, options: ZoomToBoundsOptions = {}): void => {
    const bounds = getBoundsForCurrentLevel();
    if (!bounds) {
      options.onComplete?.();
      return;
    }

    const { minX, maxX, minY, maxY } = bounds;

    // Cancel any in-flight animation
    gsap.killTweensOf(viewportState);

    // Content dimensions with padding (read from CSS)
    const padding = getCssVarInt('--space-3xl');
    const contentWidth = (maxX - minX) + padding * 2;
    const contentHeight = (maxY - minY) + padding * 2;
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    // Available screen space (read margins from CSS)
    const headerHeight = getCssVarInt('--header-height');
    const availableWidth = viewportState.width - padding * 2;
    const availableHeight = viewportState.height - headerHeight - padding;

    // Scale to fit both dimensions, clamped to zoom limits
    const fitScaleX = availableWidth / contentWidth;
    const fitScaleY = availableHeight / contentHeight;
    const fitScale = Math.min(fitScaleX, fitScaleY);
    const targetScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fitScale));

    // Center on selected node if provided (only for detail view), otherwise center content
    const node = nodeId ? nodeAccessor.getAny(nodeId) : null;
    let targetX: number;
    let targetY: number;

    if (node && getCurrentViewLevel() === 'workflow-detail') {
      targetX = viewportState.width / 2 - node.position.x * targetScale;
      targetY = viewportState.height / 2 - node.position.y * targetScale;
    } else {
      // Center content vertically within available space (below header)
      const screenCenterX = viewportState.width / 2;
      const screenCenterY = headerHeight + availableHeight / 2;
      targetX = screenCenterX - contentCenterX * targetScale;
      targetY = screenCenterY - contentCenterY * targetScale;
    }

    gsap.to(viewportState, {
      x: targetX,
      y: targetY,
      scale: targetScale,
      duration: ANIMATION_TIMINGS.VIEWPORT_ZOOM_DURATION,
      ease: 'power2.out',
      onUpdate: () => {
        viewport.position.set(viewportState.x, viewportState.y);
        setContainerScale(viewportState.scale);
        onUpdate();
      },
      onComplete: options.onComplete,
    });
  };

  /**
   * Gets the first node for the current view level.
   * - workflow-overview: first workflow card (topmost)
   * - workflow-detail: first step of first workflow (leftmost in topmost row)
   */
  const getFirstNodeForCurrentLevel = (): { x: number; y: number } | null => {
    const level = getCurrentViewLevel();

    if (level === 'content-session') {
      const bounds = getContentSessionCardBounds();
      if (!bounds) return null;
      return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    }

    if (level === 'workflow-overview') {
      const bounds = getWorkflowCardBounds();
      if (!bounds) return null;
      // Position on top-left area (first workflow)
      return { x: bounds.minX + 200, y: bounds.minY + 150 };
    }

    // workflow-detail: find the leftmost node in the topmost row
    const nodeMap = nodeAccessor.getActiveMap();
    if (nodeMap.size === 0) return null;

    let firstNode: { x: number; y: number } | null = null;
    let minY = Infinity;
    let minXAtMinY = Infinity;

    nodeMap.forEach((node) => {
      // Find topmost row first
      if (node.position.y < minY || (node.position.y === minY && node.position.x < minXAtMinY)) {
        minY = node.position.y;
        minXAtMinY = node.position.x;
        firstNode = { x: node.position.x, y: node.position.y };
      }
    });

    return firstNode;
  };

  /**
   * Sets viewport position immediately for current view level (no animation).
   * Used during view transitions when nothing is visible.
   * Positions on the first node of the view to provide a good starting point.
   */
  const setPositionForCurrentView = (): void => {
    const level = getCurrentViewLevel();
    const firstNode = getFirstNodeForCurrentLevel();
    if (!firstNode) return;

    // Cancel any in-flight animation
    gsap.killTweensOf(viewportState);

    // Use view-specific minimum zoom
    const viewMinZoom = VIEW_INITIAL_ZOOM_MIN[level];
    const targetScale = Math.max(viewMinZoom, Math.min(ZOOM_MAX, viewMinZoom));

    // Position viewport to show the first node in the upper-left quadrant
    const headerHeight = getCssVarInt('--header-height');
    const padding = getCssVarInt('--space-3xl');

    // Position first node at roughly 1/3 from left and 1/3 from top (below header)
    const targetX = viewportState.width * 0.33 - firstNode.x * targetScale;
    const targetY = headerHeight + padding + (viewportState.height - headerHeight) * 0.25 - firstNode.y * targetScale;

    // Set immediately
    viewportState.x = targetX;
    viewportState.y = targetY;
    viewportState.scale = targetScale;
    viewport.position.set(targetX, targetY);
    setContainerScale(targetScale);
    onUpdate();
  };

  const destroy = (): void => {
    gsap.killTweensOf(viewportState);
  };

  return {
    centerOnNode,
    zoomToBounds,
    setPositionForCurrentView,
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
