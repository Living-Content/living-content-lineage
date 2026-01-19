/**
 * Unified edge rendering for both lineage and workflow views.
 * Edges have dots at both ends that sit on the edge of nodes.
 * Lines render behind nodes, dots render in front.
 */
import { Container, Graphics } from 'pixi.js';
import type { LineageEdgeData, Workflow } from '../../../config/types.js';
import type { GraphNode } from './nodeRenderer.js';
import { getColor } from '../../../theme/theme.js';
import {
  EDGE_WIDTH,
  EDGE_DOT_RADIUS,
  WORKFLOW_EDGE_WIDTH,
  WORKFLOW_DOT_RADIUS,
  FADED_NODE_ALPHA,
} from '../../../config/constants.js';
import { drawDot } from './rendererUtils.js';

export type ViewMode = 'lineage' | 'workflow';

export interface EdgeRenderOptions {
  view: ViewMode;
  selectedId: string | null;
  highlightedIds: Set<string> | null;
}

/**
 * Unified edge rendering for both views.
 * - 'workflow' view: renders edges between nodes within a workflow
 * - 'lineage' view: renders edges between workflow nodes
 */
export const renderEdges = (
  edgeLayer: Container,
  dotLayer: Container | null,
  edges: LineageEdgeData[],
  nodeMap: Map<string, GraphNode>,
  options: EdgeRenderOptions
): void => {
  edgeLayer.removeChildren();
  dotLayer?.removeChildren();

  const { view, selectedId, highlightedIds } = options;
  const edgeWidth = view === 'lineage' ? WORKFLOW_EDGE_WIDTH : EDGE_WIDTH;
  const dotRadius = view === 'lineage' ? WORKFLOW_DOT_RADIUS : EDGE_DOT_RADIUS;

  const lineGraphics = new Graphics();
  const fadedLineGraphics = new Graphics();
  const dotGraphics = new Graphics();
  const fadedDotGraphics = new Graphics();

  const allHighlighted = highlightedIds && selectedId
    ? new Set([selectedId, ...highlightedIds])
    : null;

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    if (sourceNode.culled && targetNode.culled) continue;

    const isHighlighted = selectedId === null ||
      (allHighlighted !== null &&
        allHighlighted.has(edge.source) &&
        allHighlighted.has(edge.target));

    const targetLineGraphics = isHighlighted ? lineGraphics : fadedLineGraphics;
    const targetDotGraphics = isHighlighted ? dotGraphics : fadedDotGraphics;

    const sx = sourceNode.position.x;
    const sy = sourceNode.position.y;
    const tx = targetNode.position.x;
    const ty = targetNode.position.y;

    const sourceHalfW = sourceNode.nodeWidth / 2;
    const sourceHalfH = sourceNode.nodeHeight / 2;
    const targetHalfW = targetNode.nodeWidth / 2;
    const targetHalfH = targetNode.nodeHeight / 2;

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
        color,
        edgeWidth,
        dotRadius
      );
    } else {
      renderVerticalEdge(
        targetLineGraphics,
        targetDotGraphics,
        sx, sy, tx, ty,
        sourceHalfH, targetHalfH,
        color,
        edgeWidth,
        dotRadius
      );
    }
  }

  fadedLineGraphics.alpha = FADED_NODE_ALPHA;
  fadedDotGraphics.alpha = FADED_NODE_ALPHA;

  edgeLayer.addChild(fadedLineGraphics);
  edgeLayer.addChild(lineGraphics);

  if (dotLayer) {
    dotLayer.addChild(fadedDotGraphics);
    dotLayer.addChild(dotGraphics);
  }
};

/**
 * Renders edges between workflow nodes in lineage view.
 * Workflows are connected in order.
 */
export const renderWorkflowEdges = (
  layer: Container,
  workflows: Workflow[],
  workflowNodeMap: Map<string, GraphNode>,
  selectedWorkflowId: string | null
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

const renderHorizontalEdge = (
  lineGraphics: Graphics,
  dotGraphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfW: number, targetHalfW: number,
  color: number,
  edgeWidth: number,
  dotRadius: number
): void => {
  const goingRight = tx > sx;
  const startX = goingRight ? sx + sourceHalfW : sx - sourceHalfW;
  const endX = goingRight ? tx - targetHalfW : tx + targetHalfW;

  lineGraphics.moveTo(startX, sy);
  lineGraphics.lineTo(endX, ty);
  lineGraphics.stroke({ width: edgeWidth, color });

  drawDot(dotGraphics, startX, sy, dotRadius, color);
  drawDot(dotGraphics, endX, ty, dotRadius, color);
};

const renderVerticalEdge = (
  lineGraphics: Graphics,
  dotGraphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfH: number, targetHalfH: number,
  color: number,
  edgeWidth: number,
  dotRadius: number
): void => {
  const goingDown = ty > sy;
  const startY = goingDown ? sy + sourceHalfH : sy - sourceHalfH;
  const endY = goingDown ? ty - targetHalfH : ty + targetHalfH;

  lineGraphics.moveTo(sx, startY);
  lineGraphics.lineTo(tx, endY);
  lineGraphics.stroke({ width: edgeWidth, color });

  drawDot(dotGraphics, sx, startY, dotRadius, color);
  drawDot(dotGraphics, tx, endY, dotRadius, color);
};
