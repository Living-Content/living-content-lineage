/**
 * Renders workflow labels at the top of the graph view.
 * Labels are created once and positions updated on viewport changes.
 * Each label has a dotted vertical line extending down toward the nodes.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Workflow, Phase } from '../../../config/types.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { GraphNode } from './nodeRenderer.js';
import { getCssVarColorHex, getCssVar, getCssVarInt, getCssVarFloat, type CssVar } from '../../../themes/index.js';
import { setPhaseFilter } from '../../../stores/uiState.js';


/**
 * Gets the color for a workflow based on its phase.
 */
const getWorkflowColor = (phase?: Phase): number => {
  if (!phase) return getCssVarColorHex('--color-edge');
  return getCssVarColorHex(`--phase-${phase.toLowerCase()}` as CssVar);
};

/**
 * Creates a text style for workflow labels.
 */
const createLabelStyle = (color: number): TextStyle => {
  return new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: getCssVarInt('--workflow-label-font-size'),
    fontWeight: '600',
    fill: color,
    letterSpacing: getCssVarFloat('--workflow-label-letter-spacing'),
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
  labelContainer: Container;
  label: Text;
  line: Graphics;
  worldX: number;
  color: number;
  phase: Phase;
}

export interface WorkflowLabels {
  update: (viewportState: ViewportState) => void;
  setPhaseFilter: (activePhase: Phase | null) => void;
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
  label.position.y = getCssVarInt('--workflow-label-top-padding');

  // Wrap label in clickable container
  const labelContainer = new Container();
  labelContainer.eventMode = 'static';
  labelContainer.cursor = 'pointer';
  labelContainer.addChild(label);
  labelContainer.on('pointertap', () => setPhaseFilter(workflow.phase));

  const line = new Graphics();

  return { labelContainer, label, line, worldX, color, phase: workflow.phase };
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
    container.addChild(entry.labelContainer);
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
  entry.labelContainer.position.x = screenX;

  // Redraw dotted line
  entry.line.clear();
  if (globalTopY === Infinity) return;

  const startY = topPadding + getCssVarInt('--workflow-label-line-start');
  const endY = globalTopY;
  if (endY <= startY) return;

  const fadeDistance = (endY - startY) * 0.6;
  const fadeStartY = startY + fadeDistance;

  const dotSize = getCssVarInt('--workflow-label-dot-size');
  const dotGap = getCssVarInt('--workflow-label-dot-gap');

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
  const topPadding = getCssVarInt('--workflow-label-top-padding');

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

  const setPhaseFilterVisibility = (activePhase: Phase | null): void => {
    const fadedAlpha = getCssVarFloat('--faded-node-alpha');
    for (const entry of entries) {
      if (activePhase === null) {
        // No filter - show all labels at full opacity
        entry.labelContainer.alpha = 1;
        entry.line.alpha = 1;
      } else {
        // Filter active - dim non-matching labels
        const isActive = entry.phase === activePhase;
        entry.labelContainer.alpha = isActive ? 1 : fadedAlpha;
        entry.line.alpha = isActive ? 1 : fadedAlpha;
      }
    }
  };

  return { update, setPhaseFilter: setPhaseFilterVisibility, container };
}
