/**
 * Store subscription management for graph controller using Svelte 5 effects.
 */
import { Container } from 'pixi.js';
import { traceState, type SelectionTarget } from '../../../stores/traceState.svelte.js';
import { uiState } from '../../../stores/uiState.svelte.js';
import type { TraceEdgeData, Phase, StepUI } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { renderEdges } from '../rendering/edgeRenderer.js';
import {
  applySelectionHighlight,
  applyPhaseFilter,
  clearSelectionVisuals,
  type SelectionHighlighterDeps,
} from '../interaction/selectionHighlighter.js';

export interface SubscriptionContext {
  nodeMap: Map<string, GraphNode>;
  stepNodeMap: Map<string, GraphNode>;
  edgeLayer: Container;
  stepEdgeLayer: Container;
  edges: TraceEdgeData[];
  steps: StepUI[];
  setNodeAlpha: (nodeId: string, alpha: number) => void;
  centerSelectedNode: (nodeId: string) => void;
  setStepLabelsPhaseFilter: (phase: Phase | null) => void;
  setStepLabelsVisible: (visible: boolean) => void;
  zoomToBounds: (nodeId?: string, options?: { onComplete?: () => void }) => void;
  updateOverlayNode: () => void;
  onStateChange: (state: SelectionState) => void;
}

export interface SelectionState {
  currentSelection: SelectionTarget;
  detailPanelOpen: boolean;
  currentPhaseFilter: Phase | null;
}

/**
 * Creates reactive store subscriptions using $effect.
 * Returns a destroy function to clean up effects.
 */
export function createStoreSubscriptions(ctx: SubscriptionContext): {
  destroy: () => void;
} {
  let destroyed = false;

  const shouldUseBlur = (): boolean =>
    uiState.isDetailOpen || uiState.phaseFilter !== null;

  const getHighlighterDeps = (useBlur: boolean = false): SelectionHighlighterDeps => ({
    nodeMap: ctx.nodeMap,
    stepNodeMap: ctx.stepNodeMap,
    edgeLayer: ctx.edgeLayer,
    stepEdgeLayer: ctx.stepEdgeLayer,
    edges: ctx.edges,
    steps: ctx.steps,
    setNodeAlpha: ctx.setNodeAlpha,
    useBlur,
  });

  // Track previous values for change detection
  let prevSelection: SelectionTarget = null;
  let prevDetailOpen = false;
  let prevPhaseFilter: Phase | null = null;

  // Polling interval for reactivity (since we can't use $effect outside component context)
  const pollInterval = setInterval(() => {
    if (destroyed) return;

    const sel = traceState.selection;
    const detailOpen = uiState.isDetailOpen;
    const phase = uiState.phaseFilter;

    // Notify parent of state changes
    ctx.onStateChange({
      currentSelection: sel,
      detailPanelOpen: detailOpen,
      currentPhaseFilter: phase,
    });

    // Handle selection changes
    if (sel !== prevSelection) {
      prevSelection = sel;

      if (sel) {
        applySelectionHighlight(sel, getHighlighterDeps(shouldUseBlur()));

        if (sel.type === 'node' && detailOpen && !traceState.isExpanded) {
          ctx.centerSelectedNode(sel.nodeId);
        }

        if (sel.type === 'step') {
          renderEdges(ctx.edgeLayer, ctx.edges, ctx.nodeMap, {
            view: 'workflow',
            selectedId: null,
          });
        }
      } else {
        clearSelectionVisuals(getHighlighterDeps());
      }
    }

    // Handle detail panel changes
    if (detailOpen !== prevDetailOpen) {
      const wasOpen = prevDetailOpen;
      prevDetailOpen = detailOpen;

      ctx.setStepLabelsVisible(!detailOpen);

      if (sel && wasOpen !== detailOpen) {
        applySelectionHighlight(sel, getHighlighterDeps(shouldUseBlur()));
      }

      if (detailOpen && sel?.type === 'node') {
        ctx.centerSelectedNode(sel.nodeId);
      } else if (!detailOpen && wasOpen) {
        const nodeId = sel?.type === 'node' ? sel.nodeId : undefined;
        ctx.zoomToBounds(nodeId, {
          onComplete: () => ctx.updateOverlayNode(),
        });
      }
    }

    // Handle phase filter changes
    if (phase !== prevPhaseFilter) {
      prevPhaseFilter = phase;
      ctx.setStepLabelsPhaseFilter(phase);

      if (phase) {
        applyPhaseFilter(phase, getHighlighterDeps(true));
      } else if (sel) {
        applySelectionHighlight(sel, getHighlighterDeps(shouldUseBlur()));
      } else {
        applyPhaseFilter(null, getHighlighterDeps());
      }
    }
  }, 16); // ~60fps polling

  return {
    destroy: () => {
      destroyed = true;
      clearInterval(pollInterval);
    },
  };
}
