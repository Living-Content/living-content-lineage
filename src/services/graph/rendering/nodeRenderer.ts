/**
 * Rectangle node rendering with icon and text labels.
 * Shows asset type icon on left, with type label and optional main label.
 */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { getCssVar, getCssVarFloat, type CssVar } from '../../../themes/index.js';
import { getAssetIconPath } from '../../../config/icons.js';
import type { AssetType, TraceNodeData } from '../../../config/types.js';
import { ASSET_TYPE_LABELS } from '../../../config/labels.js';
import { ANIMATION_TIMINGS, GEOMETRY } from '../../../config/animationConstants.js';
import { GROUP_KEY_PRECISION } from '../../../config/constants.js';
import { attachNodeInteraction, type NodeCallbacks } from '../interaction/nodeInteraction.js';
import { loadIcon } from '../interaction/iconLoader.js';
import {
  BASE_NODE_HEIGHT_DETAILED,
  BASE_NODE_HEIGHT_SIMPLE,
  calculateNodeWidth,
  getScaledDimensions,
} from './nodeTextMeasurement.js';
import { createNodeTexture, createIconOnlyTexture } from './nodeTextureRenderer.js';
import { traceState } from '../../../stores/traceState.svelte.js';


export interface GraphNode extends Container {
  nodeData: TraceNodeData;
  nodeWidth: number;
  nodeHeight: number;
  baseScale: number;
  setSelected: (selected: boolean) => void;
  highlightBar?: Graphics;
  highlightColor?: string;
  updateMode?: (mode: NodeViewMode) => void;
  currentMode?: NodeViewMode;
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
}

const getAssetTypeLabel = (assetType?: AssetType): string => {
  if (!assetType) return 'DATA';
  return (ASSET_TYPE_LABELS[assetType] ?? assetType).toUpperCase();
};

const getIconPath = (assetType?: AssetType): string => {
  return getAssetIconPath(assetType ?? 'Data');
};

/**
 * Creates a graph node with icon and text.
 */
export function createGraphNode(
  node: TraceNodeData,
  graphScale: number,
  ticker: Ticker,
  callbacks: NodeCallbacks,
  options: CreateNodeOptions = {}
): GraphNode {
  void ticker;
  const group = new Container() as GraphNode;
  group.label = node.id;

  const nodeScale = options.scale ?? 1;
  const color = getCssVar(`--phase-${node.phase.toLowerCase()}` as CssVar);
  const dims = getScaledDimensions(nodeScale);

  // Determine render mode based on node type and options
  const isWorkflowNode = node.nodeType === 'workflow';

  if (isWorkflowNode) {
    // Workflow nodes: use icon-based node with workflow type
    const renderOptions: NodeRenderOptions = options.renderOptions ?? {
      mode: 'simple',
      iconPath: getAssetIconPath('Action'),
      typeLabel: node.label,
    };

    const nodeHeight = BASE_NODE_HEIGHT_SIMPLE * nodeScale;
    const nodeWidth = calculateNodeWidth(renderOptions, dims, nodeScale);

    // Add highlight bar (must be sync for hover animation)
    const highlightBar = new Graphics();
    const barX = -nodeWidth / 2;
    const barY = -nodeHeight / 2;
    highlightBar.roundRect(barX, barY, GEOMETRY.HIGHLIGHT_BAR_WIDTH * nodeScale, nodeHeight, GEOMETRY.NODE_BORDER_RADIUS * nodeScale);
    highlightBar.fill(color);
    group.addChild(highlightBar);
    group.highlightBar = highlightBar;
    group.highlightColor = color;

    // Load icon and create texture
    loadIcon(renderOptions.iconPath).then((iconImage) => {
      const texture = createNodeTexture(
        renderOptions,
        color,
        nodeWidth,
        nodeHeight,
        iconImage,
        dims,
        nodeScale
      );
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      sprite.width = nodeWidth;
      sprite.height = nodeHeight;
      group.addChild(sprite);

      // Move highlight bar to top after adding sprite
      group.setChildIndex(highlightBar, group.children.length - 1);
    });

    group.nodeWidth = nodeWidth;
    group.nodeHeight = nodeHeight;
  } else if (node.assetType === 'Action') {
    // Action nodes: icon-only connector (just the icon, no shape behind it)
    const iconPath = getIconPath(node.assetType);
    const iconSize = BASE_NODE_HEIGHT_DETAILED * nodeScale;

    loadIcon(iconPath).then((iconImage) => {
      const texture = createIconOnlyTexture(iconImage, color, iconSize);
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      sprite.width = iconSize;
      sprite.height = iconSize;
      group.addChild(sprite);
    });

    group.nodeWidth = iconSize;
    group.nodeHeight = iconSize;
  } else {
    // Asset nodes: rectangle with watermark icon drawn into texture, text labels
    const typeLabel = getAssetTypeLabel(node.assetType);
    const iconPath = getIconPath(node.assetType);
    const mainLabel = node.title ?? node.label;

    // Track current mode and loaded icon for mode switching
    let currentMode: NodeViewMode = options.renderOptions?.mode ?? 'detailed';
    let loadedIcon: HTMLImageElement | null = null;
    let currentSprite: Sprite | null = null;
    let isTransitioning = false;

    const createRenderOptions = (mode: NodeViewMode): NodeRenderOptions => ({
      mode,
      iconPath,
      // In simple mode (zoomed out), show the asset label instead of asset type
      typeLabel: mode === 'simple' ? mainLabel : typeLabel,
      mainLabel: mode === 'detailed' ? mainLabel : undefined,
    });

    const renderOptions = createRenderOptions(currentMode);
    const nodeHeight = (currentMode === 'detailed' ? BASE_NODE_HEIGHT_DETAILED : BASE_NODE_HEIGHT_SIMPLE) * nodeScale;
    // Use shared width from store so all nodes in same group have same width
    const groupKey = Math.round((node.x ?? 0.5) * GROUP_KEY_PRECISION);
    const groupWidth = traceState.getNodeWidth(groupKey);
    const nodeWidth = (groupWidth ?? calculateNodeWidth(renderOptions, dims, nodeScale)) * nodeScale;

    // Create placeholder first, then update with icon
    const placeholderTexture = createNodeTexture(
      renderOptions,
      color,
      nodeWidth,
      nodeHeight,
      null,
      dims,
      nodeScale
    );
    const sprite = new Sprite(placeholderTexture);
    sprite.anchor.set(0.5, 0.5);
    sprite.width = nodeWidth;
    sprite.height = nodeHeight;
    group.addChild(sprite);
    currentSprite = sprite;

    // Load icon and update texture (watermark icon is drawn into the texture)
    loadIcon(renderOptions.iconPath).then((iconImage) => {
      loadedIcon = iconImage;

      const texture = createNodeTexture(
        renderOptions,
        color,
        nodeWidth,
        nodeHeight,
        iconImage,
        dims,
        nodeScale
      );
      sprite.texture = texture;
    });

    group.nodeWidth = nodeWidth;
    group.nodeHeight = nodeHeight;
    group.currentMode = currentMode;

    // Add highlight bar graphics layer for hover animation
    const highlightBar = new Graphics();
    const barX = -nodeWidth / 2;
    const barY = -nodeHeight / 2;
    highlightBar.rect(barX, barY, GEOMETRY.HIGHLIGHT_BAR_WIDTH * nodeScale, nodeHeight);
    highlightBar.fill(color);
    group.addChild(highlightBar);
    group.highlightBar = highlightBar;
    group.highlightColor = color;

    // Store original dimensions (keep width constant across mode changes)
    const originalWidth = nodeWidth;
    const originalHeight = nodeHeight;

    // Mode switching with crossfade animation (keeps same width)
    group.updateMode = (newMode: NodeViewMode): void => {
      if (newMode === currentMode || isTransitioning) return;
      isTransitioning = true;

      const newRenderOptions = createRenderOptions(newMode);
      const newDims = getScaledDimensions(nodeScale);

      const newTexture = createNodeTexture(
        newRenderOptions,
        color,
        originalWidth,
        originalHeight,
        loadedIcon,
        newDims,
        nodeScale
      );

      const newSprite = new Sprite(newTexture);
      newSprite.anchor.set(0.5, 0.5);
      newSprite.width = originalWidth;
      newSprite.height = originalHeight;
      newSprite.alpha = 0;
      group.addChild(newSprite);

      // Ensure highlight bar stays on top after adding new sprite
      if (group.highlightBar) {
        group.setChildIndex(group.highlightBar, group.children.length - 1);
      }

      const oldSprite = currentSprite;

      gsap.to(newSprite, {
        alpha: 1,
        duration: ANIMATION_TIMINGS.NODE_CROSSFADE_IN_DURATION,
        ease: 'power2.out',
      });

      gsap.to(oldSprite, {
        alpha: 0,
        duration: ANIMATION_TIMINGS.NODE_CROSSFADE_OUT_DURATION,
        ease: 'power2.in',
        onComplete: () => {
          if (oldSprite) {
            group.removeChild(oldSprite);
            oldSprite.destroy();
          }
          currentSprite = newSprite;
          currentMode = newMode;
          group.currentMode = newMode;
          isTransitioning = false;
        },
      });
    };
  }

  const x = ((node.x ?? 0.5) - 0.5) * graphScale;
  const y = ((node.y ?? 0.5) - 0.5) * graphScale;
  group.position.set(x, y);

  group.nodeData = node;
  group.baseScale = nodeScale;
  group.alpha = getCssVarFloat('--node-alpha');
  group.setSelected = () => {}; // No-op, selection ring removed

  // Action nodes are pure connectors - not selectable, no hover cursor
  const isActionNode = node.assetType === 'Action';
  if (!isActionNode) {
    attachNodeInteraction(group, callbacks);
  } else {
    group.eventMode = 'static';
    group.cursor = 'default';
    group.cullable = true;
  }

  return group;
}
