/**
 * Icon-based node rendering for the trace.
 * Renders circular nodes with SVG icons instead of text labels.
 * Uses texture caching for performance.
 */
import { Container, Sprite, Texture, Ticker } from 'pixi.js';
import { getCssVar, getCssVarInt, getCssVarFloat } from '../../../themes/theme.js';
import type { TraceNodeData } from '../../../config/types.js';
import type { GraphNode } from './nodeRenderer.js';
import { attachNodeInteraction, type NodeCallbacks } from '../interaction/nodeInteraction.js';
import { createRetinaCanvas } from './utils.js';

const textureCache = new Map<string, Texture>();
const svgCache = new Map<string, string>();

interface CreateIconNodeOptions {
  size?: number;
  iconPath: string;
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

  const coloredSvg = svgContent.replace(/fill="currentColor"/g, `fill="${color}"`);

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
  node: TraceNodeData,
  graphScale: number,
  ticker: Ticker,
  callbacks: NodeCallbacks,
  options: CreateIconNodeOptions
): Promise<GraphNode> => {
  void ticker;
  const group = new Container() as GraphNode;
  group.label = node.id;

  const size = options.size ?? getCssVarInt('--icon-node-size');
  const color = getCssVar('--claim-icon-color');

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
  group.alpha = getCssVarFloat('--node-alpha');
  group.setSelected = () => {}; // No-op, selection ring removed

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
