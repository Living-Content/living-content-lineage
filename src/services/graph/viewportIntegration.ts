/**
 * Viewport integration utilities for centering and panning.
 */
import gsap from 'gsap';
import type { Container } from 'pixi.js';
import type { PillNode } from './nodeRenderer.js';
import type { ViewportState } from './viewport.js';
import type { StageLabels } from './stageLabelRenderer.js';
import { PANEL_DETAIL_MAX_WIDTH, PANEL_MARGIN, MOBILE_BREAKPOINT } from '../../config/constants.js';

export interface CenteringDeps {
  nodeMap: Map<string, PillNode>;
  viewport: Container;
  viewportState: ViewportState;
  stageLabels: StageLabels;
  cullAndRender: () => void;
}

/**
 * Centers a selected node on the right side of viewport when detail panel is open.
 */
export const centerSelectedNode = (
  nodeId: string,
  deps: CenteringDeps
): void => {
  const { nodeMap, viewport, viewportState, stageLabels, cullAndRender } = deps;

  const node = nodeMap.get(nodeId);
  if (!node) return;

  const currentWidth = viewportState.width;
  const currentHeight = viewportState.height;

  // Skip on mobile - panel is full width at bottom
  if (currentWidth <= MOBILE_BREAKPOINT) return;

  // Calculate the panel width (half viewport, max 800px)
  const panelWidth = Math.min(currentWidth * 0.5 - PANEL_MARGIN * 2, PANEL_DETAIL_MAX_WIDTH) + PANEL_MARGIN * 2;

  // Target: center the node in the right half of the viewport (after the panel)
  const rightHalfCenterX = panelWidth + (currentWidth - panelWidth) / 2;
  const targetScreenX = rightHalfCenterX;
  const targetScreenY = currentHeight / 2;

  // Calculate where viewport needs to move so node appears at target screen position
  const nodeWorldX = node.position.x;
  const nodeWorldY = node.position.y;
  const targetViewportX = targetScreenX - nodeWorldX * viewportState.scale;
  const targetViewportY = targetScreenY - nodeWorldY * viewportState.scale;

  // Animate the pan
  gsap.to(viewportState, {
    x: targetViewportX,
    y: targetViewportY,
    duration: 0.3,
    ease: 'power2.out',
    onUpdate: () => {
      viewport.position.set(viewportState.x, viewportState.y);
      stageLabels.update(viewportState);
      cullAndRender();
    },
  });
};

export interface ResizeHandlerDeps {
  container: HTMLElement;
  viewportState: ViewportState;
  app: { resize: () => void };
  stageLabels: StageLabels;
  lodController: { state: { isCollapsed: boolean } };
  cullAndRender: () => void;
  updateTitlePosition: () => void;
  detailPanelOpen: boolean;
  selectedNodeId: string | null;
  centerSelectedNode: (nodeId: string) => void;
}

/**
 * Creates a debounced resize handler.
 */
export const createResizeHandler = (
  getDeps: () => ResizeHandlerDeps
): { observer: ResizeObserver; cleanup: () => void } => {
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  const handleResize = (): void => {
    const deps = getDeps();

    // Update cached dimensions
    const newWidth = deps.container.clientWidth;
    const newHeight = deps.container.clientHeight;
    deps.viewportState.width = newWidth;
    deps.viewportState.height = newHeight;

    // Resize the Pixi app
    deps.app.resize();

    // Update stage labels
    deps.stageLabels.update(deps.viewportState);

    // Re-center selected node if detail panel is open
    if (deps.detailPanelOpen && deps.selectedNodeId) {
      deps.centerSelectedNode(deps.selectedNodeId);
    }

    // Re-render
    if (!deps.lodController.state.isCollapsed) {
      deps.cullAndRender();
    } else {
      deps.updateTitlePosition();
    }
  };

  const observer = new ResizeObserver(() => {
    // Debounce resize handling
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(handleResize, 100);
  });

  const cleanup = (): void => {
    observer.disconnect();
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
  };

  return { observer, cleanup };
};
