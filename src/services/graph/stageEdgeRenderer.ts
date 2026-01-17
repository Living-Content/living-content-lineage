/**
 * Renders edges between stage nodes in the collapsed LOD view.
 * Uses phase colors matching the source stage node.
 * Edges have dots at both ends.
 */
import { Container, Graphics } from 'pixi.js';
import type { Stage, WorkflowPhase } from '../../types.js';
import type { PillNode } from './nodeRenderer.js';
import { PHASE_COLORS } from '../../ui/theme.js';
import {
  STAGE_EDGE_WIDTH,
  STAGE_DOT_RADIUS,
} from '../../config/constants.js';

const cachedPhaseColors = new Map<WorkflowPhase, number>();

function parseColor(colorString: string): number {
  if (!colorString) return 0x666666;
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

function drawDot(graphics: Graphics, x: number, y: number, color: number): void {
  graphics.circle(x, y, STAGE_DOT_RADIUS);
  graphics.fill({ color });
  graphics.circle(x, y, STAGE_DOT_RADIUS);
  graphics.stroke({ width: 1, color: 0x000000 });
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

    const color = stage.phase ? getPhaseColorCached(stage.phase) : 0x666666;

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
