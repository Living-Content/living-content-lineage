/**
 * Edge rendering with solid colors matching source node phase.
 * Edges have dots at both ends that sit on the edge of nodes.
 * Lines render behind nodes, dots render in front.
 */
import { Container, Graphics } from 'pixi.js';
import type { LineageGraph, WorkflowPhase } from '../../types.js';
import type { PillNode } from './nodeRenderer.js';
import { PHASE_COLORS } from '../../ui/theme.js';
import {
  EDGE_WIDTH,
  EDGE_DOT_RADIUS,
  FADED_NODE_ALPHA,
} from '../../config/constants.js';

const cachedPhaseColors = new Map<WorkflowPhase, number>();

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

function getPhaseColorCached(phase: WorkflowPhase): number {
  let color = cachedPhaseColors.get(phase);
  if (color === undefined) {
    const hexColor = PHASE_COLORS[phase];
    color = hexColor ? parseColor(hexColor) : 0x666666;
    cachedPhaseColors.set(phase, color);
  }
  return color;
}

/**
 * Invalidate color cache when theme changes.
 */
export function invalidateColorCache(): void {
  cachedPhaseColors.clear();
}

function drawDot(graphics: Graphics, x: number, y: number, color: number): void {
  graphics.circle(x, y, EDGE_DOT_RADIUS);
  graphics.fill({ color });
  graphics.circle(x, y, EDGE_DOT_RADIUS);
  graphics.stroke({ width: 1, color: 0x000000 });
}

/**
 * Render edges with solid colors matching source node.
 * Lines go in edgeLayer (behind nodes), dots go in dotLayer (in front).
 */
export function renderEdges(
  edgeLayer: Container,
  dotLayer: Container,
  edges: LineageGraph['edges'],
  nodeMap: Map<string, PillNode>,
  selectedNodeId: string | null = null,
  highlightedNodeIds: Set<string> | null = null
): void {
  edgeLayer.removeChildren();
  dotLayer.removeChildren();

  const lineGraphics = new Graphics();
  const fadedLineGraphics = new Graphics();
  const dotGraphics = new Graphics();
  const fadedDotGraphics = new Graphics();

  const allHighlighted = highlightedNodeIds
    ? new Set([selectedNodeId!, ...highlightedNodeIds])
    : null;

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    if (sourceNode.culled && targetNode.culled) continue;

    const isHighlighted = selectedNodeId === null ||
      (allHighlighted !== null &&
        allHighlighted.has(edge.source) &&
        allHighlighted.has(edge.target));

    const targetLineGraphics = isHighlighted ? lineGraphics : fadedLineGraphics;
    const targetDotGraphics = isHighlighted ? dotGraphics : fadedDotGraphics;

    const sx = sourceNode.position.x;
    const sy = sourceNode.position.y;
    const tx = targetNode.position.x;
    const ty = targetNode.position.y;

    const sourceHalfW = sourceNode.pillWidth / 2;
    const sourceHalfH = sourceNode.pillHeight / 2;
    const targetHalfW = targetNode.pillWidth / 2;
    const targetHalfH = targetNode.pillHeight / 2;

    const sourcePhase = sourceNode.nodeData.phase;
    const color = sourcePhase ? getPhaseColorCached(sourcePhase) : 0x666666;

    const dx = tx - sx;
    const dy = ty - sy;
    const isMainlyHorizontal = Math.abs(dx) > Math.abs(dy);

    if (isMainlyHorizontal) {
      renderHorizontalEdge(
        targetLineGraphics,
        targetDotGraphics,
        sx, sy, tx, ty,
        sourceHalfW, targetHalfW,
        color
      );
    } else {
      renderVerticalEdge(
        targetLineGraphics,
        targetDotGraphics,
        sx, sy, tx, ty,
        sourceHalfH, targetHalfH,
        color
      );
    }
  }

  fadedLineGraphics.alpha = FADED_NODE_ALPHA;
  fadedDotGraphics.alpha = FADED_NODE_ALPHA;

  edgeLayer.addChild(fadedLineGraphics);
  edgeLayer.addChild(lineGraphics);
  dotLayer.addChild(fadedDotGraphics);
  dotLayer.addChild(dotGraphics);
}

function renderHorizontalEdge(
  lineGraphics: Graphics,
  dotGraphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfW: number, targetHalfW: number,
  color: number
): void {
  const goingRight = tx > sx;
  const startX = goingRight ? sx + sourceHalfW : sx - sourceHalfW;
  const endX = goingRight ? tx - targetHalfW : tx + targetHalfW;

  lineGraphics.moveTo(startX, sy);
  lineGraphics.lineTo(endX, ty);
  lineGraphics.stroke({ width: EDGE_WIDTH, color });

  drawDot(dotGraphics, startX, sy, color);
  drawDot(dotGraphics, endX, ty, color);
}

function renderVerticalEdge(
  lineGraphics: Graphics,
  dotGraphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfH: number, targetHalfH: number,
  color: number
): void {
  const goingDown = ty > sy;
  const startY = goingDown ? sy + sourceHalfH : sy - sourceHalfH;
  const endY = goingDown ? ty - targetHalfH : ty + targetHalfH;

  lineGraphics.moveTo(sx, startY);
  lineGraphics.lineTo(tx, endY);
  lineGraphics.stroke({ width: EDGE_WIDTH, color });

  drawDot(dotGraphics, sx, startY, color);
  drawDot(dotGraphics, tx, endY, color);
}
