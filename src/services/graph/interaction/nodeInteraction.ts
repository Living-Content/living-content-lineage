/**
 * Shared node interaction utilities for click vs drag detection.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { ANIMATION_TIMINGS } from '../../../config/animationConstants.js';

const CLICK_THRESHOLD = 5;

export interface NodeCallbacks {
  onClick: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}

/**
 * Attaches click/hover handlers to a node container with drag detection.
 * Click only fires if pointer didn't move beyond threshold (not a drag).
 */
export const attachNodeInteraction = (node: Container, callbacks: NodeCallbacks): void => {
  let pointerStart: { x: number; y: number } | null = null;

  node.eventMode = 'static';
  node.cursor = 'pointer';
  node.cullable = true;

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
  });

  node.on('pointerleave', () => {
    callbacks.onHoverEnd();
  });
};

/**
 * Creates a selection animator that handles the draw-on/fade-out animation.
 * @param selectionRing The graphics object for the selection ring
 * @param drawRing Function that draws the ring at the given progress (0-1)
 * @returns A function to call when selection state changes
 */
export const createSelectionAnimator = (
  selectionRing: Graphics,
  drawRing: (progress: number) => void
): ((selected: boolean) => void) => {
  const animState = { progress: 0 };

  return (selected: boolean) => {
    gsap.killTweensOf(animState);
    gsap.killTweensOf(selectionRing);

    if (selected) {
      animState.progress = 0;
      selectionRing.clear();
      selectionRing.alpha = 1;

      gsap.to(animState, {
        progress: 1,
        duration: ANIMATION_TIMINGS.SELECTION_DRAW_DURATION,
        ease: 'power2.inOut',
        onUpdate: () => drawRing(animState.progress),
      });
    } else {
      gsap.to(selectionRing, {
        alpha: 0,
        duration: ANIMATION_TIMINGS.SELECTION_FADE_DURATION,
        ease: 'power2.out',
      });
    }
  };
};
