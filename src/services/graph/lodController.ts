/**
 * Level-of-detail controller with GSAP animations.
 * Manages collapse to stage nodes and expand to detail view.
 *
 * Animation locks zoom input via state.isAnimating - viewport should check this.
 */
import { Container } from 'pixi.js';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import type { PillNode } from './nodeRenderer.js';
import type { Stage } from '../../types.js';

// Register GSAP PixiPlugin
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

const LOD_THRESHOLD = 0.7;
const DURATION = 0.2;

export interface LODState {
  isCollapsed: boolean;
  isAnimating: boolean;
}

export interface LODLayers {
  nodeLayer: Container;
  edgeLayer: Container;
  stageNodeLayer: Container;
  stageEdgeLayer: Container;
  stageLayer: Container;
}

export interface LODCallbacks {
  onCollapseEnd?: () => void;
  onExpandEnd?: () => void;
}

export interface LODController {
  checkThreshold: (scale: number) => void;
  readonly state: LODState;
}

export function createLODController(
  nodeMap: Map<string, PillNode>,
  stageNodeMap: Map<string, PillNode>,
  _stages: Stage[],
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

  function getStagePosition(stageId: string): { x: number; y: number } | null {
    const stageNode = stageNodeMap.get(stageId);
    return stageNode ? { x: stageNode.position.x, y: stageNode.position.y } : null;
  }

  function collapse(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.isCollapsed = true;

    layers.edgeLayer.visible = false;
    layers.stageLayer.visible = false;

    layers.stageNodeLayer.visible = true;
    stageNodeMap.forEach((node) => {
      node.alpha = 0;
      node.scale.set(0.5);
    });

    const nodes = Array.from(nodeMap.values()).sort(
      (a, b) => originalPositions.get(a.nodeData.id)!.x - originalPositions.get(b.nodeData.id)!.x
    );

    const tl = gsap.timeline({
      onComplete: () => {
        layers.nodeLayer.visible = false;
        layers.stageEdgeLayer.visible = true;
        state.isAnimating = false;
        callbacks.onCollapseEnd?.();
      },
    });

    nodes.forEach((node, i) => {
      const stagePos = getStagePosition(node.nodeData.stage || '');
      if (!stagePos) return;

      const delay = i * 0.01;
      tl.to(node.position, { x: stagePos.x, y: stagePos.y, duration: DURATION, ease: 'power2.in' }, delay);
      tl.to(node, { alpha: 0, duration: DURATION * 0.6, ease: 'power2.in' }, delay);
    });

    const stageNodes = Array.from(stageNodeMap.values());
    stageNodes.forEach((node, i) => {
      const delay = DURATION * 0.4 + i * 0.04;
      tl.to(node, { alpha: 1, duration: DURATION * 0.6, ease: 'power2.out' }, delay);
      tl.to(node, { pixi: { scaleX: 1, scaleY: 1 }, duration: DURATION * 0.8, ease: 'back.out(1.4)' }, delay);
    });
  }

  function expand(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.isCollapsed = false;

    layers.stageEdgeLayer.visible = false;

    nodeMap.forEach((node) => {
      const stagePos = getStagePosition(node.nodeData.stage || '');
      if (stagePos) {
        node.position.x = stagePos.x;
        node.position.y = stagePos.y;
      }
      node.alpha = 0;
      node.scale.set(0.5);
    });

    layers.nodeLayer.visible = true;

    const nodes = Array.from(nodeMap.values()).sort(
      (a, b) => originalPositions.get(a.nodeData.id)!.x - originalPositions.get(b.nodeData.id)!.x
    );

    const tl = gsap.timeline({
      onComplete: () => {
        layers.stageNodeLayer.visible = false;
        layers.edgeLayer.visible = true;
        layers.stageLayer.visible = true;
        state.isAnimating = false;
        callbacks.onExpandEnd?.();
      },
    });

    const stageNodes = Array.from(stageNodeMap.values());
    stageNodes.forEach((node, i) => {
      tl.to(node, { alpha: 0, duration: DURATION * 0.3, ease: 'power2.in' }, i * 0.02);
      tl.to(node, { pixi: { scaleX: 0.5, scaleY: 0.5 }, duration: DURATION * 0.3, ease: 'power2.in' }, i * 0.02);
    });

    nodes.forEach((node, i) => {
      const original = originalPositions.get(node.nodeData.id);
      if (!original) return;

      const delay = DURATION * 0.15 + i * 0.01;
      tl.to(node.position, { x: original.x, y: original.y, duration: DURATION, ease: 'power2.out' }, delay);
      tl.to(node, { alpha: 1, duration: DURATION * 0.5, ease: 'power2.out' }, delay);
      tl.to(node, { pixi: { scaleX: 1, scaleY: 1 }, duration: DURATION * 0.6, ease: 'back.out(1.2)' }, delay);
    });
  }

  function checkThreshold(scale: number): void {
    if (state.isAnimating) return;

    const shouldCollapse = scale < LOD_THRESHOLD;
    if (shouldCollapse === state.isCollapsed) return;

    if (shouldCollapse) {
      collapse();
    } else {
      expand();
    }
  }

  return {
    checkThreshold,
    get state() {
      return state;
    },
  };
}
