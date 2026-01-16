/**
 * Liquid blob generation and animation.
 * Creates blob layouts that expand like foam to fill a container.
 */
import gsap from 'gsap';

export interface Blob {
  x: number;
  y: number;
  r: number;
  element?: HTMLElement;
}

/**
 * Master configuration for liquid blob system.
 * Adjust these values to tune the overall behavior.
 */
export const LIQUID_CONFIG = {
  // === SPEED CONTROL ===
  // Global speed multiplier - higher = slower (1.0 = normal, 2.0 = half speed)
  speedMultiplier: 1.2,
  // How much larger areas slow down (0 = same speed, 1 = proportional slowdown)
  areaSizeSlowdown: 0.5,

  // === BLOB SIZING (as fraction of container's smaller dimension) ===
  // Blob radius = smallerDimension * (minRadiusRatio to maxRadiusRatio)
  minRadiusRatio: 0.14,
  maxRadiusRatio: 0.26,
  // Merge threshold as fraction of average radius (higher = more overlap)
  mergeThresholdRatio: 0.5,
  // Random translation distance as fraction of blob radius
  translationRatio: 0.3,
  // Higher = more blobs for denser coverage
  coverageMultiplier: 1.5,

  // === ANIMATION ===
  // Base stagger delay between blobs (seconds)
  baseStaggerDelay: 0.012,
  // Base duration for each blob to scale up (seconds)
  baseBlobDuration: 0.2,
  // Scale randomization range (1.0 to 1.0 + this value)
  scaleOvershoot: 0.2,
  // Timing randomization range (±this/2, e.g., 0.4 = ±20%)
  timingVariation: 0.4,

  // === COVERAGE ===
  // Extra pixels past container edge for SVG filter shrinkage (increase with blur)
  edgeOverflow: 50,
};

export interface BlobConfig {
  minRadius: number;
  maxRadius: number;
  mergeThreshold: number;
  coverageMultiplier: number;
}

/**
 * Calculate blob config dynamically based on container dimensions.
 * Blob sizes are proportional to the smaller container dimension.
 */
export function getScaledBlobConfig(width: number, height: number): BlobConfig {
  // Use smaller dimension as base for proportional sizing
  const base = Math.min(width, height);

  const minRadius = Math.round(base * LIQUID_CONFIG.minRadiusRatio);
  const maxRadius = Math.round(base * LIQUID_CONFIG.maxRadiusRatio);
  const avgRadius = (minRadius + maxRadius) / 2;

  return {
    minRadius,
    maxRadius,
    mergeThreshold: Math.round(avgRadius * LIQUID_CONFIG.mergeThresholdRatio),
    coverageMultiplier: LIQUID_CONFIG.coverageMultiplier,
  };
}

/**
 * Calculate expansion config based on container size.
 * Uses areaSizeSlowdown to control how much larger areas slow down.
 */
export function getScaledExpansionConfig(
  width: number,
  height: number
): Partial<ExpansionConfig> {
  const area = width * height;
  const baseArea = 100000; // Reference: small panel

  // Calculate area-based slowdown
  // areaSizeSlowdown: 0 = no effect, 1 = full proportional slowdown
  const areaRatio = area / baseArea;
  const slowdown = LIQUID_CONFIG.areaSizeSlowdown;
  const areaFactor = 1 + (Math.sqrt(areaRatio) - 1) * slowdown;

  // Apply both global multiplier and area-based factor
  const speedFactor = LIQUID_CONFIG.speedMultiplier * areaFactor;

  return {
    staggerDelay: LIQUID_CONFIG.baseStaggerDelay * speedFactor,
    blobDuration: LIQUID_CONFIG.baseBlobDuration * speedFactor,
  };
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Check if a point is covered by any blob.
 */
function isPointCovered(x: number, y: number, blobs: Blob[]): boolean {
  for (const blob of blobs) {
    const dx = x - blob.x;
    const dy = y - blob.y;
    if (dx * dx + dy * dy < blob.r * blob.r) {
      return true;
    }
  }
  return false;
}

/**
 * Find an uncovered point in the target area by sampling a grid.
 * Returns null if all sampled points are covered.
 */
function findUncoveredPoint(
  blobs: Blob[],
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  sampleSpacing: number
): { x: number; y: number } | null {
  for (let x = minX; x <= maxX; x += sampleSpacing) {
    for (let y = minY; y <= maxY; y += sampleSpacing) {
      if (!isPointCovered(x, y, blobs)) {
        return { x, y };
      }
    }
  }
  return null;
}

/**
 * Find the nearest blob to a point.
 */
function findNearestBlob(x: number, y: number, blobs: Blob[]): Blob {
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
}

/**
 * Calculate blob positions to fill a rectangular area.
 * Uses point sampling to verify actual coverage, not just bounds.
 */
export function calculateBlobs(
  width: number,
  height: number,
  config: Partial<BlobConfig> = {}
): Blob[] {
  // Get dynamic defaults based on container size, then apply overrides
  const scaledConfig = getScaledBlobConfig(width, height);
  const { minRadius, maxRadius, mergeThreshold } = {
    ...scaledConfig,
    ...config,
  };

  const blobs: Blob[] = [];

  // Target area to fill (extend past edges for visual coverage after filter)
  const overflow = LIQUID_CONFIG.edgeOverflow;
  const targetMinX = -overflow;
  const targetMaxX = width + overflow;
  const targetMinY = -overflow;
  const targetMaxY = height + overflow;

  // Sample spacing for coverage check - smaller = more accurate but slower
  const sampleSpacing = minRadius * 0.8;

  // Starting position depends on layout:
  // Desktop (>900px): left side, vertically centered
  // Mobile (<=900px): horizontally centered, at bottom
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 900;
  const startX = isMobile
    ? randomBetween(width * 0.4, width * 0.6)  // middle horizontally
    : randomBetween(width * 0.1, width * 0.3); // left side
  const startY = isMobile
    ? randomBetween(height * 0.1, height * 0.3) // bottom (low Y = bottom with bottom positioning)
    : randomBetween(height * 0.4, height * 0.6); // middle vertically

  blobs.push({
    x: startX,
    y: startY,
    r: randomBetween(minRadius, maxRadius),
  });

  // Safety limit
  const maxBlobs = 500;

  // Keep adding blobs until ALL sampled points are covered
  while (blobs.length < maxBlobs) {
    const uncoveredPoint = findUncoveredPoint(
      blobs,
      targetMinX,
      targetMaxX,
      targetMinY,
      targetMaxY,
      sampleSpacing
    );

    // If no uncovered points, we're done
    if (!uncoveredPoint) {
      break;
    }

    // Find the nearest existing blob to grow from
    const parent = findNearestBlob(uncoveredPoint.x, uncoveredPoint.y, blobs);

    // Calculate angle from parent toward uncovered point
    const dx = uncoveredPoint.x - parent.x;
    const dy = uncoveredPoint.y - parent.y;
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;

    // New blob radius
    const r = randomBetween(minRadius, maxRadius);

    // Distance for overlap with parent
    const dist = parent.r + r - mergeThreshold;

    blobs.push({
      x: parent.x + Math.cos(angle) * dist,
      y: parent.y + Math.sin(angle) * dist,
      r,
    });
  }

  return blobs;
}

/**
 * Check if current viewport is mobile layout.
 */
function isMobileLayout(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 900;
}

/**
 * Create DOM elements for blobs inside a container.
 * Desktop: positioned relative to vertical center (stays centered on resize)
 * Mobile: positioned from bottom (stays at bottom on resize)
 */
export function createBlobElements(
  container: HTMLElement,
  blobs: Blob[],
  containerHeight: number
): HTMLElement[] {
  container.innerHTML = '';
  const isMobile = isMobileLayout();
  const centerY = containerHeight / 2;

  return blobs.map((blob) => {
    const el = document.createElement('div');
    el.className = 'liquid-blob';
    el.style.width = `${blob.r * 2}px`;
    el.style.height = `${blob.r * 2}px`;
    el.style.left = `${blob.x - blob.r}px`;
    el.dataset.y = String(blob.y); // Store Y for reading later

    if (isMobile) {
      // Position from bottom
      el.style.bottom = `${blob.y - blob.r}px`;
    } else {
      // Position relative to vertical center: calc(50% + offset)
      const offsetFromCenter = blob.y - centerY;
      el.style.top = `calc(50% + ${offsetFromCenter - blob.r}px)`;
    }

    container.appendChild(el);
    blob.element = el;
    return el;
  });
}

export interface ExpansionConfig {
  staggerDelay: number;      // Delay between each blob (seconds)
  blobDuration: number;      // Duration for each blob to scale up (seconds)
  ease: string;              // GSAP ease
  fromScale: number;         // Starting scale (0 = invisible)
  onComplete?: () => void;
}

const defaultExpansionConfig: ExpansionConfig = {
  staggerDelay: 0.03,
  blobDuration: 0.4,
  ease: 'elastic.out(1, 0.5)',
  fromScale: 0,
};

/**
 * Animate blobs expanding outward like foam.
 * Each blob has randomized scale, duration, and timing for organic feel.
 * Animation proceeds from bottom to top (bottom blobs appear first).
 */
export function animateBlobExpansion(
  container: HTMLElement,
  blobs: Blob[],
  containerHeight: number,
  config: Partial<ExpansionConfig> = {}
): gsap.core.Timeline {
  const { staggerDelay, blobDuration, ease, fromScale, onComplete } = {
    ...defaultExpansionConfig,
    ...config,
  };

  // Clear and create elements
  const elements = createBlobElements(container, blobs, containerHeight);

  // Desktop: sort by X (left to right)
  // Mobile: sort by Y (bottom to top, low Y = near bottom)
  const isMobile = isMobileLayout();
  const sortedIndices = blobs
    .map((blob, i) => ({ index: i, x: blob.x, y: blob.y }))
    .sort((a, b) => isMobile ? a.y - b.y : a.x - b.x)
    .map((item) => item.index);

  // Create timeline
  const tl = gsap.timeline({ onComplete });

  // Set initial state - all blobs start scaled to 0
  elements.forEach((el) => {
    gsap.set(el, { scale: fromScale, transformOrigin: 'center center' });
  });

  // Animate each blob with randomized properties
  const variation = LIQUID_CONFIG.timingVariation;
  const overshoot = LIQUID_CONFIG.scaleOvershoot;
  const translateRatio = LIQUID_CONFIG.translationRatio;

  sortedIndices.forEach((blobIndex, i) => {
    const el = elements[blobIndex];
    const blob = blobs[blobIndex];

    // Randomize scale with configurable overshoot
    const finalScale = 1.0 + Math.random() * overshoot;

    // Randomize duration with configurable variation
    const duration = blobDuration * (1 - variation / 2 + Math.random() * variation);

    // Randomize stagger timing
    const staggerTime = i * staggerDelay * (1 - variation / 2 + Math.random() * variation);

    // Random starting offset (translate from this position to final)
    const translateDist = blob.r * translateRatio;
    const angle = Math.random() * Math.PI * 2;
    const startX = Math.cos(angle) * translateDist;
    const startY = Math.sin(angle) * translateDist;

    // Set initial offset
    gsap.set(el, { x: startX, y: startY });

    tl.to(
      el,
      {
        scale: finalScale,
        x: 0,
        y: 0,
        duration,
        ease,
      },
      staggerTime
    );
  });

  return tl;
}

/**
 * Regenerate blobs for a larger container.
 * Clears existing blobs and creates fresh ones for proper coverage.
 */
export function expandBlobsToFill(
  container: HTMLElement,
  newWidth: number,
  newHeight: number,
  expansionConfig: Partial<ExpansionConfig> = {}
): gsap.core.Timeline {
  // Clear existing blobs and generate fresh ones for the new size
  container.innerHTML = '';
  const blobs = calculateBlobs(newWidth, newHeight);
  return animateBlobExpansion(container, blobs, newHeight, expansionConfig);
}

/**
 * Fill container with blobs and animate expansion.
 * Automatically scales blob sizes and animation speed to container dimensions.
 */
export function fillWithAnimatedBlobs(
  container: HTMLElement,
  width: number,
  height: number,
  blobConfig: Partial<BlobConfig> = {},
  expansionConfig: Partial<ExpansionConfig> = {}
): gsap.core.Timeline {
  // Get scaled configs based on container size
  const scaledBlobConfig = getScaledBlobConfig(width, height);
  const scaledExpansionConfig = getScaledExpansionConfig(width, height);

  // Merge with any overrides
  const finalBlobConfig = { ...scaledBlobConfig, ...blobConfig };
  const finalExpansionConfig = { ...scaledExpansionConfig, ...expansionConfig };

  const blobs = calculateBlobs(width, height, finalBlobConfig);
  return animateBlobExpansion(container, blobs, height, finalExpansionConfig);
}

/**
 * Instantly fill container with blobs (no animation).
 */
export function fillWithBlobs(
  container: HTMLElement,
  width: number,
  height: number,
  config: Partial<BlobConfig> = {}
): Blob[] {
  const blobs = calculateBlobs(width, height, config);
  createBlobElements(container, blobs, height);
  return blobs;
}
