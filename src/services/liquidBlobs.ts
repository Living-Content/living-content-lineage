/**
 * Liquid blob generation and animation.
 * Uses caching and incremental updates for performance.
 */
import gsap from 'gsap';

export interface Blob {
  x: number;
  y: number;
  r: number;
  element?: HTMLElement;
}

export const LIQUID_CONFIG = {
  speedMultiplier: 1.2,
  areaSizeSlowdown: 0.5,
  minRadiusRatio: 0.14,
  maxRadiusRatio: 0.26,
  mergeThresholdRatio: 0.5,
  translationRatio: 0.3,
  baseStaggerDelay: 0.012,
  baseBlobDuration: 0.2,
  scaleOvershoot: 0.2,
  timingVariation: 0.4,
  edgeOverflow: 50,
};

interface BlobConfig {
  minRadius: number;
  maxRadius: number;
  mergeThreshold: number;
}

interface AnimConfig {
  staggerDelay: number;
  blobDuration: number;
  ease: string;
}

const randomBetween = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

const isMobile = (): boolean => {
  return typeof window !== 'undefined' && window.innerWidth <= 900;
};

const getBlobConfig = (width: number, height: number): BlobConfig => {
  const base = Math.min(width, height);
  const minRadius = Math.round(base * LIQUID_CONFIG.minRadiusRatio);
  const maxRadius = Math.round(base * LIQUID_CONFIG.maxRadiusRatio);
  return {
    minRadius,
    maxRadius,
    mergeThreshold: Math.round(((minRadius + maxRadius) / 2) * LIQUID_CONFIG.mergeThresholdRatio),
  };
};

const getAnimConfig = (width: number, height: number): AnimConfig => {
  const area = width * height;
  const areaFactor = 1 + (Math.sqrt(area / 100000) - 1) * LIQUID_CONFIG.areaSizeSlowdown;
  const speedFactor = LIQUID_CONFIG.speedMultiplier * areaFactor;
  return {
    staggerDelay: LIQUID_CONFIG.baseStaggerDelay * speedFactor,
    blobDuration: LIQUID_CONFIG.baseBlobDuration * speedFactor,
    ease: 'elastic.out(1, 0.5)',
  };
};

const isPointCovered = (x: number, y: number, blobs: Blob[]): boolean => {
  for (const blob of blobs) {
    const dx = x - blob.x;
    const dy = y - blob.y;
    if (dx * dx + dy * dy < blob.r * blob.r) return true;
  }
  return false;
};

const findUncoveredPoint = (
  blobs: Blob[],
  minX: number, maxX: number,
  minY: number, maxY: number,
  spacing: number
): { x: number; y: number } | null => {
  for (let x = minX; x <= maxX; x += spacing) {
    for (let y = minY; y <= maxY; y += spacing) {
      if (!isPointCovered(x, y, blobs)) return { x, y };
    }
  }
  return null;
};

const findNearestBlob = (x: number, y: number, blobs: Blob[]): Blob => {
  let nearest = blobs[0];
  let minDist = Infinity;
  for (const blob of blobs) {
    const dx = x - blob.x;
    const dy = y - blob.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = blob;
    }
  }
  return nearest;
};

const calculateBlobs = (
  width: number,
  height: number,
  existingBlobs: Blob[] = []
): Blob[] => {
  const { minRadius, maxRadius, mergeThreshold } = getBlobConfig(width, height);
  const overflow = LIQUID_CONFIG.edgeOverflow;
  const spacing = minRadius * 0.8;
  const blobs = [...existingBlobs];

  if (blobs.length === 0) {
    const mobile = isMobile();
    blobs.push({
      x: mobile ? randomBetween(width * 0.4, width * 0.6) : randomBetween(width * 0.1, width * 0.3),
      y: mobile ? randomBetween(height * 0.1, height * 0.3) : randomBetween(height * 0.4, height * 0.6),
      r: randomBetween(minRadius, maxRadius),
    });
  }

  while (blobs.length < 500) {
    const uncovered = findUncoveredPoint(
      blobs, -overflow, width + overflow, -overflow, height + overflow, spacing
    );
    if (!uncovered) break;

    const parent = findNearestBlob(uncovered.x, uncovered.y, blobs);
    const angle = Math.atan2(uncovered.y - parent.y, uncovered.x - parent.x) + (Math.random() - 0.5) * 0.3;
    const r = randomBetween(minRadius, maxRadius);

    blobs.push({
      x: parent.x + Math.cos(angle) * (parent.r + r - mergeThreshold),
      y: parent.y + Math.sin(angle) * (parent.r + r - mergeThreshold),
      r,
    });
  }

  return blobs;
};

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
   */
  fill(width: number, height: number, ease?: string): gsap.core.Timeline {
    this.kill();
    this.unsolidify();
    this.baseBlobs = calculateBlobs(width, height);
    this.expansionBlobs = [];
    this.createElements(this.baseBlobs, height);

    const tl = gsap.timeline();
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
    this.unsolidify();
    const allBlobs = calculateBlobs(width, height);
    this.expansionBlobs = allBlobs;
    this.createElements(this.expansionBlobs, height);

    const tl = gsap.timeline();
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
    this.container.style.background = 'rgb(255, 255, 255)';
    this.container.style.filter = 'none';
    this.container.innerHTML = '';
    this.isSolid = true;
  }

  private unsolidify(): void {
    this.container.style.background = '';
    this.container.style.backdropFilter = '';
    this.container.style.setProperty('-webkit-backdrop-filter', '');
    this.container.style.filter = '';
    this.container.innerHTML = '';
    this.container.classList.add('liquid');
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
