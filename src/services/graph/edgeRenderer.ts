/**
 * Edge rendering with gradient color from source node to black.
 * Uses color caching for performance.
 */
import { Container, Graphics } from 'pixi.js';
import type { LineageGraph, NodeType } from '../../types.js';
import type { PillNode } from './nodeRenderer.js';
import { getCssVar } from '../../ui/theme.js';
import {
  EDGE_WIDTH,
  EDGE_ARROW_SIZE,
  EDGE_ARROW_GAP,
  EDGE_GRADIENT_STEPS,
} from '../../config/constants.js';

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

const NODE_FALLBACK_COLORS: Record<NodeType, number> = {
  data: 0x4d96ff,
  process: 0xff6b6b,
  attestation: 0x6bcb77,
  filter: 0x4d96ff,
  join: 0xffd93d,
  store: 0xffd93d,
  media: 0x4d96ff,
  meta: 0x4d96ff,
};

let cachedEdgeColor: number | null = null;
const cachedNodeColors = new Map<NodeType, number>();

function parseColor(colorString: string): number {
  if (!colorString) return 0x666666;
  const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return (r << 16) | (g << 8) | b;
  }
  if (colorString.startsWith('#')) {
    return parseInt(colorString.slice(1), 16);
  }
  return 0x666666;
}

function getEdgeColorCached(): number {
  if (cachedEdgeColor === null) {
    const color = getCssVar('--color-edge');
    cachedEdgeColor = color ? parseColor(color) : 0x1a1a1a;
  }
  return cachedEdgeColor;
}

function getNodeColorCached(nodeType: NodeType): number {
  let color = cachedNodeColors.get(nodeType);
  if (color === undefined) {
    const cssVar = NODE_COLOR_VARS[nodeType];
    if (!cssVar) {
      color = NODE_FALLBACK_COLORS[nodeType] ?? 0x666666;
    } else {
      const cssColor = getCssVar(cssVar);
      color = cssColor ? parseColor(cssColor) : (NODE_FALLBACK_COLORS[nodeType] ?? 0x666666);
    }
    cachedNodeColors.set(nodeType, color);
  }
  return color;
}

/**
 * Invalidate color cache when theme changes.
 */
export function invalidateColorCache(): void {
  cachedEdgeColor = null;
  cachedNodeColors.clear();
}

export function getNodeColor(nodeType: NodeType): number {
  return getNodeColorCached(nodeType);
}

function lerpColor(color1: number, color2: number, t: number): number {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;
  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}

/**
 * Render edges with gradient colors.
 * Only renders edges where at least one endpoint node is visible (not culled).
 */
export function renderEdges(
  edgeLayer: Container,
  edges: LineageGraph['edges'],
  nodeMap: Map<string, PillNode>
): void {
  edgeLayer.removeChildren();
  const graphics = new Graphics();
  const edgeEndColor = getEdgeColorCached();

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    // Skip edges where both endpoints are culled (off-screen)
    if (sourceNode.culled && targetNode.culled) continue;

    const sx = sourceNode.position.x;
    const sy = sourceNode.position.y;
    const tx = targetNode.position.x;
    const ty = targetNode.position.y;

    const sourceHalfW = sourceNode.pillWidth / 2;
    const sourceHalfH = sourceNode.pillHeight / 2;
    const targetHalfW = targetNode.pillWidth / 2;
    const targetHalfH = targetNode.pillHeight / 2;

    const sourceColor = getNodeColorCached(sourceNode.nodeData.nodeType);
    const dx = tx - sx;
    const dy = ty - sy;
    const isMainlyHorizontal = Math.abs(dx) > Math.abs(dy);

    if (isMainlyHorizontal) {
      renderHorizontalEdge(
        graphics,
        sx, sy, tx, ty,
        sourceHalfW, targetHalfW,
        sourceColor,
        edgeEndColor
      );
    } else {
      renderVerticalEdge(
        graphics,
        sx, sy, tx, ty,
        sourceHalfH, targetHalfH,
        sourceColor,
        edgeEndColor
      );
    }
  }

  edgeLayer.addChild(graphics);
}

function renderHorizontalEdge(
  graphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfW: number, targetHalfW: number,
  sourceColor: number,
  endColor: number
): void {
  const goingRight = tx > sx;
  const lineStartX = goingRight ? sx + sourceHalfW : sx - sourceHalfW;
  const lineEndX = goingRight ? tx - targetHalfW - EDGE_ARROW_GAP : tx + targetHalfW + EDGE_ARROW_GAP;

  for (let i = 0; i < EDGE_GRADIENT_STEPS; i++) {
    const t1 = i / EDGE_GRADIENT_STEPS;
    const t2 = (i + 1) / EDGE_GRADIENT_STEPS;
    const x1 = lineStartX + (lineEndX - lineStartX) * t1;
    const y1 = sy + (ty - sy) * t1;
    const x2 = lineStartX + (lineEndX - lineStartX) * t2;
    const y2 = sy + (ty - sy) * t2;
    const color = lerpColor(sourceColor, endColor, t1);

    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
    graphics.stroke({ width: EDGE_WIDTH, color });
  }

  if (goingRight) {
    graphics.moveTo(lineEndX - EDGE_ARROW_SIZE, ty - EDGE_ARROW_SIZE / 2);
    graphics.lineTo(lineEndX, ty);
    graphics.lineTo(lineEndX - EDGE_ARROW_SIZE, ty + EDGE_ARROW_SIZE / 2);
  } else {
    graphics.moveTo(lineEndX + EDGE_ARROW_SIZE, ty - EDGE_ARROW_SIZE / 2);
    graphics.lineTo(lineEndX, ty);
    graphics.lineTo(lineEndX + EDGE_ARROW_SIZE, ty + EDGE_ARROW_SIZE / 2);
  }
  graphics.stroke({ width: EDGE_WIDTH, color: endColor });
}

function renderVerticalEdge(
  graphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfH: number, targetHalfH: number,
  sourceColor: number,
  endColor: number
): void {
  const goingDown = ty > sy;
  const startY = goingDown ? sy + sourceHalfH : sy - sourceHalfH;
  const endY = goingDown ? ty - targetHalfH : ty + targetHalfH;

  for (let i = 0; i < EDGE_GRADIENT_STEPS; i++) {
    const t1 = i / EDGE_GRADIENT_STEPS;
    const t2 = (i + 1) / EDGE_GRADIENT_STEPS;
    const x1 = sx + (tx - sx) * t1;
    const y1 = startY + (endY - startY) * t1;
    const x2 = sx + (tx - sx) * t2;
    const y2 = startY + (endY - startY) * t2;
    const color = lerpColor(sourceColor, endColor, t1);

    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
    graphics.stroke({ width: EDGE_WIDTH, color });
  }
}
