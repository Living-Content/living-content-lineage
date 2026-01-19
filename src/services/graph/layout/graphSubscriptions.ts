/**
 * Store subscription management for graph controller.
 * Consolidates reactive store subscriptions into a single module.
 */
import { Container } from 'pixi.js';
import { selection, type SelectionTarget } from '../../../stores/lineageState.js';
import { isDetailOpen, phaseFilter } from '../../../stores/uiState.js';
import type { LineageEdgeData, Phase, Workflow } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { renderEdges } from '../rendering/edgeRenderer.js';
import {
  applySelectionHighlight,
  applyPhaseFilter,
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
  setWorkflowLabelsPhaseFilter: (phase: Phase | null) => void;
  setWorkflowLabelsVisible: (visible: boolean) => void;
  zoomToBounds: (nodeId?: string) => void;
}

interface SelectionState {
  currentSelection: SelectionTarget;
  detailPanelOpen: boolean;
  currentPhaseFilter: Phase | null;
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
    currentPhaseFilter: null,
  };

  const shouldUseBlur = (): boolean =>
    state.detailPanelOpen || state.currentPhaseFilter !== null;

  const getHighlighterDeps = (useBlur: boolean = false): SelectionHighlighterDeps => ({
    nodeMap: ctx.nodeMap,
    workflowNodeMap: ctx.workflowNodeMap,
    edgeLayer: ctx.edgeLayer,
    workflowEdgeLayer: ctx.workflowEdgeLayer,
    edges: ctx.edges,
    workflows: ctx.workflows,
    verticalAdjacency: ctx.verticalAdjacency,
    setNodeAlpha: ctx.setNodeAlpha,
    useBlur,
  });

  const unsubscribeSelection = selection.subscribe((sel) => {
    state.currentSelection = sel;

    if (sel) {
      applySelectionHighlight(sel, getHighlighterDeps(shouldUseBlur()));

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
    const wasOpen = state.detailPanelOpen;
    state.detailPanelOpen = open;

    // Hide workflow labels when entering detail view, show when exiting
    ctx.setWorkflowLabelsVisible(!open);

    // Re-apply selection highlighting when detail panel toggles (to toggle blur mode)
    if (state.currentSelection && wasOpen !== open) {
      applySelectionHighlight(state.currentSelection, getHighlighterDeps(shouldUseBlur()));
    }

    if (open && state.currentSelection?.type === 'node') {
      ctx.centerSelectedNode(state.currentSelection.nodeId);
    } else if (!open && wasOpen) {
      // Zoom out to bounds when exiting detail view, centered on selected node
      const nodeId = state.currentSelection?.type === 'node' ? state.currentSelection.nodeId : undefined;
      ctx.zoomToBounds(nodeId);
    }
  });

  const unsubscribePhaseFilter = phaseFilter.subscribe((phase) => {
    state.currentPhaseFilter = phase;
    ctx.setWorkflowLabelsPhaseFilter(phase);

    if (phase) {
      // Phase filter always uses blur
      applyPhaseFilter(phase, getHighlighterDeps(true));
    } else if (state.currentSelection) {
      // Restore selection highlighting when phase filter is cleared
      applySelectionHighlight(state.currentSelection, getHighlighterDeps(shouldUseBlur()));
    } else {
      // No filter and no selection - clear all visual effects
      applyPhaseFilter(null, getHighlighterDeps());
    }
  });

  return {
    unsubscribe: () => {
      unsubscribeSelection();
      unsubscribeDetail();
      unsubscribePhaseFilter();
    },
    state,
  };
}
