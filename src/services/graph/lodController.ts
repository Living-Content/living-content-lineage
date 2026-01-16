/**
 * Level-of-detail controller with animated transitions.
 * Manages collapse to meta nodes and expand to detail view.
 */
import { Container } from 'pixi.js';
import type { PillNode } from './nodeRenderer.js';
import type { Stage } from '../../types.js';
import { LOD_THRESHOLD } from '../../config/constants.js';

const ANIMATION_DURATION_MS = 300;

export interface LODState {
  isCollapsed: boolean;
  isAnimating: boolean;
}

export interface LODLayers {
  nodeLayer: Container;
  edgeLayer: Container;
  metaNodeLayer: Container;
  metaEdgeLayer: Container;
  stageLayer: Container;
}

export interface LODCallbacks {
  onCollapseStart?: () => void;
  onCollapseEnd?: () => void;
  onExpandStart?: () => void;
  onExpandEnd?: () => void;
}

export interface LODController {
  checkThreshold: (scale: number) => void;
  collapse: () => void;
  expand: () => void;
  readonly state: LODState;
}

/**
 * Create LOD controller for managing detail levels.
 */
export function createLODController(
  nodeMap: Map<string, PillNode>,
  metaNodeMap: Map<string, PillNode>,
  stages: Stage[],
  layers: LODLayers,
  callbacks: LODCallbacks
): LODController {
  const state: LODState = {
    isCollapsed: false,
    isAnimating: false,
  };

  const originalPositions = new Map<string, { x: number; y: number }>();
  nodeMap.forEach((node, id) => {
    originalPositions.set(id, { x: node.position.x, y: node.position.y });
  });

  function getMetaPosition(stageId: string): { x: number; y: number } | null {
    const metaNode = metaNodeMap.get(stageId);
    return metaNode ? { x: metaNode.position.x, y: metaNode.position.y } : null;
  }

  function animateCollapse(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    callbacks.onCollapseStart?.();

    layers.edgeLayer.visible = false;
    layers.stageLayer.visible = false;

    const startTime = performance.now();

    const animate = (): void => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      nodeMap.forEach((node) => {
        const nodeData = node.nodeData;
        const original = originalPositions.get(nodeData.id);
        const metaPos = getMetaPosition(nodeData.stage || '');

        if (original && metaPos) {
          node.position.x = original.x + (metaPos.x - original.x) * eased;
          node.position.y = original.y + (metaPos.y - original.y) * eased;
          node.alpha = 1 - eased;
        }
      });

      metaNodeMap.forEach((node) => {
        node.alpha = eased;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        layers.nodeLayer.visible = false;
        layers.metaNodeLayer.visible = true;
        layers.metaEdgeLayer.visible = true;
        state.isAnimating = false;
        callbacks.onCollapseEnd?.();
      }
    };

    layers.metaNodeLayer.visible = true;
    metaNodeMap.forEach((node) => {
      node.alpha = 0;
    });

    requestAnimationFrame(animate);
  }

  function animateExpand(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    callbacks.onExpandStart?.();

    layers.metaEdgeLayer.visible = false;

    const startTime = performance.now();

    nodeMap.forEach((node) => {
      const nodeData = node.nodeData;
      const metaPos = getMetaPosition(nodeData.stage || '');
      if (metaPos) {
        node.position.x = metaPos.x;
        node.position.y = metaPos.y;
      }
      node.alpha = 0;
    });

    layers.nodeLayer.visible = true;

    const animate = (): void => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      nodeMap.forEach((node) => {
        const nodeData = node.nodeData;
        const original = originalPositions.get(nodeData.id);
        const metaPos = getMetaPosition(nodeData.stage || '');

        if (original && metaPos) {
          node.position.x = metaPos.x + (original.x - metaPos.x) * eased;
          node.position.y = metaPos.y + (original.y - metaPos.y) * eased;
          node.alpha = eased;
        }
      });

      metaNodeMap.forEach((node) => {
        node.alpha = 1 - eased;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        layers.metaNodeLayer.visible = false;
        layers.edgeLayer.visible = true;
        layers.stageLayer.visible = true;
        state.isAnimating = false;
        callbacks.onExpandEnd?.();
      }
    };

    requestAnimationFrame(animate);
  }

  function checkThreshold(scale: number): void {
    const shouldCollapse = scale < LOD_THRESHOLD;
    if (shouldCollapse === state.isCollapsed || state.isAnimating) return;

    state.isCollapsed = shouldCollapse;

    if (shouldCollapse) {
      animateCollapse();
    } else {
      animateExpand();
    }
  }

  return {
    checkThreshold,
    collapse: animateCollapse,
    expand: animateExpand,
    get state() {
      return state;
    },
  };
}
