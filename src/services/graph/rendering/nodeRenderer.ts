/**
 * Rounded rectangle node rendering with icon circle and knockout text effect.
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
  BASE_NODE_HEIGHT_DETAILED,
  BASE_NODE_HEIGHT_SIMPLE,
  calculateNodeWidth,
  getScaledDimensions,
} from './nodeTextMeasurement.js';
import { createNodeTexture } from './nodeTextureRenderer.js';

export const DEFAULT_NODE_ALPHA = 1;

export interface GraphNode extends Container {
  nodeData: LineageNodeData;
  nodeWidth: number;
  nodeHeight: number;
  baseScale: number;
  setSelected: (selected: boolean) => void;
  selectionRing?: Graphics;
}

export type NodeViewMode = 'simple' | 'detailed';

export interface NodeRenderOptions {
  mode: NodeViewMode;
  iconPath: string;
  typeLabel: string;
  mainLabel?: string;
}

interface CreateNodeOptions {
  scale?: number;
  renderOptions?: NodeRenderOptions;
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
 * Creates a graph node with icon and knockout text.
 */
export function createGraphNode(
  node: LineageNodeData,
  graphScale: number,
  ticker: Ticker,
  callbacks: NodeCallbacks,
  options: CreateNodeOptions = {}
): GraphNode {
  void ticker;
  const group = new Container() as GraphNode;
  group.label = node.id;

  const nodeScale = options.scale ?? 1;
  const color = getPhaseColorHex(node.phase);
  const dims = getScaledDimensions(nodeScale);

  // Determine render mode based on node type and options
  const isWorkflowNode = node.nodeType === 'workflow';

  if (isWorkflowNode) {
    // Workflow nodes: use icon-based node with workflow type
    const renderOptions: NodeRenderOptions = options.renderOptions ?? {
      mode: 'simple',
      iconPath: ASSET_TYPE_ICON_PATHS.Action,
      typeLabel: node.label,
    };

    const nodeHeight = BASE_NODE_HEIGHT_SIMPLE * nodeScale;
    const nodeWidth = calculateNodeWidth(renderOptions, dims, nodeScale);

    // Load icon and create texture
    loadIcon(renderOptions.iconPath).then((iconImage) => {
      const texture = createNodeTexture(
        renderOptions,
        color,
        nodeWidth,
        nodeHeight,
        iconImage,
        dims
      );
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      sprite.width = nodeWidth;
      sprite.height = nodeHeight;
      group.addChild(sprite);
    });

    group.nodeWidth = nodeWidth;
    group.nodeHeight = nodeHeight;
  } else {
    // Asset nodes: use icon-based node with asset type
    const typeLabel = getAssetTypeLabel(node.assetType);
    const iconPath = getIconPath(node.assetType);

    const renderOptions: NodeRenderOptions = options.renderOptions ?? {
      mode: 'detailed',
      iconPath,
      typeLabel,
      mainLabel: node.title ?? node.label,
    };

    const nodeHeight = (renderOptions.mode === 'detailed' ? BASE_NODE_HEIGHT_DETAILED : BASE_NODE_HEIGHT_SIMPLE) * nodeScale;
    const nodeWidth = calculateNodeWidth(renderOptions, dims, nodeScale);

    // Create placeholder first, then update with icon
    const placeholderTexture = createNodeTexture(
      renderOptions,
      color,
      nodeWidth,
      nodeHeight,
      null,
      dims
    );
    const sprite = new Sprite(placeholderTexture);
    sprite.anchor.set(0.5, 0.5);
    sprite.width = nodeWidth;
    sprite.height = nodeHeight;
    group.addChild(sprite);

    // Load icon and update texture
    loadIcon(renderOptions.iconPath).then((iconImage) => {
      const texture = createNodeTexture(
        renderOptions,
        color,
        nodeWidth,
        nodeHeight,
        iconImage,
        dims
      );
      sprite.texture = texture;
    });

    group.nodeWidth = nodeWidth;
    group.nodeHeight = nodeHeight;
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
  const ringWidth = group.nodeWidth + ringPadding * 2;
  const ringHeight = group.nodeHeight + ringPadding * 2;
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
