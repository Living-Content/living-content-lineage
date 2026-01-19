/**
 * Viewport orchestration for centering, resize handling, and updates.
 * Consolidates viewport-related logic from graphController.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { getCssVarInt } from '../../../themes/index.js';
import { ZOOM_MAX } from '../../../config/constants.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';

export interface ViewportManagerDeps {
  nodeMap: Map<string, GraphNode>;
  viewport: Container;
  viewportState: ViewportState;
  workflowLabelsUpdate: (state: ViewportState) => void;
  cullAndRender: () => void;
}

export interface ViewportManager {
  centerOnNode: (nodeId: string) => void;
  destroy: () => void;
}

/**
 * Creates a viewport manager with node centering capabilities.
 */
export function createViewportManager(deps: ViewportManagerDeps): ViewportManager {
  const { nodeMap, viewport, viewportState, workflowLabelsUpdate, cullAndRender } = deps;

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
        workflowLabelsUpdate(viewportState);
        cullAndRender();
      },
    });
  }

  function destroy(): void {
    gsap.killTweensOf(viewportState);
  }

  return {
    centerOnNode,
    destroy,
  };
}

export interface ResizeHandlerDeps {
  container: HTMLElement;
  viewportState: ViewportState;
  app: { resize: () => void };
  workflowLabelsUpdate: (state: ViewportState) => void;
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
      deps.workflowLabelsUpdate(deps.viewportState);

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
