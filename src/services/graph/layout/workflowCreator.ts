/**
 * Step node creation and bounds calculation.
 */
import type { Ticker, Container } from 'pixi.js';
import type { TraceNodeData, StepUI, TraceEdgeData } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { getPhaseIconPath } from '../../../config/icons.js';
import { COLLAPSED_NODE_SCALE } from '../../../config/constants.js';
import {
  createNode,
  addElementsToLayer,
  populateElementMap,
  type HoverPayload,
  type CreateElementConfig,
  type HoverCallbackConfig,
  type StepSelectionPayload,
} from './utils.js';

interface StepCreatorCallbacks {
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
  onStepSelect: (stepId: string, graphNode: GraphNode, payload: StepSelectionPayload) => void;
  getSelectedElementId: () => string | null;
}

interface StepCreatorDeps {
  container: HTMLElement;
  stepNodeLayer: Container;
  graphScale: number;
  ticker: Ticker;
  callbacks: StepCreatorCallbacks;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  yOffset?: number;
  workflowId?: string;
  stepPositions?: Map<string, number>;
}

/**
 * Builds the unified element config from step creator deps.
 */
const buildElementConfig = (
  deps: StepCreatorDeps,
  stepNodeMap: Map<string, GraphNode>
): CreateElementConfig => {
  const hoverConfig: HoverCallbackConfig = {
    container: deps.container,
    getSelectedNodeId: deps.callbacks.getSelectedElementId,
    setNodeAlpha: deps.setNodeAlpha,
    onHover: deps.callbacks.onHover,
    onHoverEnd: deps.callbacks.onHoverEnd,
    onStepSelect: deps.callbacks.onStepSelect,
  };

  return {
    graphScale: deps.graphScale,
    ticker: deps.ticker,
    hoverConfig,
    nodeMap: stepNodeMap,
  };
};

/**
 * Recalculates step bounds based on the positioned nodes within each step.
 */
export const recalculateStepBounds = (
  steps: StepUI[],
  nodeMap: Map<string, GraphNode>,
  graphScale: number
): void => {
  const stepPadding = 0.04 * graphScale;

  for (const step of steps) {
    let minX = Infinity;
    let maxX = -Infinity;

    nodeMap.forEach((node) => {
      if (node.nodeData.step === step.id) {
        const halfW = node.nodeWidth / 2;
        minX = Math.min(minX, node.position.x - halfW);
        maxX = Math.max(maxX, node.position.x + halfW);
      }
    });

    if (minX !== Infinity) {
      step.xStart = (minX - stepPadding) / graphScale + 0.5;
      step.xEnd = (maxX + stepPadding) / graphScale + 0.5;
    }
  }
};

/**
 * Creates step nodes (collapsed view representation).
 */
export const createStepNodes = async (
  steps: StepUI[],
  nodes: TraceNodeData[],
  edges: TraceEdgeData[],
  stepNodeMap: Map<string, GraphNode>,
  deps: StepCreatorDeps
): Promise<void> => {
  const config = buildElementConfig(deps, stepNodeMap);
  const { hoverConfig, nodeMap } = config;
  const yOffset = deps.yOffset ?? 0;
  const workflowPrefix = deps.workflowId ? `${deps.workflowId}-` : '';
  const { stepPositions } = deps;

  const elements = await Promise.all(
    steps.map((step) => {
      const stepNodes = nodes.filter((n) => n.step === step.id);
      const nodeId = `${workflowPrefix}step-${step.id}`;
      // Use shared step positions for alignment, fallback to local bounds
      const stepX = stepPositions?.get(step.id) ?? (step.xStart + step.xEnd) / 2;
      const stepNodeData: TraceNodeData = {
        id: nodeId,
        label: step.label,
        nodeType: 'workflow',
        shape: 'circle',
        step: step.id,
        phase: step.phase,
        x: stepX,
        y: 0.5 + yOffset,
      };

      const stepSelectionPayload: StepSelectionPayload = {
        stepId: step.id,
        label: step.label,
        phase: step.phase,
        nodes: stepNodes,
        edges: edges.filter(
          (e) => stepNodes.some((n) => n.id === e.source) || stepNodes.some((n) => n.id === e.target)
        ),
      };

      return createNode({
        id: nodeId,
        data: stepNodeData,
        type: 'step',
        onClick: () => {
          const graphNode = nodeMap.get(nodeId);
          if (graphNode && hoverConfig.onStepSelect) {
            hoverConfig.onStepSelect(step.id, graphNode, stepSelectionPayload);
          }
        },
        scale: COLLAPSED_NODE_SCALE,
        renderOptions: {
          mode: 'simple',
          iconPath: getPhaseIconPath(step.phase),
          typeLabel: step.label,
        },
      }, config);
    })
  );

  addElementsToLayer(elements, deps.stepNodeLayer);
  populateElementMap(elements, stepNodeMap);
};

/**
 * Calculates info about the topmost node for step label positioning.
 */
export const calculateTopNodeInfo = (
  nodeMap: Map<string, GraphNode>
): { worldY: number; halfHeight: number } | null => {
  let minWorldY = Infinity;
  let halfHeight = 0;

  nodeMap.forEach((node) => {
    if (node.position.y < minWorldY) {
      minWorldY = node.position.y;
      halfHeight = node.nodeHeight / 2;
    }
  });

  return minWorldY === Infinity ? null : { worldY: minWorldY, halfHeight };
};

/**
 * Calculates info about the bottommost node for viewport bounds.
 */
export const calculateBottomNodeInfo = (
  nodeMap: Map<string, GraphNode>
): { worldY: number; halfHeight: number } | null => {
  let maxWorldY = -Infinity;
  let halfHeight = 0;

  nodeMap.forEach((node) => {
    if (node.position.y > maxWorldY) {
      maxWorldY = node.position.y;
      halfHeight = node.nodeHeight / 2;
    }
  });

  return maxWorldY === -Infinity ? null : { worldY: maxWorldY, halfHeight };
};
