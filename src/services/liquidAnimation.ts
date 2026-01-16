/**
 * Liquid animation utilities using SVG filters.
 * The liquid effect uses blur + alpha contrast to create fluid edges.
 */
import gsap from 'gsap';

let liquidFilterElement: SVGFilterElement | null = null;

export function setLiquidFilterElement(element: SVGFilterElement): void {
  liquidFilterElement = element;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

interface LiquidConfig {
  blur?: { min: number; max: number };
  contrast?: { min: number; max: number };
}

const defaultConfig: Required<LiquidConfig> = {
  blur: { min: 8, max: 15 },
  contrast: { min: 16, max: 22 },
};

/**
 * Randomizes the liquid filter parameters for variation.
 */
export function randomizeLiquidFilter(config: LiquidConfig = {}): void {
  if (!liquidFilterElement) return;

  const { blur, contrast } = { ...defaultConfig, ...config };
  const blurAmount = randomBetween(blur.min, blur.max);
  const contrastAmount = randomBetween(contrast.min, contrast.max);

  const blurEl = liquidFilterElement.querySelector('feGaussianBlur');
  const matrixEl = liquidFilterElement.querySelector('feColorMatrix');

  if (blurEl) blurEl.setAttribute('stdDeviation', String(blurAmount));
  if (matrixEl) {
    matrixEl.setAttribute(
      'values',
      `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrastAmount} -7`
    );
  }
}

/**
 * Applies liquid class to element for duration of animation.
 */
export function applyLiquidClass(element: HTMLElement): () => void {
  element.classList.add('liquid');
  return () => element.classList.remove('liquid');
}

interface LiquidAnimationOptions {
  duration?: { min: number; max: number };
  ease?: string;
  onComplete?: () => void;
}

/**
 * Fade in with liquid effect.
 */
export function liquidFadeIn(
  element: HTMLElement,
  options: LiquidAnimationOptions = {}
): gsap.core.Tween {
  const { duration = { min: 0.4, max: 0.6 }, ease = 'power2.out', onComplete } = options;

  randomizeLiquidFilter();
  const removeLiquid = applyLiquidClass(element);

  return gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration: randomBetween(duration.min, duration.max),
      ease,
      onComplete: () => {
        removeLiquid();
        onComplete?.();
      },
    }
  );
}

/**
 * Fade out with liquid effect.
 */
export function liquidFadeOut(
  element: HTMLElement,
  options: LiquidAnimationOptions = {}
): gsap.core.Tween {
  const { duration = { min: 0.3, max: 0.5 }, ease = 'power2.in', onComplete } = options;

  randomizeLiquidFilter();
  const removeLiquid = applyLiquidClass(element);

  return gsap.to(element, {
    opacity: 0,
    duration: randomBetween(duration.min, duration.max),
    ease,
    onComplete: () => {
      removeLiquid();
      onComplete?.();
    },
  });
}

/**
 * Start liquid effect (call before GSAP Flip or other animations).
 * Returns cleanup function to remove liquid class.
 */
export function startLiquid(element: HTMLElement): () => void {
  randomizeLiquidFilter();
  return applyLiquidClass(element);
}
