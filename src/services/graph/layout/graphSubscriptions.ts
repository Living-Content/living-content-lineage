/**
 * Store subscription management for graph controller.
 * Consolidates reactive store subscriptions into a single module.
 */
import { Container } from 'pixi.js';
import { selectedNode, selectedWorkflow } from '../../../stores/lineageState.js';
import { isDetailOpen } from '../../../stores/uiState.js';
import type { LineageEdgeData, Workflow } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { renderEdges } from '../rendering/edgeRenderer.js';
import {
  applySelectionHighlight,
  applyWorkflowSelectionHighlight,
  clearSelectionVisuals,
  type SelectionHighlighterDeps,
  type VerticalAdjacencyMap,
} from '../interaction/selectionHighlighter.js';

export interface SubscriptionContext {
  nodeMap: Map<string, GraphNode>;
  workflowNodeMap: Map<string, GraphNode>;
  edgeLayer: Container;
  dotLayer: Container;
  workflowEdgeLayer: Container;
  edges: LineageEdgeData[];
  workflows: Workflow[];
  verticalAdjacency: VerticalAdjacencyMap;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  centerSelectedNode: (nodeId: string) => void;
}

interface SelectionState {
  selectedNodeId: string | null;
  selectedWorkflowId: string | null;
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
    selectedNodeId: null,
    selectedWorkflowId: null,
    detailPanelOpen: false,
  };

  const getHighlighterDeps = (): SelectionHighlighterDeps => ({
    nodeMap: ctx.nodeMap,
    workflowNodeMap: ctx.workflowNodeMap,
    edgeLayer: ctx.edgeLayer,
    dotLayer: ctx.dotLayer,
    workflowEdgeLayer: ctx.workflowEdgeLayer,
    edges: ctx.edges,
    workflows: ctx.workflows,
    verticalAdjacency: ctx.verticalAdjacency,
    setNodeAlpha: ctx.setNodeAlpha,
  });

  const unsubscribeNode = selectedNode.subscribe((node) => {
    state.selectedNodeId = node?.id ?? null;
    if (node) {
      ctx.workflowNodeMap.forEach((n) => n.setSelected(false));
      applySelectionHighlight(node.id, getHighlighterDeps());
      if (state.detailPanelOpen) ctx.centerSelectedNode(node.id);
    } else if (!state.selectedWorkflowId) {
      clearSelectionVisuals(getHighlighterDeps());
    }
  });

  const unsubscribeWorkflow = selectedWorkflow.subscribe((workflow) => {
    state.selectedWorkflowId = workflow?.workflowId ?? null;
    if (workflow) {
      applyWorkflowSelectionHighlight(workflow.workflowId, getHighlighterDeps());
      renderEdges(ctx.edgeLayer, ctx.dotLayer, ctx.edges, ctx.nodeMap, null, null);
    } else if (!state.selectedNodeId) {
      clearSelectionVisuals(getHighlighterDeps());
    }
  });

  const unsubscribeDetail = isDetailOpen.subscribe((open) => {
    state.detailPanelOpen = open;
    if (open && state.selectedNodeId) ctx.centerSelectedNode(state.selectedNodeId);
  });

  return {
    unsubscribe: () => {
      unsubscribeNode();
      unsubscribeWorkflow();
      unsubscribeDetail();
    },
    state,
  };
}
