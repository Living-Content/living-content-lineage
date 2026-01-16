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

  // First blob at random position within container
  const startX = randomBetween(width * 0.2, width * 0.8);
  const startY = randomBetween(height * 0.2, height * 0.8);

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
 * Create DOM elements for blobs inside a container.
 */
export function createBlobElements(
  container: HTMLElement,
  blobs: Blob[]
): HTMLElement[] {
  container.innerHTML = '';

  return blobs.map((blob) => {
    const el = document.createElement('div');
    el.className = 'liquid-blob';
    el.style.width = `${blob.r * 2}px`;
    el.style.height = `${blob.r * 2}px`;
    el.style.left = `${blob.x - blob.r}px`;
    el.style.top = `${blob.y - blob.r}px`;
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
 */
export function animateBlobExpansion(
  container: HTMLElement,
  blobs: Blob[],
  config: Partial<ExpansionConfig> = {}
): gsap.core.Timeline {
  const { staggerDelay, blobDuration, ease, fromScale, onComplete } = {
    ...defaultExpansionConfig,
    ...config,
  };

  // Clear and create elements
  const elements = createBlobElements(container, blobs);

  // Calculate center for distance sorting
  const centerX = blobs[0]?.x ?? 0;
  const centerY = blobs[0]?.y ?? 0;

  // Sort by distance from center (first blob)
  const sortedIndices = blobs
    .map((blob, i) => ({
      index: i,
      dist: Math.sqrt((blob.x - centerX) ** 2 + (blob.y - centerY) ** 2),
    }))
    .sort((a, b) => a.dist - b.dist)
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
 * Animate blobs collapsing inward (reverse of expansion).
 */
export function animateBlobCollapse(
  container: HTMLElement,
  config: Partial<ExpansionConfig> = {}
): gsap.core.Timeline {
  const { staggerDelay, blobDuration, ease, onComplete } = {
    ...defaultExpansionConfig,
    ...config,
    ease: config.ease ?? 'power2.in',
  };

  const elements = Array.from(container.querySelectorAll('.liquid-blob')) as HTMLElement[];

  if (elements.length === 0) {
    const tl = gsap.timeline({ onComplete });
    return tl;
  }

  // Get container bounds for center calculation
  const containerRect = container.getBoundingClientRect();
  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;

  // Sort by distance from center (furthest first for collapse)
  const sorted = elements
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const elCenterX = rect.left - containerRect.left + rect.width / 2;
      const elCenterY = rect.top - containerRect.top + rect.height / 2;
      const dist = Math.sqrt((elCenterX - centerX) ** 2 + (elCenterY - centerY) ** 2);
      return { el, dist };
    })
    .sort((a, b) => b.dist - a.dist); // Furthest first

  const tl = gsap.timeline({ onComplete });

  sorted.forEach(({ el }, i) => {
    tl.to(
      el,
      {
        scale: 0,
        duration: blobDuration * 0.7,
        ease,
      },
      i * staggerDelay * 0.5
    );
  });

  return tl;
}

/**
 * Read existing blob positions from container DOM elements.
 */
function readExistingBlobs(container: HTMLElement): Blob[] {
  const elements = Array.from(container.querySelectorAll('.liquid-blob')) as HTMLElement[];
  return elements.map((el) => ({
    x: parseFloat(el.style.left) + parseFloat(el.style.width) / 2,
    y: parseFloat(el.style.top) + parseFloat(el.style.height) / 2,
    r: parseFloat(el.style.width) / 2,
    element: el,
  }));
}

/**
 * Calculate additional blobs needed to fill expanded area.
 * Uses point sampling to verify actual coverage.
 */
function calculateAdditionalBlobs(
  existingBlobs: Blob[],
  newWidth: number,
  newHeight: number,
  config: BlobConfig
): Blob[] {
  const { minRadius, maxRadius, mergeThreshold } = config;

  // Target area (match overflow from calculateBlobs)
  const overflow = LIQUID_CONFIG.edgeOverflow;
  const targetMinX = -overflow;
  const targetMaxX = newWidth + overflow;
  const targetMinY = -overflow;
  const targetMaxY = newHeight + overflow;

  // Sample spacing for guaranteed coverage verification
  const sampleSpacing = minRadius * 0.8;

  const allBlobs = [...existingBlobs];
  const newBlobs: Blob[] = [];
  const maxBlobs = 500;

  // Keep adding blobs until all sampled points are covered
  while (allBlobs.length < maxBlobs) {
    const uncoveredPoint = findUncoveredPoint(
      allBlobs,
      targetMinX,
      targetMaxX,
      targetMinY,
      targetMaxY,
      sampleSpacing
    );

    if (!uncoveredPoint) {
      break;
    }

    const parent = findNearestBlob(uncoveredPoint.x, uncoveredPoint.y, allBlobs);
    const dx = uncoveredPoint.x - parent.x;
    const dy = uncoveredPoint.y - parent.y;
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;

    const r = randomBetween(minRadius, maxRadius);
    const dist = parent.r + r - mergeThreshold;

    const newBlob: Blob = {
      x: parent.x + Math.cos(angle) * dist,
      y: parent.y + Math.sin(angle) * dist,
      r,
    };

    allBlobs.push(newBlob);
    newBlobs.push(newBlob);
  }

  return newBlobs;
}

/**
 * Find edge blobs (outermost) to use as expansion origins.
 */
function findEdgeBlobs(blobs: Blob[], count: number): Blob[] {
  if (blobs.length <= count) return blobs;

  // Calculate centroid
  const cx = blobs.reduce((sum, b) => sum + b.x, 0) / blobs.length;
  const cy = blobs.reduce((sum, b) => sum + b.y, 0) / blobs.length;

  // Sort by distance from centroid (furthest first)
  const sorted = [...blobs].sort((a, b) => {
    const distA = Math.sqrt((a.x - cx) ** 2 + (a.y - cy) ** 2);
    const distB = Math.sqrt((b.x - cx) ** 2 + (b.y - cy) ** 2);
    return distB - distA;
  });

  return sorted.slice(0, count);
}

/**
 * Expand blobs to fill a larger container.
 * Animates from multiple edge points simultaneously for organic growth.
 */
export function expandBlobsToFill(
  container: HTMLElement,
  newWidth: number,
  newHeight: number,
  expansionConfig: Partial<ExpansionConfig> = {}
): gsap.core.Timeline {
  const scaledBlobConfig = getScaledBlobConfig(newWidth, newHeight);
  const scaledExpansionConfig = getScaledExpansionConfig(newWidth, newHeight);
  const finalExpansionConfig = { ...scaledExpansionConfig, ...expansionConfig };

  const { staggerDelay, blobDuration, ease, onComplete } = {
    ...defaultExpansionConfig,
    ...finalExpansionConfig,
  };

  // Read existing blobs and find edge points to expand from
  const existingBlobs = readExistingBlobs(container);
  const edgeBlobs = findEdgeBlobs(existingBlobs, 4); // 4 expansion origins

  // Calculate new blobs needed
  const newBlobs = calculateAdditionalBlobs(
    existingBlobs,
    newWidth,
    newHeight,
    scaledBlobConfig
  );

  // Create elements for new blobs
  const newElements = newBlobs.map((blob) => {
    const el = document.createElement('div');
    el.className = 'liquid-blob';
    el.style.width = `${blob.r * 2}px`;
    el.style.height = `${blob.r * 2}px`;
    el.style.left = `${blob.x - blob.r}px`;
    el.style.top = `${blob.y - blob.r}px`;
    gsap.set(el, { scale: 0, transformOrigin: 'center center' });
    container.appendChild(el);
    return el;
  });

  // Group blobs by nearest edge blob (expansion origin)
  const blobGroups: Map<Blob, Array<{ blob: Blob; el: HTMLElement; dist: number }>> = new Map();
  edgeBlobs.forEach((edge) => blobGroups.set(edge, []));

  newBlobs.forEach((blob, i) => {
    // Find nearest edge blob
    let nearestEdge = edgeBlobs[0];
    let minDist = Infinity;
    edgeBlobs.forEach((edge) => {
      const dist = Math.sqrt((blob.x - edge.x) ** 2 + (blob.y - edge.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearestEdge = edge;
      }
    });
    blobGroups.get(nearestEdge)!.push({ blob, el: newElements[i], dist: minDist });
  });

  // Sort each group by distance from its edge origin
  blobGroups.forEach((group) => {
    group.sort((a, b) => a.dist - b.dist);
  });

  // Animate all groups simultaneously
  const tl = gsap.timeline({ onComplete });
  const variation = LIQUID_CONFIG.timingVariation;
  const overshoot = LIQUID_CONFIG.scaleOvershoot;
  const translateRatio = LIQUID_CONFIG.translationRatio;

  blobGroups.forEach((group) => {
    group.forEach(({ blob, el }, i) => {
      const finalScale = 1.0 + Math.random() * overshoot;
      const duration = blobDuration * (1 - variation / 2 + Math.random() * variation);
      const staggerTime = i * staggerDelay * (1 - variation / 2 + Math.random() * variation);

      // Random starting offset
      const translateDist = blob.r * translateRatio;
      const angle = Math.random() * Math.PI * 2;
      gsap.set(el, { x: Math.cos(angle) * translateDist, y: Math.sin(angle) * translateDist });

      tl.to(
        el,
        {
          scale: finalScale,
          x: 0,
          y: 0,
          duration,
          ease,
        },
        staggerTime // All groups start at same base time
      );
    });
  });

  return tl;
}

/**
 * Contract blobs to fit a smaller container.
 * Collapses old blobs and regenerates new ones for guaranteed coverage.
 */
export function contractBlobsToFit(
  container: HTMLElement,
  newWidth: number,
  newHeight: number,
  expansionConfig: Partial<ExpansionConfig> = {}
): gsap.core.Timeline {
  const scaledBlobConfig = getScaledBlobConfig(newWidth, newHeight);
  const scaledExpansionConfig = getScaledExpansionConfig(newWidth, newHeight);
  const finalExpansionConfig = { ...scaledExpansionConfig, ...expansionConfig };

  const { staggerDelay, blobDuration, ease, onComplete } = {
    ...defaultExpansionConfig,
    ...finalExpansionConfig,
  };

  const elements = Array.from(container.querySelectorAll('.liquid-blob')) as HTMLElement[];
  const centerX = newWidth / 2;
  const centerY = newHeight / 2;

  const tl = gsap.timeline();

  // Sort elements by distance from new center (furthest first for collapse)
  const sortedElements = elements
    .map((el) => {
      const x = parseFloat(el.style.left) + parseFloat(el.style.width) / 2;
      const y = parseFloat(el.style.top) + parseFloat(el.style.height) / 2;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return { el, dist };
    })
    .sort((a, b) => b.dist - a.dist);

  // Collapse all old blobs (furthest first)
  const collapseTime = sortedElements.length * staggerDelay * 0.3;
  sortedElements.forEach(({ el }, i) => {
    tl.to(
      el,
      {
        scale: 0,
        duration: blobDuration * 0.5,
        ease: 'power2.in',
        onComplete: () => el.remove(),
      },
      i * staggerDelay * 0.3
    );
  });

  // Generate new blobs for smaller container with guaranteed coverage
  const newBlobs = calculateBlobs(newWidth, newHeight, scaledBlobConfig);

  // Create and animate new blobs after collapse
  const variation = LIQUID_CONFIG.timingVariation;
  const overshoot = LIQUID_CONFIG.scaleOvershoot;
  const translateRatio = LIQUID_CONFIG.translationRatio;

  newBlobs.forEach((blob, i) => {
    const el = document.createElement('div');
    el.className = 'liquid-blob';
    el.style.width = `${blob.r * 2}px`;
    el.style.height = `${blob.r * 2}px`;
    el.style.left = `${blob.x - blob.r}px`;
    el.style.top = `${blob.y - blob.r}px`;

    const translateDist = blob.r * translateRatio;
    const angle = Math.random() * Math.PI * 2;
    gsap.set(el, {
      scale: 0,
      transformOrigin: 'center center',
      x: Math.cos(angle) * translateDist,
      y: Math.sin(angle) * translateDist,
    });

    container.appendChild(el);

    const finalScale = 1.0 + Math.random() * overshoot;
    const duration = blobDuration * (1 - variation / 2 + Math.random() * variation);
    const startTime = collapseTime + i * staggerDelay * (1 - variation / 2 + Math.random() * variation);

    tl.to(
      el,
      {
        scale: finalScale,
        x: 0,
        y: 0,
        duration,
        ease,
      },
      startTime
    );
  });

  if (onComplete) {
    tl.call(onComplete);
  }

  return tl;
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
  return animateBlobExpansion(container, blobs, finalExpansionConfig);
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
  createBlobElements(container, blobs);
  return blobs;
}
