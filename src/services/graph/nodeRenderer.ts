/**
 * Pill-shaped node rendering with knockout text effect.
 * Text is cut out of the pill to show background through.
 */
import { Container, Sprite, Texture, Ticker } from 'pixi.js';
import { getCssVar } from '../../ui/theme.js';
import type { LineageNodeData, NodeType } from '../../types.js';

const NODE_COLOR_VARS: Record<NodeType, string> = {
  data: '--node-data-color',
  process: '--node-compute-color',
  attestation: '--node-attestation-color',
  filter: '--node-filter-color',
  join: '--node-join-color',
  store: '--node-store-color',
  media: '--node-media-color',
  meta: '--node-meta-color',
};

const NODE_FALLBACK_COLORS: Record<NodeType, string> = {
  data: '#4d96ff',
  process: '#ff6b6b',
  attestation: '#6bcb77',
  filter: '#4d96ff',
  join: '#ffd93d',
  store: '#ffd93d',
  media: '#4d96ff',
  meta: '#4d96ff',
};

export const DEFAULT_NODE_ALPHA = 0.75;

const NODE_FONT_SIZE = 15;
const NODE_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;
measureCtx.font = `600 ${NODE_FONT_SIZE}px ${NODE_FONT_FAMILY}`;

function measureText(text: string, scale = 1): number {
  measureCtx.font = `600 ${NODE_FONT_SIZE * scale}px ${NODE_FONT_FAMILY}`;
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

function createKnockoutPillTexture(
  label: string,
  color: string,
  width: number,
  height: number,
  fontSize: number
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
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.fillText(label, width / 2, height / 2);

  return Texture.from(canvas);
}

interface CreatePillNodeOptions {
  scale?: number;
}

/**
 * Creates a pill-shaped node with knockout text.
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
  const fontSize = NODE_FONT_SIZE * nodeScale;
  const textWidth = measureText(node.label, nodeScale);
  const pillWidth = textWidth + 56 * nodeScale;
  const pillHeight = 40 * nodeScale;

  const texture = createKnockoutPillTexture(node.label, color, pillWidth, pillHeight, fontSize);
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, 0.5);
  sprite.width = pillWidth;
  sprite.height = pillHeight;
  group.addChild(sprite);

  const x = ((node.x ?? 0.5) - 0.5) * graphScale;
  const y = ((node.y ?? 0.5) - 0.5) * graphScale;
  group.position.set(x, y);

  group.nodeData = node;
  group.pillWidth = pillWidth;
  group.pillHeight = pillHeight;
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
