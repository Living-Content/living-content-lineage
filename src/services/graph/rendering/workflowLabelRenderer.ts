/**
 * Renders workflow labels at the top of the graph view.
 * Labels are created once and positions updated on viewport changes.
 * Each label has a dotted vertical line extending down toward the nodes.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Workflow, Phase } from '../../../config/types.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { GraphNode } from './nodeRenderer.js';
import { getColor, getCssVar } from '../../../theme/theme.js';


/**
 * Gets the color for a workflow based on its phase.
 */
const getWorkflowColor = (phase?: Phase): number => {
  if (!phase) return getColor('--color-edge-default');
  return getColor(`--phase-${phase.toLowerCase()}`);
};

/**
 * Creates a text style for workflow labels.
 */
const createLabelStyle = (color: number): TextStyle => {
  return new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: parseInt(getCssVar('--workflow-label-font-size')),
    fontWeight: '600',
    fill: color,
    letterSpacing: parseFloat(getCssVar('--workflow-label-letter-spacing')),
  });
};

export interface TopNodeInfo {
  worldY: number;
  halfHeight: number;
}

/**
 * A single workflow label entry with its visual elements.
 */
export interface WorkflowLabelEntry {
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
 * Pure creation of a single workflow label entry (no container attachment).
 */
export const createWorkflowLabelEntry = (
  workflow: Workflow,
  workflowNode: GraphNode | undefined
): WorkflowLabelEntry => {
  const worldX = workflowNode ? workflowNode.position.x : 0;
  const color = getWorkflowColor(workflow.phase);

  const label = new Text({ text: workflow.label, style: createLabelStyle(color) });
  label.anchor.set(0.5, 0);
  label.position.y = parseInt(getCssVar('--workflow-label-top-padding'));

  const line = new Graphics();

  return { label, line, worldX, color };
};

/**
 * Batch creation of label entries from workflows (no container attachment).
 */
export const createLabelEntries = (
  workflows: Workflow[],
  workflowNodeMap: Map<string, GraphNode>
): WorkflowLabelEntry[] => {
  return workflows.map((workflow) =>
    createWorkflowLabelEntry(workflow, workflowNodeMap.get(workflow.id))
  );
};

/**
 * Attaches label entries to a container (explicit side effect).
 */
export const attachLabelEntriesToContainer = (
  container: Container,
  entries: WorkflowLabelEntry[]
): void => {
  for (const entry of entries) {
    container.addChild(entry.label);
    container.addChild(entry.line);
  }
};

/**
 * Updates a single label entry position based on viewport state.
 */
const updateLabelEntryPosition = (
  entry: WorkflowLabelEntry,
  viewportState: ViewportState,
  topPadding: number,
  globalTopY: number
): void => {
  const screenX = viewportState.x + entry.worldX * viewportState.scale;
  entry.label.position.x = screenX;

  // Redraw dotted line
  entry.line.clear();
  if (globalTopY === Infinity) return;

  const startY = topPadding + parseInt(getCssVar('--workflow-label-line-start'));
  const endY = globalTopY;
  if (endY <= startY) return;

  const fadeDistance = (endY - startY) * 0.6;
  const fadeStartY = startY + fadeDistance;

  const dotSize = parseInt(getCssVar('--workflow-label-dot-size'));
  const dotGap = parseInt(getCssVar('--workflow-label-dot-gap'));

  let currentY = startY;
  while (currentY < endY) {
    let alpha = 1;
    if (currentY > fadeStartY) {
      const fadeProgress = (currentY - fadeStartY) / (endY - fadeStartY);
      alpha = 1 - Math.pow(fadeProgress, 2);
    }
    entry.line.circle(screenX, currentY, dotSize / 2);
    entry.line.fill({ color: entry.color, alpha });
    currentY += dotSize + dotGap;
  }
};

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
  const topPadding = parseInt(getCssVar('--workflow-label-top-padding'));

  // Create and attach entries
  const entries = createLabelEntries(workflows, workflowNodeMap);
  attachLabelEntriesToContainer(container, entries);

  const update = (viewportState: ViewportState): void => {
    const globalTopY = topNodeInfo !== null
      ? viewportState.y + topNodeInfo.worldY * viewportState.scale - topNodeInfo.halfHeight * viewportState.scale
      : Infinity;

    for (const entry of entries) {
      updateLabelEntryPosition(entry, viewportState, topPadding, globalTopY);
    }
  };

  return { update, container };
}
