/**
 * Workflow title overlay with title and workflow ID.
 * Only visible in collapsed (workflow) view.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GraphNode } from './nodeRenderer.js';
import type { ViewportState } from '../interaction/viewport.js';
import { getCssVarColorHex, getCssVar, getCssVarInt, getCssVarFloat } from '../../../themes/index.js';
import { ANIMATION_TIMINGS, GEOMETRY } from '../../../config/animationConstants.js';

export interface TitleOverlay {
  container: Container;
  setVisible: (visible: boolean) => void;
  setMode: (mode: 'fixed' | 'relative') => void;
  setSecondaryVisible: (visible: boolean) => void;
  updatePosition: (leftmostNode: GraphNode, viewportState: ViewportState) => void;
  destroy: () => void;
}

export interface TitleOverlayData {
  title: string;
  workflowId: string;
}

/**
 * Title overlay text elements.
 */
export interface TitleOverlayElements {
  divider: Graphics;
  uuidText: Text;
  titleText: Text;
  dateText: Text;
}

/**
 * Animation controller for title overlay hover effects.
 */
export interface TitleAnimationController {
  cleanup: () => void;
}

/**
 * Creates title overlay text styles.
 */
const createTextStyles = (): { uuid: TextStyle; title: TextStyle; date: TextStyle } => ({
  uuid: new TextStyle({
    fontFamily: getCssVar('--font-mono'),
    fontSize: getCssVarInt('--title-uuid-font-size'),
    fontWeight: '500',
    fill: getCssVarColorHex('--color-node-text'),
    letterSpacing: getCssVarFloat('--title-uuid-letter-spacing'),
  }),
  title: new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: getCssVarInt('--title-main-font-size'),
    fontWeight: '600',
    fill: getCssVarColorHex('--color-node-text'),
    letterSpacing: getCssVarFloat('--title-main-letter-spacing'),
  }),
  date: new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: getCssVarInt('--title-date-font-size'),
    fontWeight: '600',
    fill: getCssVarColorHex('--color-title-secondary'),
    letterSpacing: getCssVarFloat('--title-date-letter-spacing'),
  }),
});

/**
 * Formats the current date for display.
 */
const formatDateString = (): string =>
  new Date()
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

/**
 * Creates the vertical divider line.
 */
const createDivider = (): Graphics => {
  const divider = new Graphics();
  const color = getCssVarColorHex('--color-node-text');
  const alpha = getCssVarFloat('--title-secondary-alpha');

  divider.rect(0, 0, 1, 50);
  divider.fill({ color, alpha });

  return divider;
};

/**
 * Pure creation of title overlay text elements (no side effects).
 */
export const createTitleOverlayElements = (data: TitleOverlayData): TitleOverlayElements => {
  const styles = createTextStyles();
  const dateStr = formatDateString();

  const divider = createDivider();
  const uuidText = new Text({ text: data.workflowId, style: styles.uuid });
  const titleText = new Text({ text: data.title, style: styles.title });
  const dateText = new Text({ text: dateStr, style: styles.date });

  const secondaryAlpha = getCssVarFloat('--title-secondary-alpha');
  uuidText.alpha = secondaryAlpha;
  dateText.alpha = secondaryAlpha;

  return { divider, uuidText, titleText, dateText };
};

/**
 * Attaches title overlay elements to a container (explicit side effect).
 */
export const attachTitleOverlayElements = (
  container: Container,
  elements: TitleOverlayElements
): void => {
  container.addChild(elements.divider);
  container.addChild(elements.uuidText);
  container.addChild(elements.titleText);
  container.addChild(elements.dateText);
};

/**
 * Sets up hover animation for title overlay (returns controller with cleanup).
 */
export const setupTitleAnimation = (
  container: Container,
  elements: TitleOverlayElements
): TitleAnimationController => {
  let targetAlpha = GEOMETRY.TITLE_IDLE_ALPHA;
  let fadeAnimationId: number | null = null;

  const animateAlpha = (): void => {
    const diff = targetAlpha - elements.uuidText.alpha;
    if (Math.abs(diff) < GEOMETRY.TITLE_ANIMATION_THRESHOLD) {
      elements.uuidText.alpha = targetAlpha;
      elements.dateText.alpha = targetAlpha;
      fadeAnimationId = null;
      return;
    }
    elements.uuidText.alpha += diff * ANIMATION_TIMINGS.TITLE_EASE_FACTOR;
    elements.dateText.alpha += diff * ANIMATION_TIMINGS.TITLE_EASE_FACTOR;
    fadeAnimationId = requestAnimationFrame(animateAlpha);
  };

  container.eventMode = 'static';
  container.cursor = 'pointer';

  const onPointerEnter = (): void => {
    targetAlpha = 1;
    if (!fadeAnimationId) fadeAnimationId = requestAnimationFrame(animateAlpha);
  };

  const onPointerLeave = (): void => {
    targetAlpha = GEOMETRY.TITLE_IDLE_ALPHA;
    if (!fadeAnimationId) fadeAnimationId = requestAnimationFrame(animateAlpha);
  };

  container.on('pointerenter', onPointerEnter);
  container.on('pointerleave', onPointerLeave);

  return {
    cleanup: () => {
      if (fadeAnimationId) {
        cancelAnimationFrame(fadeAnimationId);
      }
      container.off('pointerenter', onPointerEnter);
      container.off('pointerleave', onPointerLeave);
    },
  };
};

/**
 * Positions elements relative to a node and viewport.
 */
const positionElementsRelative = (
  elements: TitleOverlayElements,
  leftmostNode: GraphNode,
  viewportState: ViewportState
): void => {
  const textGap = getCssVarInt('--title-divider-gap');
  const lineGap = getCssVarInt('--title-line-gap');

  // Get actual text heights
  const titleHeight = elements.titleText.height;
  const uuidHeight = elements.uuidText.height;
  const dateHeight = elements.dateText.height;
  const totalHeight = titleHeight + lineGap + uuidHeight + lineGap + dateHeight;

  const screenX = viewportState.x + leftmostNode.position.x * viewportState.scale;
  const screenY = viewportState.y + leftmostNode.position.y * viewportState.scale;
  const nodeTop = screenY - (leftmostNode.nodeHeight / 2) * viewportState.scale;
  const nodeLeftEdge = screenX - (leftmostNode.nodeWidth / 2) * viewportState.scale;
  const nodeGap = getCssVarInt('--title-node-gap');
  const titleY = nodeTop - totalHeight - nodeGap;

  // Divider to the left of text
  const dividerX = nodeLeftEdge - textGap - 1;
  elements.divider.position.set(dividerX, titleY);

  // Text aligned with node edge: Title -> UUID -> Date
  elements.titleText.position.set(nodeLeftEdge, titleY);
  elements.uuidText.position.set(nodeLeftEdge, titleY + titleHeight + lineGap);
  elements.dateText.position.set(nodeLeftEdge, titleY + titleHeight + lineGap + uuidHeight + lineGap);
};

/**
 * Create title overlay with workflow metadata (orchestrator maintaining current API).
 */
export function createTitleOverlay(stage: Container, data: TitleOverlayData): TitleOverlay {
  const container = new Container();
  container.eventMode = 'passive';
  stage.addChild(container);

  // Create and attach elements
  const elements = createTitleOverlayElements(data);
  attachTitleOverlayElements(container, elements);

  // Setup animation
  const animationController = setupTitleAnimation(container, elements);

  let currentMode: 'fixed' | 'relative' = 'fixed';

  const setVisible = (visible: boolean): void => {
    container.visible = visible;
  };

  const setSecondaryVisible = (visible: boolean): void => {
    elements.divider.visible = visible;
    elements.uuidText.visible = visible;
    elements.dateText.visible = visible;
  };

  const setMode = (mode: 'fixed' | 'relative'): void => {
    currentMode = mode;
    if (mode === 'fixed') {
      // Hide Pixi overlay when zoomed in - Svelte handles it
      container.visible = false;
      elements.titleText.scale.set(1);
    } else {
      // Show Pixi overlay when zoomed out (step view) - smaller title, no divider
      // Don't show yet - wait for updatePosition to set correct position first
      elements.titleText.scale.set(0.6);
      elements.divider.visible = false;
    }
  };

  const updatePosition = (leftmostNode: GraphNode, viewportState: ViewportState): void => {
    if (currentMode === 'fixed') return;
    positionElementsRelative(elements, leftmostNode, viewportState);
    // Show after positioning to avoid flash at wrong position
    if (!container.visible) {
      container.visible = true;
    }
  };

  const destroy = (): void => {
    animationController.cleanup();
    container.destroy({ children: true });
  };

  // Initialize in fixed mode (hidden - Svelte handles zoomed-in view)
  setMode('fixed');

  return {
    container,
    setVisible,
    setMode,
    setSecondaryVisible,
    updatePosition,
    destroy,
  };
}
