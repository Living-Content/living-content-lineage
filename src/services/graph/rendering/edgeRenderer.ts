/**
 * Unified edge rendering for both lineage and workflow views.
 * Edges have dots at both ends that sit on the edge of nodes.
 * Edges render on top of nodes.
 */
import { Container, Graphics } from 'pixi.js';
import type { LineageEdgeData, StepUI } from '../../../config/types.js';
import type { GraphNode } from './nodeRenderer.js';
import { getCssVarColorHex, getCssVarInt, getCssVarFloat } from '../../../themes/index.js';
import { drawChevron } from './rendererUtils.js';

export type ViewMode = 'lineage' | 'workflow';

export interface EdgeRenderOptions {
  view: ViewMode;
  selectedId: string | null;
}

/**
 * Unified edge rendering for both views.
 * - 'workflow' view: renders edges between nodes within a workflow
 * - 'lineage' view: renders edges between workflow nodes
 */
export const renderEdges = (
  edgeLayer: Container,
  edges: LineageEdgeData[],
  nodeMap: Map<string, GraphNode>,
  options: EdgeRenderOptions
): void => {
  edgeLayer.removeChildren();

  const { view, selectedId } = options;
  const edgeWidth = getCssVarInt(view === 'lineage' ? '--workflow-edge-width' : '--edge-width');
  const dotRadius = getCssVarInt(view === 'lineage' ? '--workflow-dot-radius' : '--edge-dot-radius');
  const color = getCssVarColorHex('--color-edge');

  const lineGraphics = new Graphics();
  const fadedLineGraphics = new Graphics();
  const dotGraphics = new Graphics();
  const fadedDotGraphics = new Graphics();

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    if (sourceNode.culled && targetNode.culled) continue;

    // Edge is highlighted if no selection, or if selected node is an endpoint
    const isHighlighted = selectedId === null ||
      edge.source === selectedId ||
      edge.target === selectedId;

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
        dotRadius,
        targetNode.isChevronShape
      );
    } else {
      renderVerticalEdge(
        targetLineGraphics,
        sx, sy, tx, ty,
        sourceHalfH, targetHalfH,
        color,
        edgeWidth
      );
    }
  }

  const fadedAlpha = getCssVarFloat('--faded-node-alpha');
  fadedLineGraphics.alpha = fadedAlpha;
  fadedDotGraphics.alpha = fadedAlpha;

  edgeLayer.addChild(fadedLineGraphics);
  edgeLayer.addChild(lineGraphics);
  edgeLayer.addChild(fadedDotGraphics);
  edgeLayer.addChild(dotGraphics);
};

/**
 * Renders edges between step nodes in lineage view.
 * Steps are connected in order.
 */
export const renderStepEdges = (
  layer: Container,
  steps: StepUI[],
  stepNodeMap: Map<string, GraphNode>,
  selectedStepId: string | null
): void => {
  layer.removeChildren();
  const graphics = new Graphics();
  const stepOrder = steps.map((s) => s.id);
  const color = getCssVarColorHex('--color-edge');
  const workflowEdgeWidth = getCssVarInt('--workflow-edge-width');
  const fadedAlpha = getCssVarFloat('--faded-node-alpha');

  for (let i = 0; i < stepOrder.length - 1; i++) {
    const nextStepId = stepOrder[i + 1];
    const sourceNode = stepNodeMap.get(stepOrder[i]);
    const targetNode = stepNodeMap.get(nextStepId);
    if (!sourceNode || !targetNode) continue;

    const isConnected = selectedStepId === null ||
      stepOrder[i] === selectedStepId ||
      nextStepId === selectedStepId;

    const alpha = isConnected ? 0.5 : fadedAlpha;

    const startX = sourceNode.position.x + sourceNode.nodeWidth / 2;
    const startY = sourceNode.position.y;
    const endX = targetNode.position.x - targetNode.nodeWidth / 2;
    const endY = targetNode.position.y;

    // Calculate control points for cubic bezier curve
    const dx = endX - startX;
    const controlOffset = Math.abs(dx) * 0.2;

    graphics.moveTo(startX, startY);
    graphics.bezierCurveTo(
      startX + controlOffset, startY,
      endX - controlOffset, endY,
      endX, endY
    );
    graphics.stroke({ width: workflowEdgeWidth, color, alpha });
  }

  layer.addChild(graphics);
};

const EDGE_ALPHA = 0.5;

const renderHorizontalEdge = (
  lineGraphics: Graphics,
  dotGraphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfW: number, targetHalfW: number,
  color: number,
  edgeWidth: number,
  dotRadius: number,
  targetIsChevron: boolean = false
): void => {
  const goingRight = tx > sx;
  const startX = goingRight ? sx + sourceHalfW : sx - sourceHalfW;
  const nodeEdgeX = goingRight ? tx - targetHalfW : tx + targetHalfW;

  // Chevron arm size (must match drawChevron)
  const chevronArm = dotRadius * 1.5;

  // For chevron targets, line extends to the chevron tip
  const endX = (targetIsChevron && goingRight) ? nodeEdgeX + chevronArm : nodeEdgeX;

  // Calculate control points for cubic bezier curve
  const dx = endX - startX;
  const controlOffset = Math.abs(dx) * 0.2;

  lineGraphics.moveTo(startX, sy);
  lineGraphics.bezierCurveTo(
    startX + (goingRight ? controlOffset : -controlOffset), sy,
    endX - (goingRight ? controlOffset : -controlOffset), ty,
    endX, ty
  );
  lineGraphics.stroke({ width: edgeWidth, color, alpha: EDGE_ALPHA });

  // Draw chevron at the node edge (tip points inward to where line ends)
  if (targetIsChevron && goingRight) {
    drawChevron(dotGraphics, nodeEdgeX, ty, dotRadius, color, EDGE_ALPHA);
  }
};

const renderVerticalEdge = (
  lineGraphics: Graphics,
  sx: number, sy: number,
  tx: number, ty: number,
  sourceHalfH: number, targetHalfH: number,
  color: number,
  edgeWidth: number
): void => {
  const goingDown = ty > sy;
  const startY = goingDown ? sy + sourceHalfH : sy - sourceHalfH;
  const endY = goingDown ? ty - targetHalfH : ty + targetHalfH;

  // Calculate control points for cubic bezier curve
  const dy = endY - startY;
  const controlOffset = Math.abs(dy) * 0.2;

  lineGraphics.moveTo(sx, startY);
  lineGraphics.bezierCurveTo(
    sx, startY + (goingDown ? controlOffset : -controlOffset),
    tx, endY - (goingDown ? controlOffset : -controlOffset),
    tx, endY
  );
  lineGraphics.stroke({ width: edgeWidth, color, alpha: EDGE_ALPHA });
};
