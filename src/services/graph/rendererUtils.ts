/**
 * Shared utilities for graph rendering.
 */
import { Graphics } from 'pixi.js';
import { getColor } from '../../ui/theme.js';

/**
 * Draws a dot with fill and stroke at the specified position.
 */
export const drawDot = (
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number = 1
): void => {
  graphics.circle(x, y, radius);
  graphics.fill({ color, alpha });
  graphics.circle(x, y, radius);
  graphics.stroke({ width: 1, color: getColor('--color-edge-stroke'), alpha });
};

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
