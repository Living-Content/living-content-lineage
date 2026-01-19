/**
 * Node alpha animation controller.
 * Handles smooth transitions for node opacity changes.
 */
import type { PillNode } from '../rendering/nodeRenderer.js';

export interface NodeAnimationController {
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  cleanup: () => void;
}

/**
 * Creates a controller for animating node alpha values with smooth lerping.
 */
export const createNodeAnimationController = (
  nodeMap: Map<string, PillNode>
): NodeAnimationController => {
  const animatingNodes = new Map<string, number>();
  let animationFrameId: number | null = null;

  const animateNodeAlpha = (): void => {
    const toRemove: string[] = [];

    animatingNodes.forEach((target, id) => {
      const pillNode = nodeMap.get(id);
      if (!pillNode) {
        toRemove.push(id);
        return;
      }

      const diff = target - pillNode.alpha;
      if (Math.abs(diff) > 0.01) {
        pillNode.alpha += diff * 0.2;
      } else {
        pillNode.alpha = target;
        toRemove.push(id);
      }
    });

    toRemove.forEach((id) => animatingNodes.delete(id));

    animationFrameId = animatingNodes.size > 0
      ? requestAnimationFrame(animateNodeAlpha)
      : null;
  };

  const setNodeAlpha = (nodeId: string, alpha: number): void => {
    animatingNodes.set(nodeId, alpha);
    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(animateNodeAlpha);
    }
  };

  const cleanup = (): void => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    animatingNodes.clear();
  };

  return { setNodeAlpha, cleanup };
};
