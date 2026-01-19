/**
 * Unified edge rendering for both lineage and workflow views.
 * Edges have dots at both ends that sit on the edge of nodes.
 * Lines render behind nodes, dots render in front.
 */
import { Container, Graphics } from 'pixi.js';
import type { LineageEdgeData, Workflow } from '../../../config/types.js';
import type { GraphNode } from './nodeRenderer.js';
import { getCssVarColorHex, getCssVarInt, getCssVarFloat, type CssVar } from '../../../themes/index.js';
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
  const edgeWidth = getCssVarInt(view === 'lineage' ? '--workflow-edge-width' : '--edge-width');
  const dotRadius = getCssVarInt(view === 'lineage' ? '--workflow-dot-radius' : '--edge-dot-radius');

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
      ? getCssVarColorHex(`--phase-${sourcePhase.toLowerCase()}` as CssVar)
      : getCssVarColorHex('--color-edge-default');

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

  const fadedAlpha = getCssVarFloat('--faded-node-alpha');
  fadedLineGraphics.alpha = fadedAlpha;
  fadedDotGraphics.alpha = fadedAlpha;

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

    const fadedAlpha = getCssVarFloat('--faded-node-alpha');
    const alpha = isConnected ? 1 : fadedAlpha;

    const baseColor = workflow.phase
      ? getCssVarColorHex(`--phase-${workflow.phase.toLowerCase()}` as CssVar)
      : getCssVarColorHex('--color-edge-default');

    const startX = sourceNode.position.x + sourceNode.nodeWidth / 2;
    const startY = sourceNode.position.y;
    const endX = targetNode.position.x - targetNode.nodeWidth / 2;
    const endY = targetNode.position.y;

    const workflowEdgeWidth = getCssVarInt('--workflow-edge-width');
    const workflowDotRadius = getCssVarInt('--workflow-dot-radius');

    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.stroke({ width: workflowEdgeWidth, color: baseColor, alpha });

    drawDot(graphics, startX, startY, workflowDotRadius, baseColor, alpha);
    drawDot(graphics, endX, endY, workflowDotRadius, baseColor, alpha);
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
