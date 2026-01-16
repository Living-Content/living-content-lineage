/**
 * Renders edges between meta-nodes in the collapsed LOD view.
 * Draws simple horizontal lines with arrowheads connecting stage nodes.
 */
import { Container, Graphics } from 'pixi.js';
import type { Stage } from '../../types.js';
import type { PillNode } from './nodeRenderer.js';
import {
  EDGE_ARROW_GAP,
  META_EDGE_WIDTH,
  META_ARROW_SIZE,
} from '../../config/constants.js';

const META_EDGE_COLOR = 0x1a1a1a;

/**
 * Renders edges connecting meta-nodes in stage order.
 * Each edge is a horizontal line with an arrowhead pointing to the target.
 */
export function renderMetaEdges(
  layer: Container,
  stages: Stage[],
  metaNodeMap: Map<string, PillNode>
): void {
  layer.removeChildren();
  const graphics = new Graphics();
  const stageOrder = stages.map((s) => s.id);

  for (let i = 0; i < stageOrder.length - 1; i++) {
    const sourceNode = metaNodeMap.get(stageOrder[i]);
    const targetNode = metaNodeMap.get(stageOrder[i + 1]);
    if (!sourceNode || !targetNode) continue;

    const sx = sourceNode.position.x + sourceNode.pillWidth / 2;
    const sy = sourceNode.position.y;
    const tx = targetNode.position.x - targetNode.pillWidth / 2 - EDGE_ARROW_GAP;
    const ty = targetNode.position.y;

    // Draw edge line
    graphics.moveTo(sx, sy);
    graphics.lineTo(tx, ty);
    graphics.stroke({ width: META_EDGE_WIDTH, color: META_EDGE_COLOR });

    // Draw arrowhead
    graphics.moveTo(tx - META_ARROW_SIZE, ty - META_ARROW_SIZE / 2);
    graphics.lineTo(tx, ty);
    graphics.lineTo(tx - META_ARROW_SIZE, ty + META_ARROW_SIZE / 2);
    graphics.stroke({ width: META_EDGE_WIDTH, color: META_EDGE_COLOR });
  }

  layer.addChild(graphics);
}
