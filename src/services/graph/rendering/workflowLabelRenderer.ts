/**
 * Renders workflow labels at the top of the graph view.
 * Labels are created once and positions updated on viewport changes.
 * Each label has a dotted vertical line extending down toward the nodes.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Workflow, WorkflowPhase } from '../../../config/types.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { GraphNode } from './nodeRenderer.js';
import { getColor, getCssVar } from '../../../theme/theme.js';
import {
  WORKFLOW_LABEL_FONT_SIZE,
  WORKFLOW_LABEL_TOP_PADDING,
  WORKFLOW_LABEL_LINE_START,
} from '../../../config/constants.js';

const DOT_SIZE = 2;
const DOT_GAP = 4;

const getWorkflowColor = (phase?: WorkflowPhase): number => {
  if (!phase) return getColor('--color-edge-default');
  return getColor(`--phase-${phase.toLowerCase()}`);
};

const createLabelStyle = (color: number): TextStyle => {
  return new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: WORKFLOW_LABEL_FONT_SIZE,
    fontWeight: '600',
    fill: color,
    letterSpacing: -0.5,
  });
};

export interface TopNodeInfo {
  worldY: number;
  halfHeight: number;
}

interface WorkflowLabelEntry {
  label: Text;
  line: Graphics;
  worldX: number;
  color: number;
}

export interface WorkflowLabels {
  update: (viewportState: ViewportState) => void;
  container: Container;
}

/**
 * Creates workflow labels once. Call update() on viewport changes.
 * Uses workflowNodeMap positions so labels align with collapsed workflow nodes.
 */
export function createWorkflowLabels(
  workflows: Workflow[],
  workflowNodeMap: Map<string, GraphNode>,
  topNodeInfo: TopNodeInfo | null
): WorkflowLabels {
  const container = new Container();
  const entries: WorkflowLabelEntry[] = [];
  const topPadding = WORKFLOW_LABEL_TOP_PADDING;

  for (const workflow of workflows) {
    // Use workflow node position so labels align with collapsed view
    const workflowNode = workflowNodeMap.get(workflow.id);
    const worldX = workflowNode ? workflowNode.position.x : 0;
    const color = getWorkflowColor(workflow.phase);

    const label = new Text({ text: workflow.label, style: createLabelStyle(color) });
    label.anchor.set(0.5, 0);
    label.position.y = topPadding;
    container.addChild(label);

    const line = new Graphics();
    container.addChild(line);

    entries.push({ label, line, worldX, color });
  }

  function update(viewportState: ViewportState): void {
    const lineStartY = WORKFLOW_LABEL_LINE_START;
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
