/**
 * Unified graph layout utilities.
 * Provides atomic functions for element creation, layer management, and map population.
 */
import type { Container, Ticker } from 'pixi.js';
import type { TraceNodeData, StepUI, TraceEdgeData } from '../../../config/types.js';
import { createGraphNode, type GraphNode, DEFAULT_NODE_ALPHA, type NodeRenderOptions } from '../rendering/nodeRenderer.js';
import { createIconNode } from '../rendering/iconNodeRenderer.js';
import { getIconNodeConfig, getPhaseIconPath } from '../../../config/icons.js';
import { WORKFLOW_NODE_SCALE } from '../../../config/constants.js';
import { selectNode, selectStep } from '../../../stores/traceState.js';

export type ElementType = 'step' | 'node';

export interface GraphElement {
  id: string;
  type: ElementType;
  data: TraceNodeData;
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
  node: TraceNodeData,
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
 * Creates a step element for the collapsed view.
 */
export const createStepElement = (
  step: StepUI,
  nodes: TraceNodeData[],
  edges: TraceEdgeData[],
  config: CreateElementConfig
): GraphElement => {
  const { graphScale, ticker, selectionLayer, hoverConfig } = config;

  const stepNodes = nodes.filter((n) => n.step === step.id);
  const stepNodeData: TraceNodeData = {
    id: `step-${step.id}`,
    label: step.label,
    nodeType: 'workflow',
    shape: 'circle',
    step: step.id,
    phase: step.phase,
    x: (step.xStart + step.xEnd) / 2,
    y: 0.5,
  };

  const phaseIconPath = getPhaseIconPath(step.phase);
  const stepRenderOptions: NodeRenderOptions = {
    mode: 'simple',
    iconPath: phaseIconPath,
    typeLabel: step.label,
  };

  // Create a reference object so callbacks can access the node after creation
  const nodeRef: { current: GraphNode | null } = { current: null };

  const nodeCallbacks = {
    onClick: () => {
      const stepEdges = edges.filter(
        (e) => stepNodes.some((n) => n.id === e.source) || stepNodes.some((n) => n.id === e.target)
      );
      selectStep({ stepId: step.id, label: step.label, phase: step.phase, nodes: stepNodes, edges: stepEdges });
    },
    onHover: () => {
      hoverConfig.container.style.cursor = 'pointer';
      const stepNode = nodeRef.current;
      if (stepNode) {
        const bounds = stepNode.getBounds();
        hoverConfig.onHover({
          title: step.label,
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

  const stepGraphNode = createGraphNode(stepNodeData, graphScale, ticker, nodeCallbacks, {
    scale: WORKFLOW_NODE_SCALE,
    renderOptions: stepRenderOptions,
    selectionLayer,
  });
  nodeRef.current = stepGraphNode;

  return createGraphElement(step.id, 'step', stepNodeData, stepGraphNode);
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
  data: TraceNodeData,
  graphNode: GraphNode
): GraphElement => ({
  id,
  type,
  data,
  graphNode,
});
