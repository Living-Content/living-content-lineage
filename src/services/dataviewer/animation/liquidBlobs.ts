/**
 * Liquid blob animation manager.
 * Uses caching and incremental updates for performance.
 */
import gsap from 'gsap';
import {
  type Blob,
  LIQUID_CONFIG,
  calculateBlobs,
  getAnimConfig,
  isMobile,
  skipFilter,
} from './blobCalculation.js';

export type { Blob } from './blobCalculation.js';
export { LIQUID_CONFIG } from './blobCalculation.js';

/**
 * Manages blob lifecycle with caching and incremental updates.
 */
export class BlobManager {
  private container: HTMLElement;
  private baseBlobs: Blob[] = [];
  private expansionBlobs: Blob[] = [];
  private timeline: gsap.core.Timeline | null = null;
  private isSolid = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Fill container with animated blobs, then blur, then solidify.
   * Falls back to simple fade on WebKit due to SVG filter compositing bug.
   */
  fill(width: number, height: number, ease?: string): gsap.core.Timeline {
    this.kill();

    const tl = gsap.timeline();

    if (skipFilter()) {
      this.solidifyInternal();
      this.timeline = tl;
      return tl;
    }

    this.unsolidify();
    this.baseBlobs = calculateBlobs(width, height);
    this.expansionBlobs = [];
    this.createElements(this.baseBlobs, height);

    const blobTl = this.animateBlobsInternal(this.baseBlobs, width, height, ease);
    tl.add(blobTl);
    tl.add(() => {
      this.container.style.backdropFilter = 'blur(20px)';
      this.container.style.setProperty('-webkit-backdrop-filter', 'blur(20px)');
    });
    tl.add(() => this.solidifyInternal());

    this.timeline = tl;
    return tl;
  }

  /**
   * Expand to fill larger container, then blur, then solidify.
   */
  expand(width: number, height: number, ease?: string): gsap.core.Timeline {
    this.kill();

    const tl = gsap.timeline();

    if (skipFilter()) {
      this.solidifyInternal();
      this.timeline = tl;
      return tl;
    }

    this.unsolidify();
    const allBlobs = calculateBlobs(width, height);
    this.expansionBlobs = allBlobs;
    this.createElements(this.expansionBlobs, height);

    const blobTl = this.animateBlobsInternal(this.expansionBlobs, width, height, ease);
    tl.add(blobTl);
    tl.add(() => {
      this.container.style.backdropFilter = 'blur(20px)';
      this.container.style.setProperty('-webkit-backdrop-filter', 'blur(20px)');
    });
    tl.add(() => this.solidifyInternal());

    this.timeline = tl;
    return tl;
  }

  /**
   * Contract back to base size, then blur, then solidify.
   */
  contract(): gsap.core.Timeline {
    this.kill();
    const tl = gsap.timeline();

    if (this.expansionBlobs.length > 0) {
      const elements = this.expansionBlobs.map((b) => b.element).filter(Boolean);
      tl.to(elements, { scale: 0, duration: 0.12, ease: 'power2.in', stagger: 0.005 });
      tl.call(() => {
        elements.forEach((el) => el?.remove());
        this.expansionBlobs = [];
      });
    }

    tl.add(() => {
      this.container.style.backdropFilter = 'blur(20px)';
      this.container.style.setProperty('-webkit-backdrop-filter', 'blur(20px)');
    });
    tl.add(() => this.solidifyInternal());

    this.timeline = tl;
    return tl;
  }

  private solidifyInternal(): void {
    if (this.isSolid) return;
    this.container.classList.remove('liquid');
    this.container.style.filter = 'none';
    this.container.style.backdropFilter = '';
    this.container.style.setProperty('-webkit-backdrop-filter', '');
    this.container.innerHTML = '';
    // Add solid to wrapper (grandparent: blob-container -> shape-layer -> wrapper)
    this.container.parentElement?.parentElement?.classList.add('solid');
    this.isSolid = true;
  }

  private unsolidify(): void {
    this.container.style.background = '';
    this.container.style.backdropFilter = '';
    this.container.style.setProperty('-webkit-backdrop-filter', '');
    this.container.style.filter = '';
    this.container.innerHTML = '';
    this.container.classList.add('liquid');
    this.container.parentElement?.parentElement?.classList.remove('solid');
    this.isSolid = false;
  }

  kill(): void {
    this.timeline?.kill();
    this.timeline = null;
  }

  private createElements(blobs: Blob[], containerHeight: number): void {
    const mobile = isMobile();
    const centerY = containerHeight / 2;

    for (const blob of blobs) {
      const el = document.createElement('div');
      el.className = 'liquid-blob';
      el.style.width = `${blob.r * 2}px`;
      el.style.height = `${blob.r * 2}px`;
      el.style.left = `${blob.x - blob.r}px`;
      el.dataset.y = String(blob.y);

      if (mobile) {
        el.style.bottom = `${blob.y - blob.r}px`;
      } else {
        el.style.top = `calc(50% + ${blob.y - centerY - blob.r}px)`;
      }

      this.container.appendChild(el);
      blob.element = el;
    }
  }

  private animateBlobsInternal(
    blobs: Blob[],
    width: number,
    height: number,
    ease?: string,
    staggerOffset = 0
  ): gsap.core.Timeline {
    const config = getAnimConfig(width, height);
    const { staggerDelay, blobDuration } = config;
    const { timingVariation, scaleOvershoot, translationRatio } = LIQUID_CONFIG;

    const mobile = isMobile();
    const sorted = [...blobs].sort((a, b) => (mobile ? a.y - b.y : a.x - b.x));

    const tl = gsap.timeline();

    sorted.forEach((blob, i) => {
      const el = blob.element;
      if (!el) return;

      const translateDist = blob.r * translationRatio;
      const angle = Math.random() * Math.PI * 2;
      gsap.set(el, {
        scale: 0,
        x: Math.cos(angle) * translateDist,
        y: Math.sin(angle) * translateDist,
        transformOrigin: 'center center',
      });

      const variation = 1 - timingVariation / 2 + Math.random() * timingVariation;
      tl.to(el, {
        scale: 1.0 + Math.random() * scaleOvershoot,
        x: 0,
        y: 0,
        duration: blobDuration * variation,
        ease: ease || config.ease,
      }, (staggerOffset + i) * staggerDelay * variation);
    });

    this.timeline = tl;
    return tl;
  }
}

export function createBlobManager(container: HTMLElement): BlobManager {
  return new BlobManager(container);
}
