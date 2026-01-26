/**
 * View-aware node accessor. Returns active nodes based on LOD state.
 * Reads isCollapsed directly from traceState store.
 */
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { traceState } from '../../../stores/traceState.svelte.js';

export interface NodeAccessor {
  getActiveMap: () => Map<string, GraphNode>;
  getAny: (id: string) => GraphNode | undefined;
  isCollapsed: () => boolean;
}

export interface NodeAccessorDeps {
  nodeMap: Map<string, GraphNode>;
  stepNodeMap: Map<string, GraphNode>;
}

export const createNodeAccessor = (deps: NodeAccessorDeps): NodeAccessor => {
  const { nodeMap, stepNodeMap } = deps;

  return {
    getActiveMap: () => traceState.isCollapsed ? stepNodeMap : nodeMap,
    getAny: (id) => nodeMap.get(id) ?? stepNodeMap.get(id),
    isCollapsed: () => traceState.isCollapsed,
  };
};
