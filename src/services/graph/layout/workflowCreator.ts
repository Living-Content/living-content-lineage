/**
 * Workflow node creation and bounds calculation.
 */
import type { Ticker, Container } from 'pixi.js';
import type { LineageNodeData, Workflow, LineageEdgeData } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import {
  createWorkflowElement,
  addElementsToLayer,
  populateElementMap,
  type HoverPayload,
  type CreateElementConfig,
  type HoverCallbackConfig,
} from './graphLayout.js';

interface WorkflowCreatorCallbacks {
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
}

interface WorkflowCreatorDeps {
  container: HTMLElement;
  workflowNodeLayer: Container;
  selectionLayer: Container;
  graphScale: number;
  ticker: Ticker;
  callbacks: WorkflowCreatorCallbacks;
}

/**
 * Builds the unified element config from workflow creator deps.
 */
const buildElementConfig = (
  deps: WorkflowCreatorDeps,
  workflowNodeMap: Map<string, GraphNode>
): CreateElementConfig => {
  const hoverConfig: HoverCallbackConfig = {
    container: deps.container,
    getSelectedNodeId: () => null, // Workflow nodes don't have alpha changes on hover
    onHover: deps.callbacks.onHover,
    onHoverEnd: deps.callbacks.onHoverEnd,
  };

  return {
    graphScale: deps.graphScale,
    ticker: deps.ticker,
    selectionLayer: deps.selectionLayer,
    hoverConfig,
    nodeMap: workflowNodeMap,
  };
};

/**
 * Recalculates workflow bounds based on the positioned nodes within each workflow.
 */
export const recalculateWorkflowBounds = (
  workflows: Workflow[],
  nodeMap: Map<string, GraphNode>,
  graphScale: number
): void => {
  const workflowPadding = 0.04 * graphScale;

  for (const workflow of workflows) {
    let minX = Infinity;
    let maxX = -Infinity;

    nodeMap.forEach((node) => {
      if (node.nodeData.workflowId === workflow.id) {
        const halfW = node.nodeWidth / 2;
        minX = Math.min(minX, node.position.x - halfW);
        maxX = Math.max(maxX, node.position.x + halfW);
      }
    });

    if (minX !== Infinity) {
      workflow.xStart = (minX - workflowPadding) / graphScale + 0.5;
      workflow.xEnd = (maxX + workflowPadding) / graphScale + 0.5;
    }
  }
};

/**
 * Creates workflow nodes (collapsed view representation).
 */
export const createWorkflowNodes = (
  workflows: Workflow[],
  nodes: LineageNodeData[],
  edges: LineageEdgeData[],
  workflowNodeMap: Map<string, GraphNode>,
  deps: WorkflowCreatorDeps
): void => {
  const config = buildElementConfig(deps, workflowNodeMap);

  const elements = workflows.map((workflow) =>
    createWorkflowElement(workflow, nodes, edges, config)
  );

  addElementsToLayer(elements, deps.workflowNodeLayer);
  populateElementMap(elements, workflowNodeMap);
};

/**
 * Calculates info about the topmost node for workflow label positioning.
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
