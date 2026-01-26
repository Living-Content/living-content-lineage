/**
 * Level-of-detail controller with container crossfade and view-aware rendering.
 * Manages collapse to workflow nodes and expand to detail view.
 * Owns render behavior based on current view state.
 *
 * Animation locks zoom input via state.isAnimating - viewport should check this.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { ANIMATION_TIMINGS } from '../../../config/animationConstants.js';
import { LOD_THRESHOLD } from '../../../config/constants.js';
import type { ViewportState } from '../../../stores/traceState.svelte.js';

export interface LODState {
  isCollapsed: boolean;
  isAnimating: boolean;
}

export interface LODLayers {
  nodeLayer: Container;
  edgeLayer: Container;
  stepNodeLayer: Container;
  stepEdgeLayer: Container;
  stepLayer: Container;
}

export interface LODCallbacks {
  onCollapseStart?: () => void;
  onCollapseEnd?: () => void;
  onExpandStart?: () => void;
  onExpandEnd?: () => void;
}

export interface LODRenderCallbacks {
  onViewportUpdate: {
    always: (state: ViewportState) => void;
    workflow: () => void;
    step: (state: ViewportState) => void;
  };
}

export interface LODController {
  checkThreshold: (scale: number) => void;
  updateViewport: (viewportState: ViewportState) => void;
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
  callbacks: LODCallbacks,
  renderCallbacks: LODRenderCallbacks
): LODController {
  const state: LODState = {
    isCollapsed: false,
    isAnimating: false,
  };

  const workflowViewLayers = [layers.nodeLayer, layers.edgeLayer, layers.stepLayer];
  const stepViewLayers = [layers.stepNodeLayer, layers.stepEdgeLayer];

  function collapse(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.isCollapsed = true;
    callbacks.onCollapseStart?.();

    animateCrossfade(workflowViewLayers, stepViewLayers, () => {
      state.isAnimating = false;
      callbacks.onCollapseEnd?.();
    });
  }

  function expand(): void {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.isCollapsed = false;
    callbacks.onExpandStart?.();

    animateCrossfade(stepViewLayers, workflowViewLayers, () => {
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

  function updateViewport(viewportState: ViewportState): void {
    renderCallbacks.onViewportUpdate.always(viewportState);
    if (state.isAnimating) return;
    if (state.isCollapsed) {
      renderCallbacks.onViewportUpdate.step(viewportState);
    } else {
      renderCallbacks.onViewportUpdate.workflow();
    }
  }

  return {
    checkThreshold,
    updateViewport,
    get state() {
      return state;
    },
  };
}
