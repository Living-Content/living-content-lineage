/**
 * Edge rendering with solid colors matching source node phase.
 * Edges have dots at both ends that sit on the edge of nodes.
 * Lines render behind nodes, dots render in front.
 */
import { Container, Graphics } from 'pixi.js';
import type { LineageGraph } from '../../../config/types.js';
import type { PillNode } from './nodeRenderer.js';
import { getColor } from '../../../theme/theme.js';
import {
  EDGE_WIDTH,
  EDGE_DOT_RADIUS,
  FADED_NODE_ALPHA,
} from '../../../config/constants.js';
import { drawDot } from './rendererUtils.js';

/**
 * Render edges with solid colors matching source node.
 * Lines go in edgeLayer (behind nodes), dots go in dotLayer (in front).
 */
export const renderEdges = (
  edgeLayer: Container,
  dotLayer: Container,
  edges: LineageGraph['edges'],
  nodeMap: Map<string, PillNode>,
  selectedNodeId: string | null = null,
  highlightedNodeIds: Set<string> | null = null
): void => {
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

    // Use node's actual dimensions (in graph space)
    const sourceHalfW = sourceNode.pillWidth / 2;
    const sourceHalfH = sourceNode.pillHeight / 2;
    const targetHalfW = targetNode.pillWidth / 2;
    const targetHalfH = targetNode.pillHeight / 2;

    const sourcePhase = sourceNode.nodeData.phase;
    const color = sourcePhase
      ? getColor(`--phase-${sourcePhase.toLowerCase()}`)
      : getColor('--color-edge-default');

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
};

const renderHorizontalEdge = (
  lineGraphics: Graphics,
  dotGraphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfW: number, targetHalfW: number,
  color: number
): void => {
  const goingRight = tx > sx;
  const startX = goingRight ? sx + sourceHalfW : sx - sourceHalfW;
  const endX = goingRight ? tx - targetHalfW : tx + targetHalfW;

  lineGraphics.moveTo(startX, sy);
  lineGraphics.lineTo(endX, ty);
  lineGraphics.stroke({ width: EDGE_WIDTH, color });

  drawDot(dotGraphics, startX, sy, EDGE_DOT_RADIUS, color);
  drawDot(dotGraphics, endX, ty, EDGE_DOT_RADIUS, color);
};

const renderVerticalEdge = (
  lineGraphics: Graphics,
  dotGraphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfH: number, targetHalfH: number,
  color: number
): void => {
  const goingDown = ty > sy;
  const startY = goingDown ? sy + sourceHalfH : sy - sourceHalfH;
  const endY = goingDown ? ty - targetHalfH : ty + targetHalfH;

  lineGraphics.moveTo(sx, startY);
  lineGraphics.lineTo(tx, endY);
  lineGraphics.stroke({ width: EDGE_WIDTH, color });

  drawDot(dotGraphics, sx, startY, EDGE_DOT_RADIUS, color);
  drawDot(dotGraphics, tx, endY, EDGE_DOT_RADIUS, color);
};
