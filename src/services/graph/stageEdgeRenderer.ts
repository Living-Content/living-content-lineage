/**
 * Renders edges between stage nodes in the collapsed LOD view.
 * Draws simple horizontal lines with arrowheads connecting stage nodes.
 */
import { Container, Graphics } from 'pixi.js';
import type { Stage } from '../../types.js';
import type { PillNode } from './nodeRenderer.js';
import {
  EDGE_ARROW_GAP,
  STAGE_EDGE_WIDTH,
  STAGE_ARROW_SIZE,
} from '../../config/constants.js';

const STAGE_EDGE_COLOR = 0x1a1a1a;

/**
 * Renders edges connecting stage nodes in order.
 * Each edge is a horizontal line with an arrowhead pointing to the target.
 */
export function renderStageEdges(
  layer: Container,
  stages: Stage[],
  stageNodeMap: Map<string, PillNode>
): void {
  layer.removeChildren();
  const graphics = new Graphics();
  const stageOrder = stages.map((s) => s.id);

  for (let i = 0; i < stageOrder.length - 1; i++) {
    const sourceNode = stageNodeMap.get(stageOrder[i]);
    const targetNode = stageNodeMap.get(stageOrder[i + 1]);
    if (!sourceNode || !targetNode) continue;

    const sx = sourceNode.position.x + sourceNode.pillWidth / 2;
    const sy = sourceNode.position.y;
    const tx = targetNode.position.x - targetNode.pillWidth / 2 - EDGE_ARROW_GAP;
    const ty = targetNode.position.y;

    graphics.moveTo(sx, sy);
    graphics.lineTo(tx, ty);
    graphics.stroke({ width: STAGE_EDGE_WIDTH, color: STAGE_EDGE_COLOR });

    graphics.moveTo(tx - STAGE_ARROW_SIZE, ty - STAGE_ARROW_SIZE / 2);
    graphics.lineTo(tx, ty);
    graphics.lineTo(tx - STAGE_ARROW_SIZE, ty + STAGE_ARROW_SIZE / 2);
    graphics.stroke({ width: STAGE_EDGE_WIDTH, color: STAGE_EDGE_COLOR });
  }

  layer.addChild(graphics);
}
