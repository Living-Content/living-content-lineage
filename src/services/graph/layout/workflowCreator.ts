/**
 * Workflow node creation and bounds calculation.
 */
import type { Ticker, Container } from 'pixi.js';
import type { LineageNodeData, Workflow, LineageEdgeData } from '../../../config/types.js';
import { createGraphNode, type GraphNode, type NodeRenderOptions } from '../rendering/nodeRenderer.js';
import { PHASE_ICON_PATHS } from '../../../theme/theme.js';
import { WORKFLOW_NODE_SCALE } from '../../../config/constants.js';
import { selectWorkflow } from '../../../stores/lineageState.js';

interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

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
  const { container, workflowNodeLayer, selectionLayer, graphScale, ticker, callbacks } = deps;

  for (const workflow of workflows) {
    const workflowNodes = nodes.filter((n) => n.workflowId === workflow.id);
    const workflowNodeData: LineageNodeData = {
      id: `workflow-${workflow.id}`,
      label: workflow.label,
      nodeType: 'workflow',
      shape: 'circle',
      workflowId: workflow.id,
      phase: workflow.phase,
      x: (workflow.xStart + workflow.xEnd) / 2,
      y: 0.5,
    };

    const phaseIconPath = workflow.phase ? PHASE_ICON_PATHS[workflow.phase] : PHASE_ICON_PATHS.Reasoning;
    const workflowRenderOptions: NodeRenderOptions = {
      mode: 'simple',
      iconPath: phaseIconPath,
      typeLabel: workflow.label,
    };

    const workflowNode = createGraphNode(workflowNodeData, graphScale, ticker, {
      onClick: () => {
        const workflowEdges = edges.filter(
          (e) => workflowNodes.some((n) => n.id === e.source) || workflowNodes.some((n) => n.id === e.target)
        );
        selectWorkflow({ workflowId: workflow.id, label: workflow.label, nodes: workflowNodes, edges: workflowEdges });
      },
      onHover: () => {
        container.style.cursor = 'pointer';
        const bounds = workflowNode.getBounds();
        callbacks.onHover({
          title: workflow.label,
          nodeType: 'workflow',
          screenX: bounds.x + bounds.width / 2,
          screenY: bounds.y,
          size: 40,
        });
      },
      onHoverEnd: () => {
        container.style.cursor = 'grab';
        callbacks.onHoverEnd();
      },
    }, { scale: WORKFLOW_NODE_SCALE, renderOptions: workflowRenderOptions, selectionLayer });

    workflowNodeLayer.addChild(workflowNode);
    workflowNodeMap.set(workflow.id, workflowNode);
  }
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
