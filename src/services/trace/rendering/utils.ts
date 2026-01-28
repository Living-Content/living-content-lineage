/**
 * Shared utilities for graph rendering.
 */

/**
 * Creates a retina-ready canvas with the specified dimensions.
 * Returns both the canvas and its 2D context with proper scaling applied.
 */
export const createRetinaCanvas = (
  width: number,
  height: number,
  scale = 2
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  return { canvas, ctx };
};
