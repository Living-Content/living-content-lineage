/**
 * Panel animation utilities for InfoPanel entrance and transitions.
 */
import gsap from 'gsap';
import { tick } from 'svelte';
import type { BlobManager } from '../liquidBlobs.js';

export interface PanelElements {
  wrapper: HTMLElement | null;
  contentLayer: HTMLElement | null;
  scrollArea: HTMLElement | null;
  blobContainer: HTMLElement | null;
}

export interface AnimationState {
  isAnimating: boolean;
  showDetailContent: boolean;
  baseWidth: number;
  baseHeight: number;
}

export interface AnimationCallbacks {
  onStateChange: (state: Partial<AnimationState>) => void;
  getBlobManager: () => BlobManager | null;
  setBlobManager: (manager: BlobManager) => void;
  setDetailOpen: (open: boolean) => void;
  closeDetailPanel: () => void;
  createBlobManager: (container: HTMLElement) => BlobManager;
}

export const animateEntrance = async (
  elements: PanelElements,
  callbacks: AnimationCallbacks
): Promise<void> => {
  const { wrapper, contentLayer, blobContainer } = elements;
  if (!wrapper || !contentLayer) return;

  await tick();

  let blobManager = callbacks.getBlobManager();
  if (!blobManager && blobContainer) {
    blobManager = callbacks.createBlobManager(blobContainer);
    callbacks.setBlobManager(blobManager);
  }

  gsap.set(contentLayer, { opacity: 0 });

  const baseWidth = wrapper.offsetWidth;
  const baseHeight = wrapper.offsetHeight;
  callbacks.onStateChange({ baseWidth, baseHeight });

  const timeline = blobManager?.fill(baseWidth, baseHeight, 'elastic.out(1, 0.6)');
  timeline?.to(contentLayer, { opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.5');
};

export const openDetails = async (
  elements: PanelElements,
  state: AnimationState,
  callbacks: AnimationCallbacks
): Promise<void> => {
  if (state.isAnimating) return;
  callbacks.onStateChange({ isAnimating: true });

  const { wrapper, scrollArea } = elements;
  if (!wrapper || !scrollArea) {
    callbacks.onStateChange({ isAnimating: false });
    return;
  }

  // Fade out scroll content
  await gsap.to(scrollArea, { opacity: 0, duration: 0.12, ease: 'power2.in' });

  // Change content and set detail open (CSS handles sizing)
  callbacks.onStateChange({ showDetailContent: true });
  callbacks.setDetailOpen(true);

  // Clear inline styles so CSS takes over
  wrapper.style.left = '';
  wrapper.style.top = '';
  wrapper.style.transform = '';

  await tick();
  await gsap.to(scrollArea, { opacity: 1, duration: 0.2, ease: 'power2.out' });
  callbacks.onStateChange({ isAnimating: false });
};

export const closeDetails = async (
  elements: PanelElements,
  state: AnimationState,
  callbacks: AnimationCallbacks
): Promise<void> => {
  if (state.isAnimating) return;
  callbacks.onStateChange({ isAnimating: true });

  const { wrapper, scrollArea } = elements;
  if (!wrapper || !scrollArea) {
    callbacks.onStateChange({ isAnimating: false });
    return;
  }

  // Fade out scroll content
  await gsap.to(scrollArea, { opacity: 0, duration: 0.12, ease: 'power2.in' });

  // Change content back to summary and close detail (CSS handles sizing/centering)
  callbacks.onStateChange({ showDetailContent: false });
  callbacks.closeDetailPanel();

  // Clear any inline styles - let CSS handle positioning
  wrapper.style.left = '';
  wrapper.style.top = '';
  wrapper.style.transform = '';

  await tick();
  await gsap.to(scrollArea, { opacity: 1, duration: 0.2, ease: 'power2.out' });
  callbacks.onStateChange({ isAnimating: false });
};

export const killAnimations = (elements: PanelElements): void => {
  const { wrapper, contentLayer, scrollArea } = elements;
  if (contentLayer) gsap.killTweensOf(contentLayer);
  if (scrollArea) gsap.killTweensOf(scrollArea);
  if (wrapper) gsap.killTweensOf(wrapper);
};
