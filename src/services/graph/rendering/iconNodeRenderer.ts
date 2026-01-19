/**
 * Icon-based node rendering for the lineage graph.
 * Renders circular nodes with SVG icons instead of text labels.
 * Uses texture caching for performance.
 */
import { Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { getColor, getPhaseColorHex, parseColorToRgb } from '../../../theme/theme.js';
import type { LineageNodeData } from '../../../config/types.js';
import { DEFAULT_NODE_ALPHA, type GraphNode } from './nodeRenderer.js';
import { attachNodeInteraction, createSelectionAnimator, type NodeCallbacks } from '../interaction/nodeInteraction.js';
import { createRetinaCanvas } from './rendererUtils.js';

const DEFAULT_ICON_SIZE = 40;

const textureCache = new Map<string, Texture>();
const svgCache = new Map<string, string>();

interface CreateIconNodeOptions {
  size?: number;
  iconPath: string;
  selectionLayer?: Container;
}

const loadSvgContent = async (path: string): Promise<string> => {
  const cached = svgCache.get(path);
  if (cached) return cached;

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load SVG: ${path}`);
  }
  const content = await response.text();
  svgCache.set(path, content);
  return content;
};

const createIconTextureAsync = async (
  svgContent: string,
  color: string,
  size: number
): Promise<Texture> => {
  const cacheKey = `${svgContent}-${color}-${size}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const { canvas, ctx } = createRetinaCanvas(size, size);

  const rgb = parseColorToRgb(color);
  const coloredSvg = svgContent.replace(
    /fill="currentColor"/g,
    `fill="rgb(${rgb.r}, ${rgb.g}, ${rgb.b})"`
  );

  const blob = new Blob([coloredSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  return new Promise<Texture>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const texture = Texture.from(canvas);
      textureCache.set(cacheKey, texture);
      resolve(texture);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };
    img.src = url;
  });
};

/**
 * Creates a circular icon node.
 * Returns a GraphNode-compatible container with the icon rendered inside.
 */
export const createIconNode = async (
  node: LineageNodeData,
  graphScale: number,
  _ticker: Ticker,
  callbacks: NodeCallbacks,
  options: CreateIconNodeOptions
): Promise<GraphNode> => {
  const group = new Container() as GraphNode;
  group.label = node.id;

  const size = options.size ?? DEFAULT_ICON_SIZE;
  const color = getPhaseColorHex(node.phase);

  const svgContent = await loadSvgContent(options.iconPath);
  const texture = await createIconTextureAsync(svgContent, color, size);

  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, 0.5);
  sprite.width = size;
  sprite.height = size;
  group.addChild(sprite);

  const x = ((node.x ?? 0.5) - 0.5) * graphScale;
  const y = ((node.y ?? 0.5) - 0.5) * graphScale;
  group.position.set(x, y);

  group.nodeData = node;
  group.nodeWidth = size;
  group.nodeHeight = size;
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
  const ringRadius = (size + ringPadding * 2) / 2;

  function drawSelectionRing(progress: number): void {
    selectionRing.clear();
    if (progress <= 0) return;

    // Draw circle arc progressively
    const endAngle = -Math.PI / 2 + (2 * Math.PI * Math.min(progress, 1));
    selectionRing.arc(0, 0, ringRadius, -Math.PI / 2, endAngle);
    selectionRing.stroke({ width: 3, color: getColor('--color-selection-ring'), cap: 'round' });
  }

  group.setSelected = createSelectionAnimator(selectionRing, drawSelectionRing);

  attachNodeInteraction(group, callbacks);

  return group;
};

/**
 * Preloads SVG icons for faster node creation.
 * Call this during application initialization.
 */
export const preloadIcons = async (paths: string[]): Promise<void> => {
  await Promise.all(paths.map(loadSvgContent));
};

/**
 * Clears the texture and SVG caches.
 * Call when theme changes to regenerate colored textures.
 */
export const clearIconCache = (): void => {
  textureCache.forEach((texture) => texture.destroy());
  textureCache.clear();
  svgCache.clear();
};
