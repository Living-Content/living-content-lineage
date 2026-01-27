/**
 * Renders step labels above workflow rows in world space.
 * Labels are positioned relative to workflow nodes, moving with the viewport.
 * Each label has a dotted vertical line extending down toward the nodes.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { StepUI, Phase } from '../../../config/types.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { GraphNode } from './nodeRenderer.js';
import { getCssVarColorHex, getCssVar, getCssVarInt, getCssVarFloat, type CssVar } from '../../../themes/index.js';
import { uiState } from '../../../stores/uiState.svelte.js';


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

// World-space offset above the topmost node
const LABEL_WORLD_OFFSET_Y = 80;
// Line start offset below label (in world space)
const LINE_START_OFFSET = 30;

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

  // Wrap label in clickable container
  const labelContainer = new Container();
  labelContainer.eventMode = 'static';
  labelContainer.cursor = 'pointer';
  labelContainer.addChild(label);
  labelContainer.on('pointertap', () => uiState.setPhaseFilter(step.phase));

  // Position will be set in world coordinates during update
  labelContainer.position.x = actionWorldX;

  const line = new Graphics();

  return { labelContainer, label, line, worldX: actionWorldX, color, phase: step.phase };
};

/**
 * Finds the action node x position for a step across multiple nodeMaps.
 * Falls back to step node position if no action found.
 */
const findActionPositionForStep = (
  stepId: string,
  allNodeMaps: Map<string, GraphNode>[],
  stepNodeMap: Map<string, GraphNode>
): number => {
  // Search through all node maps for action node
  for (const nodeMap of allNodeMaps) {
    for (const node of nodeMap.values()) {
      if (node.nodeData.step === stepId &&
          node.nodeData.nodeType === 'process' &&
          node.nodeData.assetType === 'Action') {
        return node.position.x;
      }
    }
  }
  // Fallback to step node position (for steps without actions, like source steps)
  const stepNode = stepNodeMap.get(stepId);
  return stepNode ? stepNode.position.x : 0;
};

/**
 * Finds the topmost node Y position across workflows for a given step.
 */
export const findGlobalTopForStep = (
  stepId: string,
  allNodeMaps: Map<string, GraphNode>[]
): { worldY: number; halfHeight: number } | null => {
  let minWorldY = Infinity;
  let halfHeight = 0;

  for (const nodeMap of allNodeMaps) {
    for (const node of nodeMap.values()) {
      if (node.nodeData.step === stepId && node.position.y < minWorldY) {
        minWorldY = node.position.y;
        halfHeight = node.nodeHeight / 2;
      }
    }
  }

  return minWorldY === Infinity ? null : { worldY: minWorldY, halfHeight };
};

/**
 * Finds the topmost node in a single workflow's nodeMap.
 */
export const findTopNodeForWorkflow = (
  nodeMap: Map<string, GraphNode>
): TopNodeInfo | null => {
  let minWorldY = Infinity;
  let halfHeight = 0;

  for (const node of nodeMap.values()) {
    if (node.position.y < minWorldY) {
      minWorldY = node.position.y;
      halfHeight = node.nodeHeight / 2;
    }
  }

  return minWorldY === Infinity ? null : { worldY: minWorldY, halfHeight };
};

/**
 * Finds the action node x position for a step within a single nodeMap.
 * Falls back to finding any node in that step.
 */
const findActionPositionForStepInWorkflow = (
  stepId: string,
  nodeMap: Map<string, GraphNode>
): number | null => {
  // First try to find an action node
  for (const node of nodeMap.values()) {
    if (node.nodeData.step === stepId &&
        node.nodeData.nodeType === 'process' &&
        node.nodeData.assetType === 'Action') {
      return node.position.x;
    }
  }

  // Fall back to any node in that step
  for (const node of nodeMap.values()) {
    if (node.nodeData.step === stepId) {
      return node.position.x;
    }
  }

  return null;
};

/**
 * Batch creation of label entries from steps (no container attachment).
 * Labels are positioned at action nodes, falling back to step nodes for source steps.
 */
export const createLabelEntries = (
  steps: StepUI[],
  allNodeMaps: Map<string, GraphNode>[],
  stepNodeMap: Map<string, GraphNode>
): StepLabelEntry[] => {
  return steps.map((step) => {
    const actionX = findActionPositionForStep(step.id, allNodeMaps, stepNodeMap);
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
 * Updates a single label entry position in world coordinates.
 */
const updateLabelEntryPosition = (
  entry: StepLabelEntry,
  viewportState: ViewportState,
  topWorldY: number,
  topHalfHeight: number
): void => {
  // Position label in world coordinates
  const labelWorldY = topWorldY - topHalfHeight - LABEL_WORLD_OFFSET_Y;
  entry.labelContainer.position.x = entry.worldX;
  entry.labelContainer.position.y = labelWorldY;

  // Redraw dotted line in world coordinates
  entry.line.clear();
  if (topWorldY === Infinity) return;

  const startY = labelWorldY + LINE_START_OFFSET;
  const endY = topWorldY - topHalfHeight;
  if (endY <= startY) return;

  const fadeDistance = (endY - startY) * 0.6;
  const fadeStartY = startY + fadeDistance;

  const dotSize = getCssVarInt('--step-label-dot-size');
  const dotGap = getCssVarInt('--step-label-dot-gap');
  // Scale dot spacing based on viewport scale for consistent appearance
  const scaledDotSize = dotSize / viewportState.scale;
  const scaledDotGap = dotGap / viewportState.scale;

  let currentY = startY;
  while (currentY < endY) {
    let alpha = 1;
    if (currentY > fadeStartY) {
      const fadeProgress = (currentY - fadeStartY) / (endY - fadeStartY);
      alpha = 1 - Math.pow(fadeProgress, 2);
    }
    entry.line.circle(entry.worldX, currentY, scaledDotSize / 2);
    entry.line.fill({ color: entry.color, alpha });
    currentY += scaledDotSize + scaledDotGap;
  }
};

/**
 * Creates step labels in world space. Call update() on viewport changes.
 * Labels align with action nodes, falling back to step nodes for source steps.
 * Container should be added to the viewport (world space), not stage (screen space).
 *
 * Accepts multiple nodeMaps for visualization across workflows.
 */
export function createStepLabels(
  steps: StepUI[],
  allNodeMaps: Map<string, GraphNode>[],
  stepNodeMap: Map<string, GraphNode>,
  topNodeInfo: TopNodeInfo | null
): StepLabels {
  const container = new Container();

  // Create and attach entries
  const entries = createLabelEntries(steps, allNodeMaps, stepNodeMap);
  attachLabelEntriesToContainer(container, entries);

  // Store top node info for updates
  const currentTopInfo = topNodeInfo;

  const update = (viewportState: ViewportState): void => {
    if (!currentTopInfo) return;

    for (const entry of entries) {
      updateLabelEntryPosition(
        entry,
        viewportState,
        currentTopInfo.worldY,
        currentTopInfo.halfHeight
      );
    }
  };

  const setPhaseFilterVisibility = (activePhase: Phase | null): void => {
    const fadedAlpha = getCssVarFloat('--node-faded-alpha');
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

/**
 * Creates step labels for a SINGLE workflow using its own steps and node positions.
 * Each workflow gets independent labels positioned above ITS nodes.
 */
export const createWorkflowStepLabels = (
  steps: StepUI[],
  nodeMap: Map<string, GraphNode>,
  getTopNodeInfo: () => TopNodeInfo | null
): StepLabels => {
  const container = new Container();
  const entries: StepLabelEntry[] = [];

  // Create labels only for steps that have nodes in this workflow
  for (const step of steps) {
    const actionX = findActionPositionForStepInWorkflow(step.id, nodeMap);
    if (actionX !== null) {
      const entry = createStepLabelEntry(step, actionX);
      entries.push(entry);
      container.addChild(entry.labelContainer);
      container.addChild(entry.line);
    }
  }

  const update = (viewportState: ViewportState): void => {
    const topInfo = getTopNodeInfo();
    if (!topInfo) return;

    for (const entry of entries) {
      updateLabelEntryPosition(
        entry,
        viewportState,
        topInfo.worldY,
        topInfo.halfHeight
      );
    }
  };

  const setPhaseFilterVisibility = (activePhase: Phase | null): void => {
    const fadedAlpha = getCssVarFloat('--node-faded-alpha');
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
};

/**
 * Workflow data needed for label creation.
 */
export interface WorkflowLabelData {
  workflowId: string;
  steps: StepUI[];
  nodeMap: Map<string, GraphNode>;
}

/**
 * Creates step labels for all workflows, each positioned above its own nodes.
 * Returns a composite StepLabels that manages all workflow labels together.
 */
export const createWorkflowLabels = (
  workflows: WorkflowLabelData[]
): StepLabels => {
  const container = new Container();
  const allLabelSets: StepLabels[] = [];

  for (const wf of workflows) {
    // Create labels for this workflow using its own top node info
    const getTopInfo = () => findTopNodeForWorkflow(wf.nodeMap);
    const labels = createWorkflowStepLabels(wf.steps, wf.nodeMap, getTopInfo);
    container.addChild(labels.container);
    allLabelSets.push(labels);
  }

  const update = (viewportState: ViewportState): void => {
    for (const labels of allLabelSets) {
      labels.update(viewportState);
    }
  };

  const setPhaseFilter = (activePhase: Phase | null): void => {
    for (const labels of allLabelSets) {
      labels.setPhaseFilter(activePhase);
    }
  };

  const setVisible = (visible: boolean): void => {
    container.visible = visible;
  };

  return { update, setPhaseFilter, setVisible, container };
};
