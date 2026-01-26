/**
 * Node alpha animation controller.
 * Handles smooth transitions for node opacity changes using gsap.
 */
import gsap from 'gsap';
import { ANIMATION_TIMINGS } from '../../../config/animationConstants.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';

export interface NodeAnimationController {
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  cleanup: () => void;
}

/**
 * Creates a controller for animating node alpha values with gsap.
 * Accepts multiple node maps to look up nodes from.
 */
export const createNodeAnimationController = (
  ...nodeMaps: Map<string, GraphNode>[]
): NodeAnimationController => {
  const activeTweens = new Map<string, gsap.core.Tween>();

  const findNode = (id: string): GraphNode | undefined => {
    for (const map of nodeMaps) {
      const node = map.get(id);
      if (node) return node;
    }
    return undefined;
  };

  const setNodeAlpha = (nodeId: string, alpha: number): void => {
    const node = findNode(nodeId);
    if (!node) return;

    // Kill existing tween for this node
    const existing = activeTweens.get(nodeId);
    if (existing) existing.kill();

    const tween = gsap.to(node, {
      alpha,
      duration: ANIMATION_TIMINGS.NODE_ALPHA_DURATION,
      ease: 'power2.out',
      onComplete: () => { activeTweens.delete(nodeId); },
    });

    activeTweens.set(nodeId, tween);
  };

  const cleanup = (): void => {
    activeTweens.forEach((tween) => tween.kill());
    activeTweens.clear();
  };

  return { setNodeAlpha, cleanup };
};
