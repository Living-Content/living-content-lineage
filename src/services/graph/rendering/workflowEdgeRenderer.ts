/**
 * Renders edges between workflow nodes in the collapsed LOD view.
 * Uses phase colors matching the source workflow node.
 * Edges have dots at both ends.
 */
import { Container, Graphics } from 'pixi.js';
import type { Workflow } from '../../../config/types.js';
import type { GraphNode } from './nodeRenderer.js';
import { getColor } from '../../../theme/theme.js';
import {
  WORKFLOW_EDGE_WIDTH,
  WORKFLOW_DOT_RADIUS,
  FADED_NODE_ALPHA,
} from '../../../config/constants.js';
import { drawDot } from './rendererUtils.js';

/**
 * Renders edges connecting workflow nodes in order.
 * Each edge uses the phase color of its source workflow.
 * When a workflow is selected, only edges connected to it are fully visible.
 */
export const renderWorkflowEdges = (
  layer: Container,
  workflows: Workflow[],
  workflowNodeMap: Map<string, GraphNode>,
  selectedWorkflowId: string | null = null
): void => {
  layer.removeChildren();
  const graphics = new Graphics();
  const workflowOrder = workflows.map((w) => w.id);

  for (let i = 0; i < workflowOrder.length - 1; i++) {
    const workflow = workflows[i];
    const nextWorkflowId = workflowOrder[i + 1];
    const sourceNode = workflowNodeMap.get(workflowOrder[i]);
    const targetNode = workflowNodeMap.get(nextWorkflowId);
    if (!sourceNode || !targetNode) continue;

    // Determine if this edge is connected to the selected workflow
    const isConnected = selectedWorkflowId === null ||
      workflow.id === selectedWorkflowId ||
      nextWorkflowId === selectedWorkflowId;

    const alpha = isConnected ? 1 : FADED_NODE_ALPHA;

    const baseColor = workflow.phase
      ? getColor(`--phase-${workflow.phase.toLowerCase()}`)
      : getColor('--color-edge-default');

    const startX = sourceNode.position.x + sourceNode.nodeWidth / 2;
    const startY = sourceNode.position.y;
    const endX = targetNode.position.x - targetNode.nodeWidth / 2;
    const endY = targetNode.position.y;

    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.stroke({ width: WORKFLOW_EDGE_WIDTH, color: baseColor, alpha });

    drawDot(graphics, startX, startY, WORKFLOW_DOT_RADIUS, baseColor, alpha);
    drawDot(graphics, endX, endY, WORKFLOW_DOT_RADIUS, baseColor, alpha);
  }

  layer.addChild(graphics);
};
