/**
 * Workflow title overlay with UUID, date, and username.
 * Only visible in collapsed (meta) view.
 */
import { Container, Text, TextStyle } from 'pixi.js';
import type { PillNode } from './nodeRenderer.js';
import type { ViewportState } from './viewport.js';

export interface TitleOverlay {
  container: Container;
  setVisible: (visible: boolean) => void;
  updatePosition: (leftmostNode: PillNode, viewportState: ViewportState) => void;
  destroy: () => void;
}

/**
 * Create title overlay with workflow metadata.
 */
export function createTitleOverlay(stage: Container): TitleOverlay {
  const container = new Container();
  container.visible = false;
  stage.addChild(container);

  const workflowId = crypto.randomUUID();
  const workflowDate = new Date()
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
  const workflowUser = 'SYSTEM';

  const titleStyle = new TextStyle({
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: 16,
    fontWeight: '700',
    fill: 0x333333,
    letterSpacing: -0.3,
  });

  const subtitleStyle = new TextStyle({
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: 11,
    fontWeight: '600',
    fill: 0x888888,
    letterSpacing: 0.5,
  });

  const titleText = new Text({ text: workflowId, style: titleStyle });
  container.addChild(titleText);

  const subtitleText = new Text({
    text: `${workflowDate}  \u2022  ${workflowUser}`,
    style: subtitleStyle,
  });
  container.addChild(subtitleText);

  container.alpha = 0.5;
  let targetAlpha = 0.5;
  let fadeAnimationId: number | null = null;

  function animateAlpha(): void {
    const diff = targetAlpha - container.alpha;
    if (Math.abs(diff) < 0.01) {
      container.alpha = targetAlpha;
      fadeAnimationId = null;
      return;
    }
    container.alpha += diff * 0.15;
    fadeAnimationId = requestAnimationFrame(animateAlpha);
  }

  titleText.eventMode = 'static';
  titleText.cursor = 'pointer';
  titleText.on('pointerenter', () => {
    targetAlpha = 1;
    if (!fadeAnimationId) fadeAnimationId = requestAnimationFrame(animateAlpha);
  });
  titleText.on('pointerleave', () => {
    targetAlpha = 0.5;
    if (!fadeAnimationId) fadeAnimationId = requestAnimationFrame(animateAlpha);
  });

  function setVisible(visible: boolean): void {
    container.visible = visible;
  }

  function updatePosition(leftmostNode: PillNode, viewportState: ViewportState): void {
    const screenX = viewportState.x + leftmostNode.position.x * viewportState.scale;
    const screenY = viewportState.y + leftmostNode.position.y * viewportState.scale;
    const nodeTop = screenY - (leftmostNode.pillHeight / 2) * viewportState.scale;
    const leftEdge = screenX - (leftmostNode.pillWidth / 2) * viewportState.scale;

    titleText.position.set(leftEdge, nodeTop - 48);
    subtitleText.position.set(leftEdge, nodeTop - 26);
  }

  function destroy(): void {
    if (fadeAnimationId) {
      cancelAnimationFrame(fadeAnimationId);
    }
    container.destroy({ children: true });
  }

  return {
    container,
    setVisible,
    updatePosition,
    destroy,
  };
}
