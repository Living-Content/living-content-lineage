/**
 * Pill-shaped node rendering with icon circle and knockout text effect.
 * Shows asset type icon on left, with type label and optional main label.
 */
import { Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { ASSET_TYPE_ICON_PATHS, getCssVar, getColor, getPhaseColorHex } from '../../ui/theme.js';
import type { AssetType, LineageNodeData } from '../../types.js';
import { ASSET_TYPE_LABELS } from '../labels.js';
import { attachNodeInteraction, createSelectionAnimator, type NodeCallbacks } from './nodeInteraction.js';
import { createRetinaCanvas } from './rendererUtils.js';

export const DEFAULT_NODE_ALPHA = 1;

function getNodeFontFamily(): string {
  return getCssVar('--font-sans', '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif');
}

// Base dimensions (will be scaled)
const BASE_TYPE_LABEL_FONT_SIZE = 13;
const BASE_MAIN_LABEL_FONT_SIZE = 18;
const BASE_SIMPLE_TYPE_FONT_SIZE = 16;
const BASE_ICON_DIAMETER = 36;
const BASE_PILL_HEIGHT_DETAILED = 56;
const BASE_PILL_HEIGHT_SIMPLE = 48;
const BASE_LEFT_PADDING = 10;
const BASE_ICON_TEXT_GAP = 12;
const BASE_RIGHT_PADDING = 20;

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

function measureText(text: string, fontSize: number, fontWeight = '600'): number {
  measureCtx.font = `${fontWeight} ${fontSize}px ${getNodeFontFamily()}`;
  return measureCtx.measureText(text).width;
}

export interface PillNode extends Container {
  nodeData: LineageNodeData;
  pillWidth: number;
  pillHeight: number;
  baseScale: number;
  setSelected: (selected: boolean) => void;
  selectionRing?: Graphics;
}

export type PillViewMode = 'simple' | 'detailed';

export interface PillRenderOptions {
  mode: PillViewMode;
  iconPath: string;
  typeLabel: string;
  mainLabel?: string;
}

// Cache for loaded SVG icons
const iconCache = new Map<string, HTMLImageElement>();

async function loadIcon(iconPath: string): Promise<HTMLImageElement> {
  const cached = iconCache.get(iconPath);
  if (cached) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      iconCache.set(iconPath, img);
      resolve(img);
    };
    img.onerror = () => {
      // Return a placeholder on error
      resolve(img);
    };
    img.src = iconPath;
  });
}

interface ScaledDimensions {
  iconDiameter: number;
  leftPadding: number;
  iconTextGap: number;
  typeLabelFontSize: number;
  mainLabelFontSize: number;
  simpleTypeFontSize: number;
}

function getScaledDimensions(scale: number): ScaledDimensions {
  return {
    iconDiameter: BASE_ICON_DIAMETER * scale,
    leftPadding: BASE_LEFT_PADDING * scale,
    iconTextGap: BASE_ICON_TEXT_GAP * scale,
    typeLabelFontSize: BASE_TYPE_LABEL_FONT_SIZE * scale,
    mainLabelFontSize: BASE_MAIN_LABEL_FONT_SIZE * scale,
    simpleTypeFontSize: BASE_SIMPLE_TYPE_FONT_SIZE * scale,
  };
}

function createPillWithIconTexture(
  options: PillRenderOptions,
  color: string,
  width: number,
  height: number,
  iconImage: HTMLImageElement | null,
  dims: ScaledDimensions
): Texture {
  const { canvas, ctx } = createRetinaCanvas(width, height);

  const radius = height / 2;

  // Draw pill background
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
    ctx.fillStyle = getCssVar('--color-pill-text');
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
}

// Legacy knockout pill texture for stage nodes without icons
function createKnockoutPillTexture(
  label: string,
  color: string,
  width: number,
  height: number,
  fontSize: number,
  badgeCount?: number
): Texture {
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
}

function calculatePillWidth(options: PillRenderOptions, dims: ScaledDimensions, scale: number): number {
  const textStartX = dims.leftPadding + dims.iconDiameter + dims.iconTextGap;
  const rightPadding = BASE_RIGHT_PADDING * scale;

  if (options.mode === 'detailed' && options.mainLabel) {
    const typeWidth = measureText(options.typeLabel, dims.typeLabelFontSize);
    const mainWidth = measureText(options.mainLabel, dims.mainLabelFontSize);
    const maxTextWidth = Math.max(typeWidth, mainWidth);
    return textStartX + maxTextWidth + rightPadding;
  } else {
    const typeWidth = measureText(options.typeLabel, dims.simpleTypeFontSize);
    return textStartX + typeWidth + rightPadding;
  }
}

interface CreatePillNodeOptions {
  scale?: number;
  renderOptions?: PillRenderOptions;
  selectionLayer?: Container;
}

function getAssetTypeLabel(assetType?: AssetType): string {
  if (!assetType) return 'DATA';
  return (ASSET_TYPE_LABELS[assetType] ?? assetType).toUpperCase();
}

function getIconPath(assetType?: AssetType): string {
  if (!assetType) return ASSET_TYPE_ICON_PATHS.DataObject;
  return ASSET_TYPE_ICON_PATHS[assetType] ?? ASSET_TYPE_ICON_PATHS.DataObject;
}

/**
 * Creates a pill-shaped node with icon and knockout text.
 */
export function createPillNode(
  node: LineageNodeData,
  graphScale: number,
  _ticker: Ticker,
  callbacks: NodeCallbacks,
  options: CreatePillNodeOptions = {}
): PillNode {
  const group = new Container() as PillNode;
  group.label = node.id;

  const nodeScale = options.scale ?? 1;
  const color = getPhaseColorHex(node.phase);
  const dims = getScaledDimensions(nodeScale);

  // Determine render mode based on node type and options
  const isStageNode = node.nodeType === 'stage';

  if (isStageNode) {
    // Stage nodes: use icon-based pill with stage type
    const renderOptions: PillRenderOptions = options.renderOptions ?? {
      mode: 'simple',
      iconPath: ASSET_TYPE_ICON_PATHS.Action,
      typeLabel: node.label,
    };

    const pillHeight = BASE_PILL_HEIGHT_SIMPLE * nodeScale;
    const pillWidth = calculatePillWidth(renderOptions, dims, nodeScale);

    // Load icon and create texture
    loadIcon(renderOptions.iconPath).then((iconImage) => {
      const texture = createPillWithIconTexture(
        renderOptions,
        color,
        pillWidth,
        pillHeight,
        iconImage,
        dims
      );
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      sprite.width = pillWidth;
      sprite.height = pillHeight;
      group.addChild(sprite);
    });

    group.pillWidth = pillWidth;
    group.pillHeight = pillHeight;
  } else if (node.badgeCount !== undefined) {
    // Legacy badge count pills (for backwards compatibility)
    const fontSize = BASE_SIMPLE_TYPE_FONT_SIZE * nodeScale;
    measureCtx.font = `600 ${fontSize}px ${getNodeFontFamily()}`;
    const textWidth = measureCtx.measureText(node.label).width;
    const pillHeight = BASE_PILL_HEIGHT_SIMPLE * nodeScale;
    const badgeRadius = pillHeight * 0.32;
    const rightPadding = BASE_RIGHT_PADDING * nodeScale;
    const pillWidth = textWidth + 56 * nodeScale + badgeRadius * 2 + rightPadding;

    const texture = createKnockoutPillTexture(node.label, color, pillWidth, pillHeight, fontSize, node.badgeCount);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.width = pillWidth;
    sprite.height = pillHeight;
    group.addChild(sprite);

    group.pillWidth = pillWidth;
    group.pillHeight = pillHeight;
  } else {
    // Asset nodes: use icon-based pill with asset type
    const typeLabel = getAssetTypeLabel(node.assetType);
    const iconPath = getIconPath(node.assetType);

    const renderOptions: PillRenderOptions = options.renderOptions ?? {
      mode: 'detailed',
      iconPath,
      typeLabel,
      mainLabel: node.title ?? node.label,
    };

    const pillHeight = (renderOptions.mode === 'detailed' ? BASE_PILL_HEIGHT_DETAILED : BASE_PILL_HEIGHT_SIMPLE) * nodeScale;
    const pillWidth = calculatePillWidth(renderOptions, dims, nodeScale);

    // Create placeholder first, then update with icon
    const placeholderTexture = createPillWithIconTexture(
      renderOptions,
      color,
      pillWidth,
      pillHeight,
      null,
      dims
    );
    const sprite = new Sprite(placeholderTexture);
    sprite.anchor.set(0.5, 0.5);
    sprite.width = pillWidth;
    sprite.height = pillHeight;
    group.addChild(sprite);

    // Load icon and update texture
    loadIcon(renderOptions.iconPath).then((iconImage) => {
      const texture = createPillWithIconTexture(
        renderOptions,
        color,
        pillWidth,
        pillHeight,
        iconImage,
        dims
      );
      sprite.texture = texture;
    });

    group.pillWidth = pillWidth;
    group.pillHeight = pillHeight;
  }

  const x = ((node.x ?? 0.5) - 0.5) * graphScale;
  const y = ((node.y ?? 0.5) - 0.5) * graphScale;
  group.position.set(x, y);

  group.nodeData = node;
  group.baseScale = 1;
  group.alpha = DEFAULT_NODE_ALPHA;

  // Create selection ring with draw animation
  const selectionRing = new Graphics();
  selectionRing.alpha = 0;
  if (options.selectionLayer) {
    selectionRing.position.set(x, y);
    options.selectionLayer.addChild(selectionRing);
  } else {
    group.addChildAt(selectionRing, 0);
  }
  group.selectionRing = selectionRing;

  const ringPadding = 6;
  const ringWidth = group.pillWidth + ringPadding * 2;
  const ringHeight = group.pillHeight + ringPadding * 2;
  const ringRadius = ringHeight / 2;

  function drawSelectionRing(progress: number): void {
    selectionRing.clear();
    if (progress <= 0) return;

    const hw = ringWidth / 2;
    const hh = ringHeight / 2;
    const r = ringRadius;

    // Total perimeter: 2 straight sections + 2 half circles
    const straightLength = ringWidth - ringHeight;
    const curveLength = Math.PI * r;
    const totalLength = 2 * straightLength + 2 * curveLength;
    const drawLength = totalLength * Math.min(progress, 1);

    let remaining = drawLength;
    const halfCurve = curveLength / 2;

    // Left curve upper half: 9 o'clock (π) → 12 o'clock (3π/2)
    // No moveTo - let arc define the start point directly
    if (remaining > 0) {
      const arcLen = Math.min(remaining, halfCurve);
      const arcAngle = (arcLen / halfCurve) * (Math.PI / 2);
      selectionRing.arc(-hw + r, 0, r, Math.PI, Math.PI + arcAngle);
      remaining -= arcLen;
    }

    // Top edge (left to right)
    if (remaining > 0) {
      const segLen = Math.min(remaining, straightLength);
      selectionRing.lineTo(-hw + r + segLen, -hh);
      remaining -= segLen;
    }

    // Right curve: 12 o'clock (-π/2) → 6 o'clock (π/2)
    if (remaining > 0) {
      const arcLen = Math.min(remaining, curveLength);
      const arcAngle = (arcLen / curveLength) * Math.PI;
      selectionRing.arc(hw - r, 0, r, -Math.PI / 2, -Math.PI / 2 + arcAngle);
      remaining -= arcLen;
    }

    // Bottom edge (right to left)
    if (remaining > 0) {
      const segLen = Math.min(remaining, straightLength);
      selectionRing.lineTo(hw - r - segLen, hh);
      remaining -= segLen;
    }

    // Left curve lower half: 6 o'clock (π/2) → 9 o'clock (π)
    if (remaining > 0) {
      const arcLen = Math.min(remaining, halfCurve);
      const arcAngle = (arcLen / halfCurve) * (Math.PI / 2);
      selectionRing.arc(-hw + r, 0, r, Math.PI / 2, Math.PI / 2 + arcAngle);
    }

    selectionRing.stroke({ width: 3, color: getColor('--color-selection-ring'), cap: 'round', join: 'round' });
  }

  group.setSelected = createSelectionAnimator(selectionRing, drawSelectionRing);

  attachNodeInteraction(group, callbacks);

  return group;
}
