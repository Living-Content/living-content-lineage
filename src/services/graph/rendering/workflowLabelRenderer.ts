/**
 * Renders step labels at the top of the graph view.
 * Labels are created once and positions updated on viewport changes.
 * Each label has a dotted vertical line extending down toward the nodes.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { StepUI, Phase } from '../../../config/types.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { GraphNode } from './nodeRenderer.js';
import { getCssVarColorHex, getCssVar, getCssVarInt, getCssVarFloat, type CssVar } from '../../../themes/index.js';
import { setPhaseFilter } from '../../../stores/uiState.js';


/**
 * Gets the color for a step based on its phase.
 */
const getStepColor = (phase?: Phase): number => {
  if (!phase) return getCssVarColorHex('--color-edge');
  return getCssVarColorHex(`--phase-${phase.toLowerCase()}` as CssVar);
};

/**
 * Creates a text style for step labels.
 */
const createLabelStyle = (color: number): TextStyle => {
  return new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: getCssVarInt('--step-label-font-size'),
    fontWeight: '600',
    fill: color,
    letterSpacing: getCssVarFloat('--step-label-letter-spacing'),
  });
};

export interface TopNodeInfo {
  worldY: number;
  halfHeight: number;
}

/**
 * A single step label entry with its visual elements.
 */
export interface StepLabelEntry {
  labelContainer: Container;
  label: Text;
  line: Graphics;
  worldX: number;
  color: number;
  phase: Phase;
}

export interface StepLabels {
  update: (viewportState: ViewportState) => void;
  setPhaseFilter: (activePhase: Phase | null) => void;
  setVisible: (visible: boolean) => void;
  container: Container;
}

/**
 * Pure creation of a single step label entry (no container attachment).
 * Uses actionWorldX (action node position) for alignment.
 */
export const createStepLabelEntry = (
  step: StepUI,
  actionWorldX: number
): StepLabelEntry => {
  const color = getStepColor(step.phase);

  const label = new Text({ text: step.label, style: createLabelStyle(color) });
  label.anchor.set(0.5, 0);
  label.position.y = getCssVarInt('--step-label-top-padding');

  // Wrap label in clickable container
  const labelContainer = new Container();
  labelContainer.eventMode = 'static';
  labelContainer.cursor = 'pointer';
  labelContainer.addChild(label);
  labelContainer.on('pointertap', () => setPhaseFilter(step.phase));

  const line = new Graphics();

  return { labelContainer, label, line, worldX: actionWorldX, color, phase: step.phase };
};

/**
 * Finds the action node x position for a step, or falls back to step node position.
 */
const findActionPositionForStep = (
  stepId: string,
  nodeMap: Map<string, GraphNode>,
  stepNodeMap: Map<string, GraphNode>
): number => {
  // Find action node for this step (nodeType === 'process' && assetType === 'Action')
  for (const node of nodeMap.values()) {
    if (node.nodeData.step === stepId &&
        node.nodeData.nodeType === 'process' &&
        node.nodeData.assetType === 'Action') {
      return node.position.x;
    }
  }
  // Fallback to step node position (for steps without actions, like source steps)
  const stepNode = stepNodeMap.get(stepId);
  return stepNode ? stepNode.position.x : 0;
};

/**
 * Batch creation of label entries from steps (no container attachment).
 * Labels are positioned at action nodes, falling back to step nodes for source steps.
 */
export const createLabelEntries = (
  steps: StepUI[],
  nodeMap: Map<string, GraphNode>,
  stepNodeMap: Map<string, GraphNode>
): StepLabelEntry[] => {
  return steps.map((step) => {
    const actionX = findActionPositionForStep(step.id, nodeMap, stepNodeMap);
    return createStepLabelEntry(step, actionX);
  });
};

/**
 * Attaches label entries to a container (explicit side effect).
 */
export const attachLabelEntriesToContainer = (
  container: Container,
  entries: StepLabelEntry[]
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
  entry: StepLabelEntry,
  viewportState: ViewportState,
  topPadding: number,
  globalTopY: number
): void => {
  const screenX = viewportState.x + entry.worldX * viewportState.scale;
  entry.labelContainer.position.x = screenX;

  // Redraw dotted line
  entry.line.clear();
  if (globalTopY === Infinity) return;

  const startY = topPadding + getCssVarInt('--step-label-line-start');
  const endY = globalTopY;
  if (endY <= startY) return;

  const fadeDistance = (endY - startY) * 0.6;
  const fadeStartY = startY + fadeDistance;

  const dotSize = getCssVarInt('--step-label-dot-size');
  const dotGap = getCssVarInt('--step-label-dot-gap');

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
 * Creates step labels once. Call update() on viewport changes.
 * Labels align with action nodes, falling back to step nodes for source steps.
 */
export function createStepLabels(
  steps: StepUI[],
  nodeMap: Map<string, GraphNode>,
  stepNodeMap: Map<string, GraphNode>,
  topNodeInfo: TopNodeInfo | null
): StepLabels {
  const container = new Container();
  const topPadding = getCssVarInt('--step-label-top-padding');

  // Create and attach entries
  const entries = createLabelEntries(steps, nodeMap, stepNodeMap);
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
      const isVisible = activePhase === null || entry.phase === activePhase;
      const alpha = isVisible ? 1 : fadedAlpha;
      entry.labelContainer.alpha = alpha;
      entry.line.alpha = alpha;
    }
  };

  const setVisible = (visible: boolean): void => {
    container.visible = visible;
  };

  return { update, setPhaseFilter: setPhaseFilterVisibility, setVisible, container };
}
