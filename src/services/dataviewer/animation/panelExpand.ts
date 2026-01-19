/**
 * Panel expansion animation.
 * Animates element size: vertical first, then horizontal (desktop).
 */
import gsap from 'gsap';

export interface ExpandOptions {
  duration?: number;
  ease?: string;
}

const defaults: Required<ExpandOptions> = {
  duration: 0.4,
  ease: 'elastic.out(1, 0.6)',
};

/**
 * Expand element from current size to target size.
 * Desktop: animates height first, then width.
 * Mobile: animates height only.
 */
export const expandTo = (
  element: HTMLElement,
  targetWidth: number,
  targetHeight: number,
  options: ExpandOptions = {}
): gsap.core.Timeline => {
  const { duration, ease } = { ...defaults, ...options };
  const isMobile = window.innerWidth <= 900;

  const tl = gsap.timeline();

  if (isMobile) {
    tl.to(element, { height: targetHeight, duration, ease });
  } else {
    tl.to(element, { height: targetHeight, duration, ease });
    tl.to(element, { width: targetWidth, duration, ease });
  }

  return tl;
};

/**
 * Contract element from current size to target size.
 * Desktop: animates width first, then height.
 * Mobile: animates height only.
 */
export const contractTo = (
  element: HTMLElement,
  targetWidth: number,
  targetHeight: number,
  options: ExpandOptions = {}
): gsap.core.Timeline => {
  const { duration, ease } = { ...defaults, ...options };
  const isMobile = window.innerWidth <= 900;

  const tl = gsap.timeline();

  if (isMobile) {
    tl.to(element, { height: targetHeight, duration, ease });
  } else {
    tl.to(element, { width: targetWidth, duration, ease });
    tl.to(element, { height: targetHeight, duration, ease });
  }

  return tl;
};
