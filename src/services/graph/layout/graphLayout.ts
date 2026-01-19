/**
 * Unified graph layout utilities.
 * Provides atomic functions for element creation, layer management, and map population.
 */
import type { Container, Ticker } from 'pixi.js';
import type { LineageNodeData, Workflow, LineageEdgeData } from '../../../config/types.js';
import { createGraphNode, type GraphNode, DEFAULT_NODE_ALPHA, type NodeRenderOptions } from '../rendering/nodeRenderer.js';
import { createIconNode } from '../rendering/iconNodeRenderer.js';
import { getIconNodeConfig, getPhaseIconPath } from '../../../theme/theme.js';
import { WORKFLOW_NODE_SCALE } from '../../../config/constants.js';
import { selectNode, selectWorkflow } from '../../../stores/lineageState.js';

export type ElementType = 'workflow' | 'node';

export interface GraphElement {
  id: string;
  type: ElementType;
  data: LineageNodeData;
  graphNode: GraphNode;
}

/**
 * Payload passed to hover callbacks with position and metadata.
 */
export interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

/**
 * Configuration for creating hover callbacks.
 */
export interface HoverCallbackConfig {
  container: HTMLElement;
  getSelectedNodeId: () => string | null;
  setNodeAlpha?: (nodeId: string, alpha: number) => void;
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
}

/**
 * Configuration for creating graph elements.
 */
export interface CreateElementConfig {
  graphScale: number;
  ticker: Ticker;
  selectionLayer: Container;
  hoverConfig: HoverCallbackConfig;
  nodeMap: Map<string, GraphNode>;
}

/**
 * Creates hover callbacks for a node or workflow element.
 */
export const createHoverCallbacks = (
  nodeId: string,
  getGraphNode: () => GraphNode | undefined,
  getIconSize: () => number,
  config: HoverCallbackConfig
): { onHover: () => void; onHoverEnd: () => void } => {
  return {
    onHover: () => {
      config.container.style.cursor = 'pointer';
      if (!config.getSelectedNodeId() && config.setNodeAlpha) {
        config.setNodeAlpha(nodeId, 1);
      }
      const renderedNode = getGraphNode();
      if (renderedNode) {
        const bounds = renderedNode.getBounds();
        config.onHover({
          title: renderedNode.nodeData.title ?? renderedNode.nodeData.label,
          nodeType: renderedNode.nodeData.nodeType,
          screenX: bounds.x + bounds.width / 2,
          screenY: bounds.y,
          size: getIconSize(),
        });
      }
    },
    onHoverEnd: () => {
      config.container.style.cursor = 'grab';
      if (!config.getSelectedNodeId() && config.setNodeAlpha) {
        config.setNodeAlpha(nodeId, DEFAULT_NODE_ALPHA);
      }
      config.onHoverEnd();
    },
  };
};

/**
 * Creates a node element with appropriate rendering (icon or standard).
 */
export const createNodeElement = async (
  node: LineageNodeData,
  config: CreateElementConfig
): Promise<GraphElement> => {
  const { graphScale, ticker, selectionLayer, hoverConfig, nodeMap } = config;

  const iconConfig = getIconNodeConfig(node.nodeType);
  const getIconSize = () => iconConfig?.size ?? 28;

  const hoverCallbacks = createHoverCallbacks(
    node.id,
    () => nodeMap.get(node.id),
    getIconSize,
    hoverConfig
  );

  const nodeCallbacks = {
    onClick: () => selectNode(node),
    ...hoverCallbacks,
  };

  let graphNode: GraphNode;

  if (iconConfig) {
    graphNode = await createIconNode(node, graphScale, ticker, nodeCallbacks, {
      iconPath: iconConfig.iconPath,
      size: iconConfig.size,
      selectionLayer,
    });
  } else {
    graphNode = createGraphNode(node, graphScale, ticker, nodeCallbacks, { selectionLayer });
  }

  return createGraphElement(node.id, 'node', node, graphNode);
};

/**
 * Creates a workflow element for the collapsed view.
 */
export const createWorkflowElement = (
  workflow: Workflow,
  nodes: LineageNodeData[],
  edges: LineageEdgeData[],
  config: CreateElementConfig
): GraphElement => {
  const { graphScale, ticker, selectionLayer, hoverConfig } = config;

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

  const phaseIconPath = getPhaseIconPath(workflow.phase);
  const workflowRenderOptions: NodeRenderOptions = {
    mode: 'simple',
    iconPath: phaseIconPath,
    typeLabel: workflow.label,
  };

  // Create a reference object so callbacks can access the node after creation
  const nodeRef: { current: GraphNode | null } = { current: null };

  const nodeCallbacks = {
    onClick: () => {
      const workflowEdges = edges.filter(
        (e) => workflowNodes.some((n) => n.id === e.source) || workflowNodes.some((n) => n.id === e.target)
      );
      selectWorkflow({ workflowId: workflow.id, label: workflow.label, nodes: workflowNodes, edges: workflowEdges });
    },
    onHover: () => {
      hoverConfig.container.style.cursor = 'pointer';
      const workflowNode = nodeRef.current;
      if (workflowNode) {
        const bounds = workflowNode.getBounds();
        hoverConfig.onHover({
          title: workflow.label,
          nodeType: 'workflow',
          screenX: bounds.x + bounds.width / 2,
          screenY: bounds.y,
          size: 40,
        });
      }
    },
    onHoverEnd: () => {
      hoverConfig.container.style.cursor = 'grab';
      hoverConfig.onHoverEnd();
    },
  };

  const workflowNode = createGraphNode(workflowNodeData, graphScale, ticker, nodeCallbacks, {
    scale: WORKFLOW_NODE_SCALE,
    renderOptions: workflowRenderOptions,
    selectionLayer,
  });
  nodeRef.current = workflowNode;

  return createGraphElement(workflow.id, 'workflow', workflowNodeData, workflowNode);
};

/**
 * Adds graph elements to a layer container.
 * This is an atomic operation that only adds children to the layer.
 */
export const addElementsToLayer = (
  elements: GraphElement[],
  layer: Container
): void => {
  for (const el of elements) {
    layer.addChild(el.graphNode);
  }
};

/**
 * Populates a map with graph elements.
 * This is an atomic operation that only updates the map.
 */
export const populateElementMap = (
  elements: GraphElement[],
  map: Map<string, GraphNode>
): void => {
  for (const el of elements) {
    map.set(el.id, el.graphNode);
  }
};

/**
 * Adds a single element to a layer.
 * Atomic operation for single element addition.
 */
export const addElementToLayer = (
  element: GraphElement,
  layer: Container
): void => {
  layer.addChild(element.graphNode);
};

/**
 * Adds a single element to a map.
 * Atomic operation for single element map population.
 */
export const addElementToMap = (
  element: GraphElement,
  map: Map<string, GraphNode>
): void => {
  map.set(element.id, element.graphNode);
};

/**
 * Creates a graph element wrapper.
 * Helper for wrapping a GraphNode with metadata.
 */
export const createGraphElement = (
  id: string,
  type: ElementType,
  data: LineageNodeData,
  graphNode: GraphNode
): GraphElement => ({
  id,
  type,
  data,
  graphNode,
});
