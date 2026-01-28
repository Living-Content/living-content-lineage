/**
 * Canvas texture rendering for graph nodes.
 */
import { Texture } from 'pixi.js';
import { getCssVar } from '../../../themes/theme.js';
import { GEOMETRY } from '../../../config/animation.js';
import { createRetinaCanvas } from './utils.js';
import { getNodeFontFamily, truncateText, type ScaledDimensions } from './nodeMeasurement.js';
import type { NodeRenderOptions } from './nodeRenderer.js';

/**
 * Draws the left highlight bar.
 * Width scales with node scale for consistent visual weight.
 */
const drawHighlightBar = (
  ctx: CanvasRenderingContext2D,
  height: number,
  color: string,
  scale: number = 1
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, GEOMETRY.HIGHLIGHT_BAR_WIDTH * scale, height);
};

export const createNodeTexture = (
  options: NodeRenderOptions,
  color: string,
  width: number,
  height: number,
  iconImage: HTMLImageElement | null,
  dims: ScaledDimensions,
  scale: number = 1
): Texture => {
  const { canvas, ctx } = createRetinaCanvas(width, height);
  const borderRadius = GEOMETRY.NODE_BORDER_RADIUS * scale;

  // Draw node background with rounded corners
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, borderRadius);
  ctx.fillStyle = getCssVar('--color-node-bg');
  ctx.fill();

  // Clip to rounded rect so highlight bar respects corners
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, borderRadius);
  ctx.clip();

  // Draw highlight bar (colored stripe on left)
  drawHighlightBar(ctx, height, color, scale);

  ctx.restore();

  // Content offset (accounts for highlight bar)
  const contentOffset = GEOMETRY.HIGHLIGHT_BAR_WIDTH * scale;

  // TEMPORARILY DISABLED: Draw large semi-transparent watermark icon
  // if (iconImage && iconImage.complete && iconImage.naturalWidth > 0) {
  //   const watermarkScale = 2.5;
  //   const watermarkAlpha = 0.15;
  //   const watermarkOffsetX = -0.2;
  //   const watermarkSize = dims.iconDiameter * watermarkScale;
  //
  //   ctx.save();
  //   ctx.globalAlpha = watermarkAlpha;
  //   const iconX = contentOffset + watermarkSize * watermarkOffsetX;
  //   const iconY = (height - watermarkSize) / 2;
  //   ctx.drawImage(iconImage, iconX, iconY, watermarkSize, watermarkSize);
  //   ctx.restore();
  // }
  void iconImage; // Suppress unused warning

  ctx.textBaseline = 'middle';
  ctx.fillStyle = getCssVar('--color-text-primary');

  const rightPadding = 12 * scale;

  if (options.mode === 'detailed' && options.mainLabel) {
    // Two-line layout: type label (sans) + main label (mono), left-aligned
    const textStartX = contentOffset + dims.leftPadding;
    const maxTextWidth = width - textStartX - rightPadding;
    const lineSpacing = height * 0.18;
    const typeY = height / 2 - lineSpacing;
    const mainY = height / 2 + lineSpacing;

    ctx.textAlign = 'left';
    ctx.font = `600 ${dims.typeLabelFontSize}px ${getNodeFontFamily()}`;
    const truncatedType = truncateText(ctx, options.typeLabel, maxTextWidth);
    ctx.fillText(truncatedType, textStartX, typeY);

    ctx.font = `400 ${dims.mainLabelFontSize}px ${getNodeFontFamily('mono')}`;
    const truncatedMain = truncateText(ctx, options.mainLabel, maxTextWidth);
    ctx.fillText(truncatedMain, textStartX, mainY);
  } else {
    // Single-line layout: centered in content area (after highlight bar)
    const contentWidth = width - contentOffset - rightPadding * 2;
    const textCenterX = contentOffset + rightPadding + contentWidth / 2;
    const maxTextWidth = contentWidth;

    ctx.textAlign = 'center';
    ctx.font = `600 ${dims.simpleTypeFontSize}px ${getNodeFontFamily()}`;
    const truncatedType = truncateText(ctx, options.typeLabel, maxTextWidth);
    ctx.fillText(truncatedType, textCenterX, height / 2);
  }

  return Texture.from(canvas);
};

/**
 * Creates an icon-only texture with the icon rendered at the specified color.
 * Used for Action nodes which are pure connectors without background shapes.
 */
export const createIconOnlyTexture = (
  iconImage: HTMLImageElement | null,
  color: string,
  size: number
): Texture => {
  const { canvas, ctx } = createRetinaCanvas(size, size);

  if (iconImage && iconImage.complete && iconImage.naturalWidth > 0) {
    ctx.drawImage(iconImage, 0, 0, size, size);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
  }

  return Texture.from(canvas);
};

export const createKnockoutNodeTexture = (
  label: string,
  color: string,
  width: number,
  height: number,
  fontSize: number,
  badgeCount?: number
): Texture => {
  const { canvas, ctx } = createRetinaCanvas(width, height);

  const radius = height / 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.font = `600 ${fontSize}px ${getNodeFontFamily()}`;
  ctx.textBaseline = 'middle';

  if (badgeCount !== undefined) {
    const badgeRadius = height * 0.32;
    const badgeFontSize = fontSize * 0.75;
    const rightPadding = 16;
    const badgeCenterX = width - rightPadding - badgeRadius;

    ctx.textAlign = 'center';
    ctx.fillText(label, (width - badgeRadius * 2 - rightPadding) / 2, height / 2);

    ctx.beginPath();
    ctx.arc(badgeCenterX, height / 2, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.font = `600 ${badgeFontSize}px ${getNodeFontFamily()}`;
    ctx.fillText(String(badgeCount), badgeCenterX, height / 2);
  } else {
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, height / 2);
  }

  return Texture.from(canvas);
};
