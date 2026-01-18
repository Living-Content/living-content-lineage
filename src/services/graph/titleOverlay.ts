/**
 * Workflow title overlay with title and lineage ID.
 * Only visible in collapsed (stage) view.
 */
import { Container, Text, TextStyle } from 'pixi.js';
import type { PillNode } from './nodeRenderer.js';
import type { ViewportState } from './viewport.js';
import { getColor, getCssVar } from '../../ui/theme.js';

export interface TitleOverlay {
  container: Container;
  setVisible: (visible: boolean) => void;
  setMode: (mode: 'fixed' | 'relative') => void;
  updatePosition: (leftmostNode: PillNode, viewportState: ViewportState) => void;
  destroy: () => void;
}

export interface TitleOverlayData {
  title: string;
  lineageId: string;
}

/**
 * Create title overlay with workflow metadata.
 */
export function createTitleOverlay(stage: Container, data: TitleOverlayData): TitleOverlay {
  const container = new Container();
  container.eventMode = 'passive';
  stage.addChild(container);

  const dateStr = new Date()
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  const uuidStyle = new TextStyle({
    fontFamily: getCssVar('--font-mono'),
    fontSize: 11,
    fontWeight: '500',
    fill: getColor('--color-pill-text'),
    letterSpacing: 0.5,
  });

  const titleStyle = new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: 18,
    fontWeight: '600',
    fill: getColor('--color-pill-text'),
    letterSpacing: -0.3,
  });

  const dateStyle = new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: 11,
    fontWeight: '600',
    fill: getColor('--color-title-secondary'),
    letterSpacing: 0.5,
  });

  const uuidText = new Text({ text: data.lineageId, style: uuidStyle });
  container.addChild(uuidText);

  const titleText = new Text({ text: data.title, style: titleStyle });
  container.addChild(titleText);

  const dateText = new Text({ text: dateStr, style: dateStyle });
  container.addChild(dateText);

  uuidText.alpha = 0.5;
  dateText.alpha = 0.5;
  let targetAlpha = 0.5;
  let fadeAnimationId: number | null = null;

  function animateAlpha(): void {
    const diff = targetAlpha - uuidText.alpha;
    if (Math.abs(diff) < 0.01) {
      uuidText.alpha = targetAlpha;
      dateText.alpha = targetAlpha;
      fadeAnimationId = null;
      return;
    }
    uuidText.alpha += diff * 0.15;
    dateText.alpha += diff * 0.15;
    fadeAnimationId = requestAnimationFrame(animateAlpha);
  }

  container.eventMode = 'static';
  container.cursor = 'pointer';
  container.on('pointerenter', () => {
    targetAlpha = 1;
    if (!fadeAnimationId) fadeAnimationId = requestAnimationFrame(animateAlpha);
  });
  container.on('pointerleave', () => {
    targetAlpha = 0.5;
    if (!fadeAnimationId) fadeAnimationId = requestAnimationFrame(animateAlpha);
  });

  let currentMode: 'fixed' | 'relative' = 'fixed';

  function setVisible(visible: boolean): void {
    container.visible = visible;
  }

  function setMode(mode: 'fixed' | 'relative'): void {
    currentMode = mode;
    if (mode === 'fixed') {
      const leftEdge = 160;
      uuidText.position.set(leftEdge, 20);
      titleText.position.set(leftEdge, 34);
      dateText.position.set(leftEdge, 57);
    }
  }

  function updatePosition(leftmostNode: PillNode, viewportState: ViewportState): void {
    if (currentMode === 'fixed') return;

    const screenX = viewportState.x + leftmostNode.position.x * viewportState.scale;
    const screenY = viewportState.y + leftmostNode.position.y * viewportState.scale;
    const nodeTop = screenY - (leftmostNode.pillHeight / 2) * viewportState.scale;
    const leftEdge = screenX - (leftmostNode.pillWidth / 2) * viewportState.scale;

    uuidText.position.set(leftEdge, nodeTop - 68);
    titleText.position.set(leftEdge, nodeTop - 48);
    dateText.position.set(leftEdge, nodeTop - 25);
  }

  function destroy(): void {
    if (fadeAnimationId) {
      cancelAnimationFrame(fadeAnimationId);
    }
    container.destroy({ children: true });
  }

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
