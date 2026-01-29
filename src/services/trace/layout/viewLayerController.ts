/**
 * View container controller with simple fade transitions.
 * Manages visibility of 3-level view hierarchy containers.
 */
import gsap from 'gsap';
import type { ViewLevel } from '../../../config/types.js';
import type { ViewContainers } from './pixiSetup.js';
import { getContainerForLevel } from './pixiSetup.js';
import { ANIMATION_TIMINGS } from '../../../config/animation.js';
import { viewLevel } from '../../../stores/viewLevel.svelte.js';

export interface ViewContainerControllerDeps {
  containers: ViewContainers;
  setPositionForCurrentView: () => void;
  render: () => void;
}

export interface ViewContainerController {
  transitionTo: (newLevel: ViewLevel) => void;
  getCurrentLevel: () => ViewLevel;
}

/**
 * Creates a view container controller for managing 3-level view transitions.
 */
export const createViewContainerController = (
  deps: ViewContainerControllerDeps
): ViewContainerController => {
  const { containers, setPositionForCurrentView, render } = deps;
  let currentLevel: ViewLevel = 'workflow-detail';

  const transitionTo = (newLevel: ViewLevel): void => {
    if (newLevel === currentLevel) return;

    const outgoing = getContainerForLevel(containers, currentLevel);
    const incoming = getContainerForLevel(containers, newLevel);
    const duration = ANIMATION_TIMINGS.VIEW_LEVEL_FADE_DURATION;

    // Block further interactions during transition
    viewLevel.setTransitioning(true);
    currentLevel = newLevel;

    // Sequential fade: out first, then in
    gsap.to(outgoing, {
      alpha: 0,
      duration,
      ease: 'power2.in',
      onComplete: () => {
        outgoing.visible = false;
        // Position viewport for new view (nothing visible, no jump)
        setPositionForCurrentView();
        // Force render to defeat Pixi culling before fade-in
        render();
        // Fade in incoming
        incoming.visible = true;
        incoming.alpha = 0;
        gsap.to(incoming, {
          alpha: 1,
          duration,
          ease: 'power2.out',
          onComplete: () => viewLevel.setTransitioning(false),
        });
      },
    });
  };

  const getCurrentLevel = (): ViewLevel => currentLevel;

  return { transitionTo, getCurrentLevel };
};
