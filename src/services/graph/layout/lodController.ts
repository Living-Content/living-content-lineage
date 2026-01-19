/**
 * Level-of-detail controller with container crossfade.
 * Manages collapse to workflow nodes and expand to detail view.
 *
 * Animation locks zoom input via state.isAnimating - viewport should check this.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { ANIMATION_TIMINGS } from '../../../config/animationConstants.js';
import { LOD_THRESHOLD } from '../../../config/constants.js';

export interface LODState {
  isCollapsed: boolean;
  isAnimating: boolean;
}

export interface LODLayers {
  nodeLayer: Container;
  edgeLayer: Container;
  workflowNodeLayer: Container;
  workflowEdgeLayer: Container;
  workflowLayer: Container;
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

/**
 * Shared crossfade animation for LOD transitions.
 */
function animateCrossfade(
  outgoing: Container[],
  incoming: Container[],
  onComplete: () => void
): void {
  const duration = ANIMATION_TIMINGS.LOD_DURATION;

  incoming.forEach((layer) => {
    layer.alpha = 0;
    layer.visible = true;
  });

  gsap.to(outgoing, {
    alpha: 0,
    duration: duration * ANIMATION_TIMINGS.LOD_FADE_OUT_FACTOR,
    ease: 'power2.in',
  });

  gsap.to(incoming, {
    alpha: 1,
    duration: duration * ANIMATION_TIMINGS.LOD_FADE_IN_DURATION_FACTOR,
    delay: duration * ANIMATION_TIMINGS.LOD_FADE_IN_DELAY_FACTOR,
    ease: 'power2.out',
    onComplete: () => {
      outgoing.forEach((layer) => (layer.visible = false));
      onComplete();
    },
  });
}

export function createLODController(
  layers: LODLayers,
  callbacks: LODCallbacks
): LODController {
  const state: LODState = {
    isCollapsed: false,
    isAnimating: false,
  };

  const detailLayers = [layers.nodeLayer, layers.edgeLayer, layers.workflowLayer];
  const workflowLayers = [layers.workflowNodeLayer, layers.workflowEdgeLayer];

  function collapse(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.isCollapsed = true;
    callbacks.onCollapseStart?.();

    animateCrossfade(detailLayers, workflowLayers, () => {
      state.isAnimating = false;
      callbacks.onCollapseEnd?.();
    });
  }

  function expand(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.isCollapsed = false;
    callbacks.onExpandStart?.();

    animateCrossfade(workflowLayers, detailLayers, () => {
      state.isAnimating = false;
      callbacks.onExpandEnd?.();
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
