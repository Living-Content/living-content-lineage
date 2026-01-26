/**
 * Shared node interaction utilities for click vs drag detection.
 * Includes hover phase bar animation and click handling.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { GEOMETRY } from '../../../config/animationConstants.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';

const CLICK_THRESHOLD = 5;

export interface NodeCallbacks {
  onClick: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}

/**
 * Draws the phase bar at a given width with rounded left corners.
 */
const drawPhaseBar = (
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
  // Use full radius - the phase bar is clipped by the node texture anyway
  graphics.roundRect(x, y, barWidth, nodeHeight, radius);
  graphics.fill(color);
};

/**
 * Attaches click/hover handlers to a node container with drag detection.
 * Click only fires if pointer didn't move beyond threshold (not a drag).
 * Includes hover phase bar expansion for visual feedback.
 */
export const attachNodeInteraction = (node: Container, callbacks: NodeCallbacks): void => {
  let pointerStart: { x: number; y: number } | null = null;
  let hoverTween: gsap.core.Tween | null = null;

  node.eventMode = 'static';
  node.cursor = 'pointer';
  node.cullable = true;

  // Cast to GraphNode to access phase bar properties
  const graphNode = node as GraphNode;
  const { phaseBarGraphics, phaseColor, nodeWidth, nodeHeight, baseScale } = graphNode;

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

    // Animate phase bar width expansion
    if (phaseBarGraphics && phaseColor) {
      const animState = { width: GEOMETRY.PHASE_BAR_WIDTH * baseScale };
      hoverTween = gsap.to(animState, {
        width: GEOMETRY.PHASE_BAR_WIDTH_HOVER * baseScale,
        duration: GEOMETRY.PHASE_BAR_HOVER_DURATION,
        ease: 'power2.out',
        onUpdate: () => {
          drawPhaseBar(phaseBarGraphics, nodeWidth, nodeHeight, animState.width, phaseColor, baseScale);
        },
      });
    }
  });

  node.on('pointerleave', () => {
    callbacks.onHoverEnd();
    if (hoverTween) hoverTween.kill();

    // Animate phase bar width back to normal
    if (phaseBarGraphics && phaseColor) {
      const animState = { width: GEOMETRY.PHASE_BAR_WIDTH_HOVER * baseScale };
      hoverTween = gsap.to(animState, {
        width: GEOMETRY.PHASE_BAR_WIDTH * baseScale,
        duration: GEOMETRY.PHASE_BAR_HOVER_DURATION,
        ease: 'power2.out',
        onUpdate: () => {
          drawPhaseBar(phaseBarGraphics, nodeWidth, nodeHeight, animState.width, phaseColor, baseScale);
        },
      });
    }
  });
};
