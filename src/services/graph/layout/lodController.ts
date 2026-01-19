/**
 * Level-of-detail controller with container crossfade.
 * Manages collapse to stage nodes and expand to detail view.
 *
 * Animation locks zoom input via state.isAnimating - viewport should check this.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';

const LOD_THRESHOLD = 0.7;
const DURATION = 0.5;

export interface LODState {
  isCollapsed: boolean;
  isAnimating: boolean;
}

export interface LODLayers {
  nodeLayer: Container;
  edgeLayer: Container;
  dotLayer: Container;
  stageNodeLayer: Container;
  stageEdgeLayer: Container;
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
  readonly state: LODState;
}

export function createLODController(
  layers: LODLayers,
  callbacks: LODCallbacks
): LODController {
  const state: LODState = {
    isCollapsed: false,
    isAnimating: false,
  };

  const detailLayers = [layers.nodeLayer, layers.edgeLayer, layers.dotLayer, layers.stageLayer];
  const stageLayers = [layers.stageNodeLayer, layers.stageEdgeLayer];

  function collapse(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.isCollapsed = true;
    callbacks.onCollapseStart?.();

    // Show stage layers, start transparent
    stageLayers.forEach((layer) => {
      layer.alpha = 0;
      layer.visible = true;
    });

    // Outgoing fades fast, incoming slightly delayed
    gsap.to(detailLayers, {
      alpha: 0,
      duration: DURATION * 0.5,
      ease: 'power2.in',
    });

    gsap.to(stageLayers, {
      alpha: 1,
      duration: DURATION * 0.6,
      delay: DURATION * 0.3,
      ease: 'power2.out',
      onComplete: () => {
        detailLayers.forEach((layer) => (layer.visible = false));
        state.isAnimating = false;
        callbacks.onCollapseEnd?.();
      },
    });
  }

  function expand(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.isCollapsed = false;
    callbacks.onExpandStart?.();

    // Show detail layers, start transparent
    detailLayers.forEach((layer) => {
      layer.alpha = 0;
      layer.visible = true;
    });

    // Outgoing fades fast, incoming slightly delayed
    gsap.to(stageLayers, {
      alpha: 0,
      duration: DURATION * 0.5,
      ease: 'power2.in',
    });

    gsap.to(detailLayers, {
      alpha: 1,
      duration: DURATION * 0.6,
      delay: DURATION * 0.3,
      ease: 'power2.out',
      onComplete: () => {
        stageLayers.forEach((layer) => (layer.visible = false));
        state.isAnimating = false;
        callbacks.onExpandEnd?.();
      },
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
