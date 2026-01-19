/**
 * Unified graph layout utilities.
 * Provides atomic functions for element creation, layer management, and map population.
 */
import type { Container } from 'pixi.js';
import type { LineageNodeData } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';

export type ElementType = 'workflow' | 'node';

export interface GraphElement {
  id: string;
  type: ElementType;
  data: LineageNodeData;
  graphNode: GraphNode;
}

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
