/**
 * View layer controller with simple fade transitions.
 * Manages visibility of 3-level view hierarchy layers.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';
import type { ViewLevel } from '../../../config/types.js';
import type { LayerGroup } from './pixiSetup.js';
import { ANIMATION_TIMINGS } from '../../../config/animation.js';

export interface ViewLayerController {
  transitionTo: (newLevel: ViewLevel) => void;
  getCurrentLevel: () => ViewLevel;
}

interface LayerSet {
  primary: Container;
  secondary?: Container;
}

/**
 * Creates a view layer controller for managing 3-level view transitions.
 */
export const createViewLayerController = (layers: LayerGroup): ViewLayerController => {
  let currentLevel: ViewLevel = 'workflow-detail';

  const getLayerSet = (level: ViewLevel): LayerSet => {
    switch (level) {
      case 'content-session':
        return { primary: layers.sessionLayer };
      case 'workflow-overview':
        return { primary: layers.overviewLayer, secondary: layers.connectorLayer };
      case 'workflow-detail':
        return { primary: layers.detailNodeLayer, secondary: layers.detailEdgeLayer };
    }
  };

  const setLayerVisible = (layerSet: LayerSet, visible: boolean): void => {
    layerSet.primary.visible = visible;
    if (layerSet.secondary) {
      layerSet.secondary.visible = visible;
    }
  };

  const setLayerAlpha = (layerSet: LayerSet, alpha: number): void => {
    layerSet.primary.alpha = alpha;
    if (layerSet.secondary) {
      layerSet.secondary.alpha = alpha;
    }
  };

  const transitionTo = (newLevel: ViewLevel): void => {
    if (newLevel === currentLevel) return;

    const outgoing = getLayerSet(currentLevel);
    const incoming = getLayerSet(newLevel);
    const duration = ANIMATION_TIMINGS.VIEW_LEVEL_FADE_DURATION;

    // Fade out outgoing layers
    gsap.to([outgoing.primary, outgoing.secondary].filter(Boolean), {
      alpha: 0,
      duration,
      ease: 'power2.in',
      onComplete: () => setLayerVisible(outgoing, false),
    });

    // Fade in incoming layers
    setLayerVisible(incoming, true);
    setLayerAlpha(incoming, 0);
    gsap.to([incoming.primary, incoming.secondary].filter(Boolean), {
      alpha: 1,
      duration,
      ease: 'power2.out',
    });

    currentLevel = newLevel;
  };

  const getCurrentLevel = (): ViewLevel => currentLevel;

  return { transitionTo, getCurrentLevel };
};
