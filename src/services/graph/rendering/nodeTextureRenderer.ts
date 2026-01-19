/**
 * Canvas texture rendering for graph nodes.
 */
import { Texture } from 'pixi.js';
import { getCssVar } from '../../../theme/theme.js';
import { createRetinaCanvas } from './rendererUtils.js';
import { getNodeFontFamily, type ScaledDimensions } from './nodeTextMeasurement.js';
import type { NodeRenderOptions } from './nodeRenderer.js';

export const createNodeTexture = (
  options: NodeRenderOptions,
  color: string,
  width: number,
  height: number,
  iconImage: HTMLImageElement | null,
  dims: ScaledDimensions
): Texture => {
  const { canvas, ctx } = createRetinaCanvas(width, height);

  const radius = height / 2;

  // Draw node background
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();

  // Draw icon circle
  const iconCenterX = dims.leftPadding + dims.iconDiameter / 2;
  const iconCenterY = height / 2;
  const iconRadius = dims.iconDiameter / 2;

  // Cut out the icon circle
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(iconCenterX, iconCenterY, iconRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw the icon inside the circle
  if (iconImage && iconImage.complete && iconImage.naturalWidth > 0) {
    ctx.globalCompositeOperation = 'source-over';
    const iconSize = dims.iconDiameter * 0.55;
    const iconX = iconCenterX - iconSize / 2;
    const iconY = iconCenterY - iconSize / 2;

    // Draw icon with the node color
    ctx.save();
    ctx.beginPath();
    ctx.arc(iconCenterX, iconCenterY, iconRadius - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
    ctx.restore();
  }

  // Text positioning
  const textStartX = dims.leftPadding + dims.iconDiameter + dims.iconTextGap;

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (options.mode === 'detailed' && options.mainLabel) {
    // Two-line layout: type label (small, black) + main label (normal, white)
    const lineSpacing = height * 0.18;
    const typeY = height / 2 - lineSpacing;
    const mainY = height / 2 + lineSpacing;

    // Type label - dark text
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = getCssVar('--color-text-primary');
    ctx.font = `600 ${dims.typeLabelFontSize}px ${getNodeFontFamily()}`;
    ctx.fillText(options.typeLabel, textStartX, typeY);

    // Main label - white text
    ctx.fillStyle = getCssVar('--color-node-text');
    ctx.font = `400 ${dims.typeLabelFontSize}px ${getNodeFontFamily()}`;
    ctx.fillText(options.mainLabel, textStartX, mainY);
  } else {
    // Single-line layout: just type label (dark)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = getCssVar('--color-text-primary');
    ctx.font = `600 ${dims.simpleTypeFontSize}px ${getNodeFontFamily()}`;
    ctx.fillText(options.typeLabel, textStartX, height / 2);
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
