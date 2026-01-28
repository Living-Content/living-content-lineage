/**
 * Renders step labels above workflow rows in world space.
 * Labels are positioned relative to workflow nodes, moving with the viewport.
 * Each label has a dotted vertical line extending down toward the nodes.
 *
 * Updates in this version:
 * - Added optional destroy() lifecycle for cleanup.
 * - createStepLabels now accepts a dynamic top-node getter (prevents stale top info).
 * - Reduced duplication by reusing a shared internal creator.
 * - Added optional precomputed step->actionX map builder for better scalability.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { StepUI, Phase } from '../../../config/types.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { GraphNode } from './nodeRenderer.js';
import {
  getCssVarColorHex,
  getCssVar,
  getCssVarInt,
  getCssVarFloat,
  type CssVar,
} from '../../../themes/index.js';
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
  onTap?: () => void;
}

export interface StepLabels {
  update: (viewportState: ViewportState) => void;
  setPhaseFilter: (activePhase: Phase | null) => void;
  setVisible: (visible: boolean) => void;
  destroy: () => void;
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
  actionWorldX: number,
): StepLabelEntry => {
  const color = getStepColor(step.phase);

  const label = new Text({ text: step.label, style: createLabelStyle(color) });
  label.anchor.set(0.5, 0);

  // Wrap label in clickable container
  const labelContainer = new Container();
  labelContainer.eventMode = 'static';
  labelContainer.cursor = 'pointer';
  labelContainer.addChild(label);

  const onTap = () => uiState.setPhaseFilter(step.phase);
  labelContainer.on('pointertap', onTap);

  // Position will be set in world coordinates during update
  labelContainer.position.x = actionWorldX;

  const line = new Graphics();

  return {
    labelContainer,
    label,
    line,
    worldX: actionWorldX,
    color,
    phase: step.phase,
    onTap,
  };
};

/**
 * Finds the topmost node Y position across workflows for a given step.
 */
export const findGlobalTopForStep = (
  stepId: string,
  allNodeMaps: Map<string, GraphNode>[],
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
  nodeMap: Map<string, GraphNode>,
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
  nodeMap: Map<string, GraphNode>,
): number | null => {
  // First try to find an action node
  for (const node of nodeMap.values()) {
    if (
      node.nodeData.step === stepId &&
      node.nodeData.nodeType === 'process' &&
      node.nodeData.assetType === 'Action'
    ) {
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
 * Builds a fast lookup table: stepId -> actionX (or step node X fallback).
 * Use this when there are many workflows/nodes to avoid O(steps * nodes) scans.
 */
export const buildStepToActionXMap = (
  allNodeMaps: Map<string, GraphNode>[],
  stepNodeMap?: Map<string, GraphNode>,
): Map<string, number> => {
  const map = new Map<string, number>();

  // First pass: record Action node positions
  for (const nodeMap of allNodeMaps) {
    for (const node of nodeMap.values()) {
      if (
        node.nodeData.nodeType === 'process' &&
        node.nodeData.assetType === 'Action' &&
        node.nodeData.step
      ) {
        if (!map.has(node.nodeData.step))
          map.set(node.nodeData.step, node.position.x);
      }
    }
  }

  // Second pass: fill gaps with any node in that step
  for (const nodeMap of allNodeMaps) {
    for (const node of nodeMap.values()) {
      if (node.nodeData.step && !map.has(node.nodeData.step)) {
        map.set(node.nodeData.step, node.position.x);
      }
    }
  }

  // Optional third pass: fall back to stepNodeMap if provided
  if (stepNodeMap) {
    for (const [stepId, node] of stepNodeMap.entries()) {
      if (!map.has(stepId)) map.set(stepId, node.position.x);
    }
  }

  return map;
};

/**
 * Attaches label entries to a container (explicit side effect).
 */
const attachLabelEntriesToContainer = (
  container: Container,
  entries: StepLabelEntry[],
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
  topHalfHeight: number,
): void => {
  const labelWorldY = topWorldY - topHalfHeight - LABEL_WORLD_OFFSET_Y;
  entry.labelContainer.position.x = entry.worldX;
  entry.labelContainer.position.y = labelWorldY;

  entry.line.clear();
  if (topWorldY === Infinity) return;

  const startY = labelWorldY + LINE_START_OFFSET;
  const endY = topWorldY - topHalfHeight;
  if (endY <= startY) return;

  const fadeDistance = (endY - startY) * 0.6;
  const fadeStartY = startY + fadeDistance;

  const dotSize = getCssVarInt('--step-label-dot-size');
  const dotGap = getCssVarInt('--step-label-dot-gap');
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
 * Internal helper to build a StepLabels controller around a set of entries and a top-node getter.
 */
const createLabelsController = (
  entries: StepLabelEntry[],
  container: Container,
  getTopNodeInfo: () => TopNodeInfo | null,
): StepLabels => {
  const update = (viewportState: ViewportState): void => {
    const topInfo = getTopNodeInfo();
    if (!topInfo) return;

    for (const entry of entries) {
      updateLabelEntryPosition(
        entry,
        viewportState,
        topInfo.worldY,
        topInfo.halfHeight,
      );
    }
  };

  const setPhaseFilter = (activePhase: Phase | null): void => {
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

  const destroy = (): void => {
    for (const entry of entries) {
      // Unbind events before destruction
      if (entry.onTap) entry.labelContainer.off('pointertap', entry.onTap);
      // Destroy label container with children (includes label)
      entry.labelContainer.destroy({ children: true });
      entry.line.destroy();
    }
    // Parent container already has no children after above cleanup
    container.destroy({ children: false });
  };

  return { update, setPhaseFilter, setVisible, destroy, container };
};

/**
 * Creates step labels in world space.
 *
 * NOTE: getTopNodeInfo is a function to avoid stale top info when layout changes.
 * Optional stepToActionX can be passed in if you already precomputed it.
 */
export function createStepLabels(
  steps: StepUI[],
  allNodeMaps: Map<string, GraphNode>[],
  stepNodeMap: Map<string, GraphNode>,
  getTopNodeInfo: () => TopNodeInfo | null,
  stepToActionX?: Map<string, number>,
): StepLabels {
  const container = new Container();
  const actionXMap =
    stepToActionX ?? buildStepToActionXMap(allNodeMaps, stepNodeMap);

  const entries: StepLabelEntry[] = steps.map((step) => {
    const actionX = actionXMap.get(step.id) ?? 0;
    return createStepLabelEntry(step, actionX);
  });

  attachLabelEntriesToContainer(container, entries);
  return createLabelsController(entries, container, getTopNodeInfo);
}

/**
 * Creates step labels for a SINGLE workflow using its own steps and node positions.
 * Each workflow gets independent labels positioned above ITS nodes.
 */
export const createWorkflowStepLabels = (
  steps: StepUI[],
  nodeMap: Map<string, GraphNode>,
  getTopNodeInfo: () => TopNodeInfo | null,
): StepLabels => {
  const container = new Container();
  const entries: StepLabelEntry[] = [];

  for (const step of steps) {
    const actionX = findActionPositionForStepInWorkflow(step.id, nodeMap);
    if (actionX !== null) entries.push(createStepLabelEntry(step, actionX));
  }

  attachLabelEntriesToContainer(container, entries);
  return createLabelsController(entries, container, getTopNodeInfo);
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
  workflows: WorkflowLabelData[],
): StepLabels => {
  const container = new Container();
  const allLabelSets: StepLabels[] = [];

  for (const wf of workflows) {
    const getTopInfo = () => findTopNodeForWorkflow(wf.nodeMap);
    const labels = createWorkflowStepLabels(wf.steps, wf.nodeMap, getTopInfo);
    container.addChild(labels.container);
    allLabelSets.push(labels);
  }

  const update = (viewportState: ViewportState): void => {
    for (const labels of allLabelSets) labels.update(viewportState);
  };

  const setPhaseFilter = (activePhase: Phase | null): void => {
    for (const labels of allLabelSets) labels.setPhaseFilter(activePhase);
  };

  const setVisible = (visible: boolean): void => {
    container.visible = visible;
  };

  const destroy = (): void => {
    // Each label set destroys its own children
    for (const labels of allLabelSets) labels.destroy();
    // Parent container already has no children after above cleanup
    container.destroy({ children: false });
  };

  return { update, setPhaseFilter, setVisible, destroy, container };
};
