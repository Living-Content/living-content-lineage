/**
 * Icon-based node rendering for the lineage graph.
 * Renders circular nodes with SVG icons instead of text labels.
 * Uses texture caching for performance.
 */
import { Container, Sprite, Texture, Ticker } from 'pixi.js';
import { getCssVar } from '../../ui/theme.js';
import type { LineageNodeData, NodeType } from '../../types.js';
import { DEFAULT_NODE_ALPHA, type PillNode } from './nodeRenderer.js';

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

const DEFAULT_ICON_SIZE = 40;

const textureCache = new Map<string, Texture>();
const svgCache = new Map<string, string>();

interface NodeCallbacks {
  onClick: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}

interface CreateIconNodeOptions {
  size?: number;
  iconPath: string;
}

function getNodeColorHex(nodeType: NodeType): string {
  const cssVar = NODE_COLOR_VARS[nodeType];
  if (!cssVar) return NODE_FALLBACK_COLORS[nodeType] ?? '#666666';

  const color = getCssVar(cssVar);
  if (!color) return NODE_FALLBACK_COLORS[nodeType] ?? '#666666';

  return color;
}

function parseColorToRgb(color: string): { r: number; g: number; b: number } {
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return { r: 102, g: 102, b: 102 };
}

async function loadSvgContent(path: string): Promise<string> {
  const cached = svgCache.get(path);
  if (cached) return cached;

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load SVG: ${path}`);
  }
  const content = await response.text();
  svgCache.set(path, content);
  return content;
}

function createIconTexture(
  svgContent: string,
  color: string,
  size: number
): Texture {
  const cacheKey = `${svgContent}-${color}-${size}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const retinaScale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = size * retinaScale;
  canvas.height = size * retinaScale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(retinaScale, retinaScale);

  const rgb = parseColorToRgb(color);
  const coloredSvg = svgContent.replace(
    /fill="currentColor"/g,
    `fill="rgb(${rgb.r}, ${rgb.g}, ${rgb.b})"`
  );

  const blob = new Blob([coloredSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  return new Promise<Texture>((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const texture = Texture.from(canvas);
      textureCache.set(cacheKey, texture);
      resolve(texture);
    };
    img.src = url;
  }) as unknown as Texture;
}

async function createIconTextureAsync(
  svgContent: string,
  color: string,
  size: number
): Promise<Texture> {
  const cacheKey = `${svgContent}-${color}-${size}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const retinaScale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = size * retinaScale;
  canvas.height = size * retinaScale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(retinaScale, retinaScale);

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
}

/**
 * Creates a circular icon node.
 * Returns a PillNode-compatible container with the icon rendered inside.
 */
export async function createIconNode(
  node: LineageNodeData,
  graphScale: number,
  _ticker: Ticker,
  callbacks: NodeCallbacks,
  options: CreateIconNodeOptions
): Promise<PillNode> {
  const group = new Container() as PillNode;
  group.label = node.id;

  const size = options.size ?? DEFAULT_ICON_SIZE;
  const color = getNodeColorHex(node.nodeType);

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
  group.pillWidth = size;
  group.pillHeight = size;
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

/**
 * Preloads SVG icons for faster node creation.
 * Call this during application initialization.
 */
export async function preloadIcons(paths: string[]): Promise<void> {
  await Promise.all(paths.map(loadSvgContent));
}

/**
 * Clears the texture and SVG caches.
 * Call when theme changes to regenerate colored textures.
 */
export function clearIconCache(): void {
  textureCache.forEach((texture) => texture.destroy());
  textureCache.clear();
  svgCache.clear();
}
