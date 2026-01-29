/**
 * Unified graph layout utilities.
 * Provides atomic functions for element creation, layer management, and map population.
 */
import type { Container, Ticker } from 'pixi.js';
import type { TraceNodeData, TraceEdgeData, Phase } from '../../../config/types.js';
import { createGraphNode, type GraphNode, type NodeRenderOptions } from '../rendering/nodeRenderer.js';
import { createIconNode } from '../rendering/iconNodeRenderer.js';
import { getIconNodeConfig } from '../../../config/icons.js';
import { getCssVarFloat } from '../../../themes/theme.js';

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
 * Step selection data passed to onStepSelect callback.
 */
export interface StepSelectionPayload {
  stepId: string;
  label: string;
  phase: Phase;
  nodes: TraceNodeData[];
  edges: TraceEdgeData[];
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
  onNodeClick?: (node: TraceNodeData) => void;
  onStepSelect?: (stepId: string, graphNode: GraphNode, payload: StepSelectionPayload) => void;
}

/**
 * Configuration for creating graph elements.
 */
export interface CreateElementConfig {
  graphScale: number;
  ticker: Ticker;
  hoverConfig: HoverCallbackConfig;
  nodeMap: Map<string, GraphNode>;
  stepWidths?: Map<number, number>;
}

/**
 * Configuration for creating a unified node.
 */
export interface CreateNodeConfig {
  id: string;
  data: TraceNodeData;
  type: ElementType;
  onClick: () => void;
  scale?: number;
  renderOptions?: NodeRenderOptions;
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
      // Always brighten on hover - animation controller looks up node by ID
      if (config.setNodeAlpha) {
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
      if (config.setNodeAlpha) {
        const selectedId = config.getSelectedNodeId();
        if (selectedId === nodeId) {
          config.setNodeAlpha(nodeId, getCssVarFloat('--node-hover-alpha'));
        } else {
          config.setNodeAlpha(nodeId, getCssVarFloat('--node-alpha'));
        }
      }
      config.onHoverEnd();
    },
  };
};

/**
 * Unified node creation function.
 * ALL nodes go through this function. The only differences are the config values.
 * Hover behavior, click handling, everything else is identical.
 */
export const createNode = async (
  config: CreateNodeConfig,
  deps: CreateElementConfig
): Promise<GraphElement> => {
  const { id, data, type, onClick, scale, renderOptions } = config;
  const { graphScale, ticker, hoverConfig, nodeMap, stepWidths } = deps;

  const iconConfig = getIconNodeConfig(data.nodeType);
  const getIconSize = () => iconConfig?.size ?? 28;

  const hoverCallbacks = createHoverCallbacks(
    id,
    () => nodeMap.get(id),
    getIconSize,
    hoverConfig
  );

  const callbacks = { onClick, ...hoverCallbacks };

  const graphNode = iconConfig
    ? await createIconNode(data, graphScale, ticker, callbacks, {
        iconPath: iconConfig.iconPath,
        size: iconConfig.size,
      })
    : createGraphNode(data, graphScale, ticker, callbacks, { scale, renderOptions, stepWidths });

  return createGraphElement(id, type, data, graphNode);
};

/**
 * Adds graph elements to a layer container.
 * This is an atomic operation that only adds children to the layer.
 */
export const addElementsToContainer = (
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
