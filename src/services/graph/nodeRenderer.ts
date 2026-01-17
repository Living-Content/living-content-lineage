/**
 * Pill-shaped node rendering with icon circle and knockout text effect.
 * Shows asset type icon on left, with type label and optional main label.
 */
import { Container, Sprite, Texture, Ticker } from 'pixi.js';
import { getCssVar, ASSET_TYPE_ICON_PATHS, PHASE_ICON_PATHS } from '../../ui/theme.js';
import type { AssetType, LineageNodeData, NodeType, WorkflowPhase } from '../../types.js';
import { ASSET_TYPE_LABELS } from '../labels.js';

const NODE_COLOR_VARS: Record<NodeType, string> = {
  data: '--node-data-color',
  process: '--node-compute-color',
  attestation: '--node-attestation-color',
  store: '--node-store-color',
  media: '--node-media-color',
  stage: '--node-stage-color',
};

const NODE_FALLBACK_COLORS: Record<NodeType, string> = {
  data: '#4d96ff',
  process: '#ff6b6b',
  attestation: '#6bcb77',
  store: '#ffd93d',
  media: '#4d96ff',
  stage: '#4d96ff',
};

export const DEFAULT_NODE_ALPHA = 0.75;

const NODE_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

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
  measureCtx.font = `${fontWeight} ${fontSize}px ${NODE_FONT_FAMILY}`;
  return measureCtx.measureText(text).width;
}

function getNodeColorHex(nodeType: NodeType): string {
  const cssVar = NODE_COLOR_VARS[nodeType];
  if (!cssVar) return NODE_FALLBACK_COLORS[nodeType] ?? '#666666';

  const color = getCssVar(cssVar);
  if (!color) return NODE_FALLBACK_COLORS[nodeType] ?? '#666666';

  return color;
}

export interface PillNode extends Container {
  nodeData: LineageNodeData;
  pillWidth: number;
  pillHeight: number;
  baseScale: number;
}

interface NodeCallbacks {
  onClick: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
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
  const retinaScale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * retinaScale;
  canvas.height = height * retinaScale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(retinaScale, retinaScale);

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

  // Knockout text
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (options.mode === 'detailed' && options.mainLabel) {
    // Two-line layout: type label (small) + main label (normal)
    const lineSpacing = height * 0.18;
    const typeY = height / 2 - lineSpacing;
    const mainY = height / 2 + lineSpacing;

    // Type label (uppercase, smaller)
    ctx.font = `600 ${dims.typeLabelFontSize}px ${NODE_FONT_FAMILY}`;
    ctx.fillText(options.typeLabel, textStartX, typeY);

    // Main label (normal size)
    ctx.font = `600 ${dims.mainLabelFontSize}px ${NODE_FONT_FAMILY}`;
    ctx.fillText(options.mainLabel, textStartX, mainY);
  } else {
    // Single-line layout: just type label (centered vertically)
    ctx.font = `600 ${dims.simpleTypeFontSize}px ${NODE_FONT_FAMILY}`;
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
  const retinaScale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * retinaScale;
  canvas.height = height * retinaScale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(retinaScale, retinaScale);

  const radius = height / 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.font = `600 ${fontSize}px ${NODE_FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';

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
    ctx.font = `600 ${badgeFontSize}px ${NODE_FONT_FAMILY}`;
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
  const color = getNodeColorHex(node.nodeType);
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
    measureCtx.font = `600 ${fontSize}px ${NODE_FONT_FAMILY}`;
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
      mainLabel: node.label,
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

  group.eventMode = 'static';
  group.cursor = 'pointer';
  group.cullable = true;

  group.on('pointerdown', () => {
    callbacks.onClick();
  });

  group.on('pointerenter', () => {
    callbacks.onHover();
  });

  group.on('pointerleave', () => {
    callbacks.onHoverEnd();
  });

  return group;
}
