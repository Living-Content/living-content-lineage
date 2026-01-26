/**
 * View-aware node accessor. Returns active nodes based on LOD state.
 */
import type { GraphNode } from '../rendering/nodeRenderer.js';

export interface NodeAccessor {
  getActiveMap: () => Map<string, GraphNode>;
  getAny: (id: string) => GraphNode | undefined;
  isCollapsed: () => boolean;
}

export interface NodeAccessorDeps {
  nodeMap: Map<string, GraphNode>;
  stepNodeMap: Map<string, GraphNode>;
  isCollapsed: () => boolean;
}

export const createNodeAccessor = (deps: NodeAccessorDeps): NodeAccessor => {
  const { nodeMap, stepNodeMap, isCollapsed } = deps;

  return {
    getActiveMap: () => isCollapsed() ? stepNodeMap : nodeMap,
    getAny: (id) => nodeMap.get(id) ?? stepNodeMap.get(id),
    isCollapsed,
  };
};
