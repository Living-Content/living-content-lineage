/**
 * Shared utilities for graph rendering.
 */
import { Graphics } from 'pixi.js';

/**
 * Draws a dot at the specified position.
 */
export const drawDot = (
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number = 1
): void => {
  // Scale up the radius for better visibility
  const scaledRadius = radius * 1.5;
  graphics.circle(x, y, scaledRadius);
  graphics.fill({ color, alpha });
};

/**
 * Draws an open chevron (>) pointing right at the specified position.
 * Used for left-side connectors on Action nodes.
 * Chevron is 45 degrees.
 */
export const drawChevron = (
  graphics: Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number = 1
): void => {
  // 45 degree chevron: depth equals height
  const scaledSize = size * 1.5;
  const arm = scaledSize; // 45 degrees means equal horizontal and vertical

  // Draw open chevron shape (>)
  graphics.moveTo(x, y - arm);
  graphics.lineTo(x + arm, y);
  graphics.lineTo(x, y + arm);
  graphics.stroke({ width: 2, color, alpha, cap: 'round', join: 'round' });
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
