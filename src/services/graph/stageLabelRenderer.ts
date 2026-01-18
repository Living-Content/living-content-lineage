/**
 * Renders stage labels at the top of the graph view.
 * Each label has a dotted vertical line extending down toward the nodes.
 * Labels and lines are color-coded by phase.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Stage, WorkflowPhase } from '../../types.js';
import type { ViewportState } from './viewport.js';
import { getColor, getCssVar } from '../../ui/theme.js';
import {
  STAGE_LABEL_FONT_SIZE,
  STAGE_LABEL_TOP_PADDING,
  STAGE_LABEL_LINE_START,
} from '../../config/constants.js';

const DOT_SIZE = 2;
const DOT_GAP = 4;

function getStageColor(phase?: WorkflowPhase): number {
  if (!phase) return getColor('--color-edge-default');
  return getColor(`--phase-${phase.toLowerCase()}`);
}

function createLabelStyle(color: number): TextStyle {
  return new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: STAGE_LABEL_FONT_SIZE,
    fontWeight: '600',
    fill: color,
    letterSpacing: -0.5,
  });
}

export interface TopNodeInfo {
  worldY: number;
  halfHeight: number;
}

/**
 * Renders stage labels with dotted vertical lines extending toward graph nodes.
 * Lines fade out as they approach the topmost node.
 */
export function renderStageLabels(
  layer: Container,
  stages: Stage[],
  viewportState: ViewportState,
  graphScale: number,
  topNodeInfo: TopNodeInfo | null
): void {
  layer.removeChildren();

  const topPadding = STAGE_LABEL_TOP_PADDING;
  const lineStartY = STAGE_LABEL_LINE_START;

  const globalTopY = topNodeInfo !== null
    ? viewportState.y + topNodeInfo.worldY * viewportState.scale - topNodeInfo.halfHeight * viewportState.scale
    : Infinity;

  for (const stage of stages) {
    const worldX = (((stage.xStart + stage.xEnd) / 2) - 0.5) * graphScale;
    const screenX = viewportState.x + worldX * viewportState.scale;
    const color = getStageColor(stage.phase);

    const label = new Text({ text: stage.label, style: createLabelStyle(color) });
    label.anchor.set(0.5, 0);
    label.position.set(screenX, topPadding);
    layer.addChild(label);

    if (globalTopY === Infinity) continue;

    const startY = topPadding + lineStartY;
    const endY = globalTopY;
    const fadeDistance = (endY - startY) * 0.6;
    const fadeStartY = startY + fadeDistance;

    const lineGraphics = new Graphics();
    let currentY = startY;

    while (currentY < endY) {
      let alpha = 1;
      if (currentY > fadeStartY) {
        const fadeProgress = (currentY - fadeStartY) / (endY - fadeStartY);
        alpha = 1 - Math.pow(fadeProgress, 2);
      }
      lineGraphics.circle(screenX, currentY, DOT_SIZE / 2);
      lineGraphics.fill({ color, alpha });
      currentY += DOT_SIZE + DOT_GAP;
    }

    layer.addChild(lineGraphics);
  }
}
