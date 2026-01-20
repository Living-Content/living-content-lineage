/**
 * Workflow title overlay with title and lineage ID.
 * Only visible in collapsed (workflow) view.
 */
import { Container, Text, TextStyle } from 'pixi.js';
import type { GraphNode } from './nodeRenderer.js';
import type { ViewportState } from '../interaction/viewport.js';
import { getCssVarColorHex, getCssVar, getCssVarInt, getCssVarFloat } from '../../../themes/index.js';

export interface TitleOverlay {
  container: Container;
  setVisible: (visible: boolean) => void;
  setMode: (mode: 'fixed' | 'relative') => void;
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
 * Pure creation of title overlay text elements (no side effects).
 */
export const createTitleOverlayElements = (data: TitleOverlayData): TitleOverlayElements => {
  const styles = createTextStyles();
  const dateStr = formatDateString();

  const uuidText = new Text({ text: data.workflowId, style: styles.uuid });
  const titleText = new Text({ text: data.title, style: styles.title });
  const dateText = new Text({ text: dateStr, style: styles.date });

  const secondaryAlpha = getCssVarFloat('--title-secondary-alpha');
  uuidText.alpha = secondaryAlpha;
  dateText.alpha = secondaryAlpha;

  return { uuidText, titleText, dateText };
};

/**
 * Attaches title overlay elements to a container (explicit side effect).
 */
export const attachTitleOverlayElements = (
  container: Container,
  elements: TitleOverlayElements
): void => {
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
  let targetAlpha = 0.5;
  let fadeAnimationId: number | null = null;

  const animateAlpha = (): void => {
    const diff = targetAlpha - elements.uuidText.alpha;
    if (Math.abs(diff) < 0.01) {
      elements.uuidText.alpha = targetAlpha;
      elements.dateText.alpha = targetAlpha;
      fadeAnimationId = null;
      return;
    }
    elements.uuidText.alpha += diff * 0.15;
    elements.dateText.alpha += diff * 0.15;
    fadeAnimationId = requestAnimationFrame(animateAlpha);
  };

  container.eventMode = 'static';
  container.cursor = 'pointer';

  const onPointerEnter = (): void => {
    targetAlpha = 1;
    if (!fadeAnimationId) fadeAnimationId = requestAnimationFrame(animateAlpha);
  };

  const onPointerLeave = (): void => {
    targetAlpha = 0.5;
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
 * Positions elements in fixed mode (top-left of screen).
 */
const positionElementsFixed = (elements: TitleOverlayElements): void => {
  const panelMargin = getCssVarInt('--panel-margin');
  const logoWidth = getCssVarInt('--logo-width');
  const uuidToTitle = getCssVarInt('--title-uuid-to-title');
  const titleToDate = getCssVarInt('--title-title-to-date');
  const titleLeftGap = getCssVarInt('--title-left-gap');
  const leftEdge = panelMargin + logoWidth + titleLeftGap;

  elements.uuidText.position.set(leftEdge, panelMargin);
  elements.titleText.position.set(leftEdge, panelMargin + uuidToTitle);
  elements.dateText.position.set(leftEdge, panelMargin + uuidToTitle + titleToDate);
};

/**
 * Positions elements relative to a node and viewport.
 */
const positionElementsRelative = (
  elements: TitleOverlayElements,
  leftmostNode: GraphNode,
  viewportState: ViewportState
): void => {
  const uuidToTitle = getCssVarInt('--title-uuid-to-title');
  const titleToDate = getCssVarInt('--title-title-to-date');
  const totalHeight = uuidToTitle + titleToDate;

  const screenX = viewportState.x + leftmostNode.position.x * viewportState.scale;
  const screenY = viewportState.y + leftmostNode.position.y * viewportState.scale;
  const nodeTop = screenY - (leftmostNode.nodeHeight / 2) * viewportState.scale;
  const leftEdge = screenX - (leftmostNode.nodeWidth / 2) * viewportState.scale;
  const nodeGap = getCssVarInt('--title-node-gap');
  const uuidY = nodeTop - totalHeight - nodeGap;

  elements.uuidText.position.set(leftEdge, uuidY);
  elements.titleText.position.set(leftEdge, uuidY + uuidToTitle);
  elements.dateText.position.set(leftEdge, uuidY + uuidToTitle + titleToDate);
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

  const setMode = (mode: 'fixed' | 'relative'): void => {
    currentMode = mode;
    if (mode === 'fixed') {
      positionElementsFixed(elements);
    }
  };

  const updatePosition = (leftmostNode: GraphNode, viewportState: ViewportState): void => {
    if (currentMode === 'fixed') return;
    positionElementsRelative(elements, leftmostNode, viewportState);
  };

  const destroy = (): void => {
    animationController.cleanup();
    container.destroy({ children: true });
  };

  // Initialize in fixed mode
  setMode('fixed');
  container.visible = true;

  return {
    container,
    setVisible,
    setMode,
    updatePosition,
    destroy,
  };
}
