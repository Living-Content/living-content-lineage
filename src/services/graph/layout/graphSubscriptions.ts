/**
 * Store subscription management for graph controller.
 * Consolidates reactive store subscriptions into a single module.
 */
import { Container } from 'pixi.js';
import { selection, type SelectionTarget } from '../../../stores/lineageState.js';
import { isDetailOpen } from '../../../stores/uiState.js';
import type { LineageEdgeData, Workflow } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { renderEdges } from '../rendering/edgeRenderer.js';
import {
  applySelectionHighlight,
  clearSelectionVisuals,
  type SelectionHighlighterDeps,
  type VerticalAdjacencyMap,
} from '../interaction/selectionHighlighter.js';

export interface SubscriptionContext {
  nodeMap: Map<string, GraphNode>;
  workflowNodeMap: Map<string, GraphNode>;
  edgeLayer: Container;
  workflowEdgeLayer: Container;
  edges: LineageEdgeData[];
  workflows: Workflow[];
  verticalAdjacency: VerticalAdjacencyMap;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  centerSelectedNode: (nodeId: string) => void;
}

interface SelectionState {
  currentSelection: SelectionTarget;
  detailPanelOpen: boolean;
}

/**
 * Creates store subscriptions for graph state management.
 * Returns a combined unsubscribe function.
 */
export function createStoreSubscriptions(ctx: SubscriptionContext): {
  unsubscribe: () => void;
  state: SelectionState;
} {
  const state: SelectionState = {
    currentSelection: null,
    detailPanelOpen: false,
  };

  const getHighlighterDeps = (): SelectionHighlighterDeps => ({
    nodeMap: ctx.nodeMap,
    workflowNodeMap: ctx.workflowNodeMap,
    edgeLayer: ctx.edgeLayer,
    workflowEdgeLayer: ctx.workflowEdgeLayer,
    edges: ctx.edges,
    workflows: ctx.workflows,
    verticalAdjacency: ctx.verticalAdjacency,
    setNodeAlpha: ctx.setNodeAlpha,
  });

  const unsubscribeSelection = selection.subscribe((sel) => {
    state.currentSelection = sel;
    if (sel) {
      applySelectionHighlight(sel, getHighlighterDeps());

      // When a node is selected and detail panel is open, center on it
      if (sel.type === 'node' && state.detailPanelOpen) {
        ctx.centerSelectedNode(sel.nodeId);
      }

      // When a workflow is selected, render edges with no node selection
      if (sel.type === 'workflow') {
        renderEdges(ctx.edgeLayer, ctx.edges, ctx.nodeMap, {
          view: 'workflow',
          selectedId: null,
          highlightedIds: null,
        });
      }
    } else {
      clearSelectionVisuals(getHighlighterDeps());
    }
  });

  const unsubscribeDetail = isDetailOpen.subscribe((open) => {
    state.detailPanelOpen = open;
    if (open && state.currentSelection?.type === 'node') {
      ctx.centerSelectedNode(state.currentSelection.nodeId);
    }
  });

  return {
    unsubscribe: () => {
      unsubscribeSelection();
      unsubscribeDetail();
    },
    state,
  };
}
