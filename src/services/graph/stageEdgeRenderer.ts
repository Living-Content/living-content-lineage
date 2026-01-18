/**
 * Renders edges between stage nodes in the collapsed LOD view.
 * Uses phase colors matching the source stage node.
 * Edges have dots at both ends.
 */
import { Container, Graphics } from 'pixi.js';
import type { Stage } from '../../types.js';
import type { PillNode } from './nodeRenderer.js';
import { getColor } from '../../ui/theme.js';
import {
  STAGE_EDGE_WIDTH,
  STAGE_DOT_RADIUS,
} from '../../config/constants.js';

function drawDot(graphics: Graphics, x: number, y: number, color: number): void {
  graphics.circle(x, y, STAGE_DOT_RADIUS);
  graphics.fill({ color });
  graphics.circle(x, y, STAGE_DOT_RADIUS);
  graphics.stroke({ width: 1, color: getColor('--color-edge-stroke') });
}

/**
 * Renders edges connecting stage nodes in order.
 * Each edge uses the phase color of its source stage.
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
    const stage = stages[i];
    const sourceNode = stageNodeMap.get(stageOrder[i]);
    const targetNode = stageNodeMap.get(stageOrder[i + 1]);
    if (!sourceNode || !targetNode) continue;

    const color = stage.phase
      ? getColor(`--phase-${stage.phase.toLowerCase()}`)
      : getColor('--color-edge-default');

    const startX = sourceNode.position.x + sourceNode.pillWidth / 2;
    const startY = sourceNode.position.y;
    const endX = targetNode.position.x - targetNode.pillWidth / 2;
    const endY = targetNode.position.y;

    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.stroke({ width: STAGE_EDGE_WIDTH, color });

    drawDot(graphics, startX, startY, color);
    drawDot(graphics, endX, endY, color);
  }

  layer.addChild(graphics);
}
