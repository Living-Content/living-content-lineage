/**
 * Renders stage labels at the top of the graph view.
 * Each label has a dotted vertical line extending down toward the nodes.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Stage } from '../../types.js';
import type { ViewportState } from './viewport.js';
import {
  STAGE_LABEL_FONT_SIZE,
  STAGE_LABEL_TOP_PADDING,
  STAGE_LABEL_LINE_START,
} from '../../config/constants.js';

const LABEL_COLOR = 0x666666;
const LINE_COLOR = 0x000000;
const DOT_SIZE = 2;
const DOT_GAP = 4;

const labelStyle = new TextStyle({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  fontSize: STAGE_LABEL_FONT_SIZE,
  fontWeight: '600',
  fill: LABEL_COLOR,
  letterSpacing: -0.5,
});

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

    // Render label text
    const label = new Text({ text: stage.label, style: labelStyle });
    label.anchor.set(0.5, 0);
    label.position.set(screenX, topPadding);
    layer.addChild(label);

    // Skip dotted line if no nodes exist
    if (globalTopY === Infinity) continue;

    // Render dotted vertical line with fade
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
      lineGraphics.fill({ color: LINE_COLOR, alpha });
      currentY += DOT_SIZE + DOT_GAP;
    }

    layer.addChild(lineGraphics);
  }
}
