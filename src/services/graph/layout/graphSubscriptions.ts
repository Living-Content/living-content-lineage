/**
 * Store subscription management for graph controller.
 * Consolidates reactive store subscriptions into a single module.
 */
import { Container } from 'pixi.js';
import { selectedNode, selectedStage } from '../../../stores/lineageState.js';
import { isDetailOpen } from '../../../stores/uiState.js';
import type { LineageEdgeData, Stage } from '../../../config/types.js';
import type { PillNode } from '../rendering/nodeRenderer.js';
import { renderEdges } from '../rendering/edgeRenderer.js';
import {
  applySelectionHighlight,
  applyStageSelectionHighlight,
  clearSelectionVisuals,
  type SelectionHighlighterDeps,
  type VerticalAdjacencyMap,
} from '../interaction/selectionHighlighter.js';

export interface SubscriptionContext {
  nodeMap: Map<string, PillNode>;
  stageNodeMap: Map<string, PillNode>;
  edgeLayer: Container;
  dotLayer: Container;
  stageEdgeLayer: Container;
  edges: LineageEdgeData[];
  stages: Stage[];
  verticalAdjacency: VerticalAdjacencyMap;
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  centerSelectedNode: (nodeId: string) => void;
}

interface SelectionState {
  selectedNodeId: string | null;
  selectedStageId: string | null;
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
    selectedStageId: null,
    detailPanelOpen: false,
  };

  const getHighlighterDeps = (): SelectionHighlighterDeps => ({
    nodeMap: ctx.nodeMap,
    stageNodeMap: ctx.stageNodeMap,
    edgeLayer: ctx.edgeLayer,
    dotLayer: ctx.dotLayer,
    stageEdgeLayer: ctx.stageEdgeLayer,
    edges: ctx.edges,
    stages: ctx.stages,
    verticalAdjacency: ctx.verticalAdjacency,
    setNodeAlpha: ctx.setNodeAlpha,
  });

  const unsubscribeNode = selectedNode.subscribe((node) => {
    state.selectedNodeId = node?.id ?? null;
    if (node) {
      ctx.stageNodeMap.forEach((n) => n.setSelected(false));
      applySelectionHighlight(node.id, getHighlighterDeps());
      if (state.detailPanelOpen) ctx.centerSelectedNode(node.id);
    } else if (!state.selectedStageId) {
      clearSelectionVisuals(getHighlighterDeps());
    }
  });

  const unsubscribeStage = selectedStage.subscribe((stage) => {
    state.selectedStageId = stage?.stageId ?? null;
    if (stage) {
      applyStageSelectionHighlight(stage.stageId, getHighlighterDeps());
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
      unsubscribeStage();
      unsubscribeDetail();
    },
    state,
  };
}
