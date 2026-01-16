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

const HOVER_SCALE = 1.05;

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;
measureCtx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

function measureText(text: string): number {
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
  height: number
): Texture {
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  const radius = height / 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.fillText(label, width / 2, height / 2);

  return Texture.from(canvas);
}

/**
 * Creates a pill-shaped node with knockout text.
 */
export function createPillNode(
  node: LineageNodeData,
  graphScale: number,
  _ticker: Ticker,
  callbacks: NodeCallbacks
): PillNode {
  const group = new Container() as PillNode;
  group.label = node.id;

  const color = getNodeColorHex(node.nodeType);
  const textWidth = measureText(node.label);
  const pillWidth = textWidth + 56;
  const pillHeight = 40;

  const texture = createKnockoutPillTexture(node.label, color, pillWidth, pillHeight);
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

  group.eventMode = 'static';
  group.cursor = 'pointer';

  group.on('pointerdown', () => {
    callbacks.onClick();
  });

  group.on('pointerenter', () => {
    group.scale.set(HOVER_SCALE);
    callbacks.onHover();
  });

  group.on('pointerleave', () => {
    group.scale.set(1);
    callbacks.onHoverEnd();
  });

  return group;
}
