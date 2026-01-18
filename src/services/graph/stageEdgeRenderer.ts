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
  FADED_NODE_ALPHA,
} from '../../config/constants.js';
import { drawDot } from './rendererUtils.js';

/**
 * Renders edges connecting stage nodes in order.
 * Each edge uses the phase color of its source stage.
 * When a stage is selected, only edges connected to it are fully visible.
 */
export const renderStageEdges = (
  layer: Container,
  stages: Stage[],
  stageNodeMap: Map<string, PillNode>,
  selectedStageId: string | null = null
): void => {
  layer.removeChildren();
  const graphics = new Graphics();
  const stageOrder = stages.map((s) => s.id);

  for (let i = 0; i < stageOrder.length - 1; i++) {
    const stage = stages[i];
    const nextStageId = stageOrder[i + 1];
    const sourceNode = stageNodeMap.get(stageOrder[i]);
    const targetNode = stageNodeMap.get(nextStageId);
    if (!sourceNode || !targetNode) continue;

    // Determine if this edge is connected to the selected stage
    const isConnected = selectedStageId === null ||
      stage.id === selectedStageId ||
      nextStageId === selectedStageId;

    const alpha = isConnected ? 1 : FADED_NODE_ALPHA;

    const baseColor = stage.phase
      ? getColor(`--phase-${stage.phase.toLowerCase()}`)
      : getColor('--color-edge-default');

    const startX = sourceNode.position.x + sourceNode.pillWidth / 2;
    const startY = sourceNode.position.y;
    const endX = targetNode.position.x - targetNode.pillWidth / 2;
    const endY = targetNode.position.y;

    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.stroke({ width: STAGE_EDGE_WIDTH, color: baseColor, alpha });

    drawDot(graphics, startX, startY, STAGE_DOT_RADIUS, baseColor, alpha);
    drawDot(graphics, endX, endY, STAGE_DOT_RADIUS, baseColor, alpha);
  }

  layer.addChild(graphics);
};
