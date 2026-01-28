/**
 * Node accessor for graph operations.
 * Provides access to the active node map for the detail view.
 */
import type { GraphNode } from '../rendering/nodeRenderer.js';

export interface NodeAccessor {
  getActiveMap: () => Map<string, GraphNode>;
  getAny: (id: string) => GraphNode | undefined;
}

export interface NodeAccessorDeps {
  nodeMap: Map<string, GraphNode>;
}

export const createNodeAccessor = (deps: NodeAccessorDeps): NodeAccessor => {
  const { nodeMap } = deps;

  return {
    getActiveMap: () => nodeMap,
    getAny: (id) => nodeMap.get(id),
  };
};
