/**
 * Renders stage labels at the top of the graph view.
 * Labels are created once and positions updated on viewport changes.
 * Each label has a dotted vertical line extending down toward the nodes.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Stage, WorkflowPhase } from '../../../config/types.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { PillNode } from './nodeRenderer.js';
import { getColor, getCssVar } from '../../../theme/theme.js';
import {
  STAGE_LABEL_FONT_SIZE,
  STAGE_LABEL_TOP_PADDING,
  STAGE_LABEL_LINE_START,
} from '../../../config/constants.js';

const DOT_SIZE = 2;
const DOT_GAP = 4;

const getStageColor = (phase?: WorkflowPhase): number => {
  if (!phase) return getColor('--color-edge-default');
  return getColor(`--phase-${phase.toLowerCase()}`);
};

const createLabelStyle = (color: number): TextStyle => {
  return new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: STAGE_LABEL_FONT_SIZE,
    fontWeight: '600',
    fill: color,
    letterSpacing: -0.5,
  });
};

export interface TopNodeInfo {
  worldY: number;
  halfHeight: number;
}

interface StageLabelEntry {
  label: Text;
  line: Graphics;
  worldX: number;
  color: number;
}

export interface StageLabels {
  update: (viewportState: ViewportState) => void;
  container: Container;
}

/**
 * Creates stage labels once. Call update() on viewport changes.
 * Uses stageNodeMap positions so labels align with collapsed stage nodes.
 */
export function createStageLabels(
  stages: Stage[],
  stageNodeMap: Map<string, PillNode>,
  topNodeInfo: TopNodeInfo | null
): StageLabels {
  const container = new Container();
  const entries: StageLabelEntry[] = [];
  const topPadding = STAGE_LABEL_TOP_PADDING;

  for (const stage of stages) {
    // Use stage node position so labels align with collapsed view
    const stageNode = stageNodeMap.get(stage.id);
    const worldX = stageNode ? stageNode.position.x : 0;
    const color = getStageColor(stage.phase);

    const label = new Text({ text: stage.label, style: createLabelStyle(color) });
    label.anchor.set(0.5, 0);
    label.position.y = topPadding;
    container.addChild(label);

    const line = new Graphics();
    container.addChild(line);

    entries.push({ label, line, worldX, color });
  }

  function update(viewportState: ViewportState): void {
    const lineStartY = STAGE_LABEL_LINE_START;
    const globalTopY = topNodeInfo !== null
      ? viewportState.y + topNodeInfo.worldY * viewportState.scale - topNodeInfo.halfHeight * viewportState.scale
      : Infinity;

    for (const entry of entries) {
      const screenX = viewportState.x + entry.worldX * viewportState.scale;
      entry.label.position.x = screenX;

      // Redraw dotted line
      entry.line.clear();
      if (globalTopY === Infinity) continue;

      const startY = topPadding + lineStartY;
      const endY = globalTopY;
      if (endY <= startY) continue;

      const fadeDistance = (endY - startY) * 0.6;
      const fadeStartY = startY + fadeDistance;

      let currentY = startY;
      while (currentY < endY) {
        let alpha = 1;
        if (currentY > fadeStartY) {
          const fadeProgress = (currentY - fadeStartY) / (endY - fadeStartY);
          alpha = 1 - Math.pow(fadeProgress, 2);
        }
        entry.line.circle(screenX, currentY, DOT_SIZE / 2);
        entry.line.fill({ color: entry.color, alpha });
        currentY += DOT_SIZE + DOT_GAP;
      }
    }
  }

  return { update, container };
}
