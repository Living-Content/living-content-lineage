/**
 * Icon-based node rendering for the lineage graph.
 * Renders circular nodes with SVG icons instead of text labels.
 * Uses texture caching for performance.
 */
import { Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { PHASE_COLORS, getColor } from '../../ui/theme.js';
import type { LineageNodeData, WorkflowPhase } from '../../types.js';
import { DEFAULT_NODE_ALPHA, type PillNode } from './nodeRenderer.js';

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
  selectionLayer?: Container;
}

function getNodeColorHex(phase: WorkflowPhase): string {
  return PHASE_COLORS[phase] ?? '#666666';
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
  const color = node.phase ? getNodeColorHex(node.phase) : '#666666';

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

  const animState = { progress: 0 };

  group.setSelected = (selected: boolean) => {
    gsap.killTweensOf(animState);
    gsap.killTweensOf(selectionRing);

    if (selected) {
      animState.progress = 0;
      selectionRing.clear();
      selectionRing.alpha = 1;

      gsap.to(animState, {
        progress: 1,
        duration: 0.5,
        ease: 'power2.out',
        onUpdate: () => {
          drawSelectionRing(animState.progress);
        },
      });
    } else {
      gsap.to(selectionRing, {
        alpha: 0,
        duration: 0.15,
        ease: 'power2.out',
      });
    }
  };

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
