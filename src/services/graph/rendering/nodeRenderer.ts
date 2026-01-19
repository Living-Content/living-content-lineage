/**
 * Pill-shaped node rendering with icon circle and knockout text effect.
 * Shows asset type icon on left, with type label and optional main label.
 */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import { ASSET_TYPE_ICON_PATHS, getColor, getPhaseColorHex } from '../../../theme/theme.js';
import type { AssetType, LineageNodeData } from '../../../config/types.js';
import { ASSET_TYPE_LABELS } from '../../../config/labels.js';
import { GEOMETRY } from '../../../config/animationConstants.js';
import { attachNodeInteraction, createSelectionAnimator, type NodeCallbacks } from '../interaction/nodeInteraction.js';
import { loadIcon } from '../interaction/iconLoader.js';
import {
  BASE_PILL_HEIGHT_DETAILED,
  BASE_PILL_HEIGHT_SIMPLE,
  BASE_RIGHT_PADDING,
  BASE_SIMPLE_TYPE_FONT_SIZE,
  calculatePillWidth,
  getNodeFontFamily,
  getScaledDimensions,
  measureCtx,
} from './pillTextMeasurement.js';
import { createPillWithIconTexture, createKnockoutPillTexture } from './pillTextureRenderer.js';

export const DEFAULT_NODE_ALPHA = 1;

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

interface CreatePillNodeOptions {
  scale?: number;
  renderOptions?: PillRenderOptions;
  selectionLayer?: Container;
}

const getAssetTypeLabel = (assetType?: AssetType): string => {
  if (!assetType) return 'DATA';
  return (ASSET_TYPE_LABELS[assetType] ?? assetType).toUpperCase();
};

const getIconPath = (assetType?: AssetType): string => {
  if (!assetType) return ASSET_TYPE_ICON_PATHS.DataObject;
  return ASSET_TYPE_ICON_PATHS[assetType] ?? ASSET_TYPE_ICON_PATHS.DataObject;
};

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
    const badgeRadius = pillHeight * GEOMETRY.BADGE_RADIUS_FACTOR;
    const rightPadding = BASE_RIGHT_PADDING * nodeScale;
    const pillWidth = textWidth + GEOMETRY.BADGE_WIDTH_PADDING * nodeScale + badgeRadius * 2 + rightPadding;

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

  const ringPadding = GEOMETRY.SELECTION_RING_PADDING;
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

    selectionRing.stroke({ width: GEOMETRY.SELECTION_RING_STROKE_WIDTH, color: getColor('--color-selection-ring'), cap: 'round', join: 'round' });
  }

  group.setSelected = createSelectionAnimator(selectionRing, drawSelectionRing);

  attachNodeInteraction(group, callbacks);

  return group;
}
