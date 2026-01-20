/**
 * Viewport orchestration for centering, resize handling, and updates.
 * Consolidates viewport-related logic from graphController.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { getCssVarInt } from '../../../themes/index.js';
import { ZOOM_MAX, ZOOM_DEFAULT, VIEWPORT_TOP_MARGIN, VIEWPORT_BOTTOM_MARGIN } from '../../../config/constants.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { TopNodeInfo } from '../rendering/workflowLabelRenderer.js';

export interface ViewportManagerDeps {
  nodeMap: Map<string, GraphNode>;
  viewport: Container;
  viewportState: ViewportState;
  stepLabelsUpdate: (state: ViewportState) => void;
  cullAndRender: () => void;
  topNodeInfo: TopNodeInfo | null;
  bottomNodeInfo: TopNodeInfo | null;
}

export interface ViewportManager {
  centerOnNode: (nodeId: string) => void;
  zoomToBounds: (nodeId?: string) => void;
  destroy: () => void;
}

/**
 * Creates a viewport manager with node centering capabilities.
 */
export function createViewportManager(deps: ViewportManagerDeps): ViewportManager {
  const { nodeMap, viewport, viewportState, stepLabelsUpdate, cullAndRender, topNodeInfo, bottomNodeInfo } = deps;

  function centerOnNode(nodeId: string): void {
    const node = nodeMap.get(nodeId);
    if (!node || viewportState.width <= getCssVarInt('--mobile-breakpoint')) return;

    const panelMargin = getCssVarInt('--panel-margin');
    const panelMaxWidth = getCssVarInt('--panel-max-width');
    const panelWidth = Math.min(viewportState.width * 0.5 - panelMargin * 2, panelMaxWidth) + panelMargin * 2;

    // Zoom to max and calculate position for that scale
    const targetScale = ZOOM_MAX;
    const targetX = panelWidth + (viewportState.width - panelWidth) / 2 - node.position.x * targetScale;
    const targetY = viewportState.height / 2 - node.position.y * targetScale;

    gsap.to(viewportState, {
      x: targetX,
      y: targetY,
      scale: targetScale,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => {
        viewport.position.set(viewportState.x, viewportState.y);
        viewport.scale.set(viewportState.scale);
        stepLabelsUpdate(viewportState);
        cullAndRender();
      },
    });
  }

  /**
   * Zooms out to fit content within viewport bounds, centered on a node.
   * Used when exiting detail view.
   */
  function zoomToBounds(nodeId?: string): void {
    if (!topNodeInfo || !bottomNodeInfo) return;

    // Calculate the scale needed to fit content within bounds
    const contentWorldHeight = (bottomNodeInfo.worldY + bottomNodeInfo.halfHeight) -
                               (topNodeInfo.worldY - topNodeInfo.halfHeight);
    const availableScreenHeight = viewportState.height - VIEWPORT_TOP_MARGIN - VIEWPORT_BOTTOM_MARGIN;

    // Use default zoom or fit to bounds, whichever is smaller
    const fitScale = availableScreenHeight / contentWorldHeight;
    const targetScale = Math.min(ZOOM_DEFAULT, fitScale);

    // Center on the selected node if provided, otherwise center content
    const node = nodeId ? nodeMap.get(nodeId) : null;
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
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => {
        viewport.position.set(viewportState.x, viewportState.y);
        viewport.scale.set(viewportState.scale);
        stepLabelsUpdate(viewportState);
        cullAndRender();
      },
    });
  }

  function destroy(): void {
    gsap.killTweensOf(viewportState);
  }

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
  stepLabelsUpdate: (state: ViewportState) => void;
  cullAndRender: () => void;
  updateTitlePosition: () => void;
  centerSelectedNode: (nodeId: string) => void;
  isCollapsed: () => boolean;
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
      deps.stepLabelsUpdate(deps.viewportState);

      const selectedNodeId = deps.getSelectedNodeId();
      if (deps.getDetailPanelOpen() && selectedNodeId) {
        deps.centerSelectedNode(selectedNodeId);
      }

      if (!deps.isCollapsed()) {
        deps.cullAndRender();
      } else {
        deps.updateTitlePosition();
      }
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
