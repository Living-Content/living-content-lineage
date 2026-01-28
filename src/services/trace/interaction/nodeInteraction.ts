/**
 * Shared node interaction utilities for click vs drag detection.
 * Includes hover highlight bar animation and click handling.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { GEOMETRY } from '../../../config/animation.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { CLICK_THRESHOLD } from '../../../config/interaction.js';

export interface NodeCallbacks {
  onClick: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}

/**
 * Draws the highlight bar at a given width with rounded left corners.
 */
const drawHighlightBar = (
  graphics: Graphics,
  nodeWidth: number,
  nodeHeight: number,
  barWidth: number,
  color: string,
  nodeScale: number = 1
): void => {
  graphics.clear();
  const x = -nodeWidth / 2;
  const y = -nodeHeight / 2;
  const radius = GEOMETRY.NODE_BORDER_RADIUS * nodeScale;
  // Use full radius - the highlight bar is clipped by the node texture anyway
  graphics.roundRect(x, y, barWidth, nodeHeight, radius);
  graphics.fill(color);
};

/**
 * Attaches click/hover handlers to a node container with drag detection.
 * Click only fires if pointer didn't move beyond threshold (not a drag).
 * Includes hover highlight bar expansion for visual feedback.
 */
export const attachNodeInteraction = (node: Container, callbacks: NodeCallbacks): void => {
  let pointerStart: { x: number; y: number } | null = null;
  let hoverTween: gsap.core.Tween | null = null;

  node.eventMode = 'static';
  node.cursor = 'pointer';
  node.cullable = true;

  const graphNode = node as GraphNode;

  node.on('pointerdown', (e) => {
    pointerStart = { x: e.globalX, y: e.globalY };
  });

  node.on('pointerup', (e) => {
    if (!pointerStart) return;
    const dx = Math.abs(e.globalX - pointerStart.x);
    const dy = Math.abs(e.globalY - pointerStart.y);
    pointerStart = null;
    if (dx < CLICK_THRESHOLD && dy < CLICK_THRESHOLD) {
      callbacks.onClick();
    }
  });

  node.on('pointerupoutside', () => {
    pointerStart = null;
  });

  node.on('pointerenter', () => {
    callbacks.onHover();
    if (hoverTween) hoverTween.kill();

    // Read properties at event time (may be set async after node creation)
    const { highlightBar, highlightColor, nodeWidth, nodeHeight, baseScale } = graphNode;
    if (highlightBar && highlightColor) {
      const animState = { width: GEOMETRY.HIGHLIGHT_BAR_WIDTH * baseScale };
      hoverTween = gsap.to(animState, {
        width: GEOMETRY.HIGHLIGHT_BAR_WIDTH_HOVER * baseScale,
        duration: GEOMETRY.HIGHLIGHT_BAR_HOVER_DURATION,
        ease: 'power2.out',
        onUpdate: () => {
          drawHighlightBar(highlightBar, nodeWidth, nodeHeight, animState.width, highlightColor, baseScale);
        },
      });
    }
  });

  node.on('pointerleave', () => {
    callbacks.onHoverEnd();
    if (hoverTween) hoverTween.kill();

    const { highlightBar, highlightColor, nodeWidth, nodeHeight, baseScale } = graphNode;
    if (highlightBar && highlightColor) {
      const animState = { width: GEOMETRY.HIGHLIGHT_BAR_WIDTH_HOVER * baseScale };
      hoverTween = gsap.to(animState, {
        width: GEOMETRY.HIGHLIGHT_BAR_WIDTH * baseScale,
        duration: GEOMETRY.HIGHLIGHT_BAR_HOVER_DURATION,
        ease: 'power2.out',
        onUpdate: () => {
          drawHighlightBar(highlightBar, nodeWidth, nodeHeight, animState.width, highlightColor, baseScale);
        },
      });
    }
  });
};
