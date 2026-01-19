/**
 * Panel animation orchestrator.
 * Handles entrance, detail open/close animations for DataViewPanel.
 */
import gsap from 'gsap';
import { tick } from 'svelte';
import { ANIMATION_TIMINGS } from '../../../config/animationConstants.js';
import type { BlobManager } from './liquidBlobs.js';
import { createBlobManager } from './liquidBlobs.js';

export interface PanelElements {
  wrapper: HTMLElement;
  contentLayer: HTMLElement;
  scrollArea: HTMLElement;
  blobContainer: HTMLElement;
}

export interface AnimationOrchestrator {
  animateEntrance: () => Promise<void>;
  openDetails: (onStateChange: () => void, resetPosition: () => void) => Promise<void>;
  closeDetails: (onStateChange: () => void, resetPosition: () => void) => Promise<void>;
  killAll: () => void;
  isAnimating: () => boolean;
  getBlobManager: () => BlobManager | null;
}

export function createAnimationOrchestrator(
  getElements: () => PanelElements | null
): AnimationOrchestrator {
  let blobManager: BlobManager | null = null;
  let animating = false;

  async function animateEntrance(): Promise<void> {
    const elements = getElements();
    if (!elements) return;

    const { wrapper, contentLayer, blobContainer } = elements;

    if (!blobManager && blobContainer) {
      blobManager = createBlobManager(blobContainer);
    }

    gsap.set(contentLayer, { opacity: 0 });

    const baseWidth = wrapper.offsetWidth;
    const baseHeight = wrapper.offsetHeight;

    const timeline = blobManager?.fill(baseWidth, baseHeight, 'elastic.out(1, 0.6)');
    timeline?.to(contentLayer, { opacity: 1, duration: ANIMATION_TIMINGS.PANEL_ENTRANCE_DURATION, ease: 'power2.out' }, '-=0.5');
  }

  async function openDetails(onStateChange: () => void, resetPosition: () => void): Promise<void> {
    if (animating) return;
    animating = true;

    try {
      const elements = getElements();
      if (!elements) return;

      const { scrollArea } = elements;

      // Fade out, change state, reset position, fade in
      await gsap.to(scrollArea, { opacity: 0, duration: 0.12, ease: 'power2.in' });
      onStateChange();
      resetPosition();
      await tick();
      await gsap.to(scrollArea, { opacity: 1, duration: ANIMATION_TIMINGS.PANEL_DETAIL_DURATION, ease: 'power2.out' });
    } finally {
      animating = false;
    }
  }

  async function closeDetails(onStateChange: () => void, resetPosition: () => void): Promise<void> {
    if (animating) return;
    animating = true;

    try {
      const elements = getElements();
      if (!elements) return;

      const { scrollArea } = elements;

      // Fade out, change state, reset position, fade in
      await gsap.to(scrollArea, { opacity: 0, duration: 0.12, ease: 'power2.in' });
      onStateChange();
      resetPosition();
      await tick();
      await gsap.to(scrollArea, { opacity: 1, duration: ANIMATION_TIMINGS.PANEL_DETAIL_DURATION, ease: 'power2.out' });
    } finally {
      animating = false;
    }
  }

  function killAll(): void {
    const elements = getElements();
    if (elements) {
      gsap.killTweensOf(elements.contentLayer);
      gsap.killTweensOf(elements.scrollArea);
      gsap.killTweensOf(elements.wrapper);
    }
    blobManager?.kill();
  }

  function isAnimating(): boolean {
    return animating;
  }

  function getBlobManager(): BlobManager | null {
    return blobManager;
  }

  return {
    animateEntrance,
    openDetails,
    closeDetails,
    killAll,
    isAnimating,
    getBlobManager,
  };
}
