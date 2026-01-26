/**
 * Transactional graph engine.
 * Batches state changes and flushes them once per microtask.
 *
 * IMPORTANT: This file must NOT import Svelte stores.
 * All state enters through explicit engine commands.
 * All events exit through explicit callbacks.
 */
import type { Phase, TraceEdgeData, StepUI } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { ViewportState } from '../interaction/viewport.js';
import type { ViewportManager } from '../layout/viewportManager.js';
import type { SelectionController } from '../interaction/selectionController.js';
import type { KeyboardNavigationController } from '../interaction/keyboardNavigation.js';
import type { LODController } from '../layout/lodController.js';
import type { NodeAccessor } from '../layout/nodeAccessor.js';
import type { PixiContext } from '../layout/pixiSetup.js';
import type { GraphEngine, SelectionTarget } from './interface.js';
import {
  applySelectionHighlight,
  applyPhaseFilter,
  clearSelection,
  type SelectionHighlighterDeps,
} from '../interaction/selectionHighlighter.js';
import { renderEdges } from '../rendering/edgeRenderer.js';

/**
 * Internal engine state.
 * Tracks current values for edge-triggered updates.
 */
export interface EngineState {
  selection: SelectionTarget;
  detailPanelOpen: boolean;
  phaseFilter: Phase | null;
  isExpanded: boolean;
}

/**
 * Pending transactional updates.
 * Batched and flushed once per microtask.
 */
interface PendingUpdates {
  selection: { next: SelectionTarget; prev: SelectionTarget } | null;
  phase: Phase | null | undefined;  // undefined = no change
  detailOpen: { open: boolean; wasOpen: boolean } | null;
}

/**
 * Dependencies for the transactional engine.
 */
export interface EngineDeps {
  pixi: PixiContext;
  nodeMap: Map<string, GraphNode>;
  stepNodeMap: Map<string, GraphNode>;
  edges: TraceEdgeData[];
  steps: StepUI[];
  nodeAccessor: NodeAccessor;
  viewportManager: ViewportManager;
  selectionController: SelectionController;
  keyboardNavigation: KeyboardNavigationController;
  lodController: LODController;
  viewportState: ViewportState;
  animationController: { setNodeAlpha: (nodeId: string, alpha: number) => void; cleanup: () => void };
  stepLabels: { setPhaseFilter: (phase: Phase | null) => void; setVisible: (visible: boolean) => void };
  titleOverlay: { destroy: () => void; setSecondaryVisible: (visible: boolean) => void };
  resizeHandler: { destroy: () => void };
  viewportHandlers: { destroy: () => void };
  state: EngineState;
}

/**
 * Creates the highlighter dependencies for selection/phase operations.
 */
const createHighlighterDeps = (
  deps: EngineDeps,
  useBlur: boolean
): SelectionHighlighterDeps => ({
  nodeMap: deps.nodeMap,
  stepNodeMap: deps.stepNodeMap,
  edgeLayer: deps.pixi.layers.edgeLayer,
  stepEdgeLayer: deps.pixi.layers.stepEdgeLayer,
  edges: deps.edges,
  steps: deps.steps,
  setNodeAlpha: deps.animationController.setNodeAlpha,
  useBlur,
});

/**
 * Casts our SelectionTarget to the highlighter's expected type.
 * Types match at runtime - this is a TypeScript-only bridge.
 */
const toHighlighterSelection = (sel: SelectionTarget): Parameters<typeof applySelectionHighlight>[0] =>
  sel as Parameters<typeof applySelectionHighlight>[0];

/**
 * Creates a transactional graph engine.
 * Batches state changes and flushes them once per microtask.
 */
export const createGraphEngine = (deps: EngineDeps): GraphEngine => {
  const pending: PendingUpdates = {
    selection: null,
    phase: undefined,
    detailOpen: null,
  };
  let flushScheduled = false;

  const shouldUseBlur = (): boolean =>
    deps.state.detailPanelOpen || deps.state.phaseFilter !== null;

  /**
   * Applies pending selection change.
   */
  const applySelectionChange = (next: SelectionTarget): void => {
    deps.state.selection = next;

    if (next) {
      applySelectionHighlight(toHighlighterSelection(next), createHighlighterDeps(deps, shouldUseBlur()));

      if (next.type === 'node' && deps.state.detailPanelOpen && !deps.state.isExpanded) {
        deps.viewportManager.centerOnNode(next.nodeId, { zoom: true });
      }

      if (next.type === 'step') {
        renderEdges(deps.pixi.layers.edgeLayer, deps.edges, deps.nodeMap, {
          view: 'workflow',
          selectedId: null,
        });
      }
    } else {
      clearSelection(createHighlighterDeps(deps, false));
    }
  };

  /**
   * Applies pending phase filter change.
   */
  const applyPhaseFilterChange = (phase: Phase | null): void => {
    deps.state.phaseFilter = phase;
    deps.stepLabels.setPhaseFilter(phase);

    if (phase) {
      applyPhaseFilter(phase, createHighlighterDeps(deps, true));
    } else if (deps.state.selection) {
      applySelectionHighlight(toHighlighterSelection(deps.state.selection), createHighlighterDeps(deps, shouldUseBlur()));
    } else {
      applyPhaseFilter(null, createHighlighterDeps(deps, false));
    }
  };

  /**
   * Applies pending detail panel change.
   */
  const applyDetailPanelChange = (open: boolean, wasOpen: boolean): void => {
    deps.state.detailPanelOpen = open;
    deps.stepLabels.setVisible(!open);

    if (deps.state.selection && open !== wasOpen) {
      applySelectionHighlight(toHighlighterSelection(deps.state.selection), createHighlighterDeps(deps, shouldUseBlur()));
    }

    if (open && deps.state.selection?.type === 'node') {
      deps.viewportManager.centerOnNode(deps.state.selection.nodeId, { zoom: true });
    } else if (!open && wasOpen) {
      const nodeId = deps.state.selection?.type === 'node' ? deps.state.selection.nodeId : undefined;
      deps.viewportManager.zoomToBounds(nodeId, {
        onComplete: () => deps.selectionController.updateOverlayNode(),
      });
    }
  };

  /**
   * Flushes all pending updates in deterministic order.
   */
  const flush = (): void => {
    flushScheduled = false;

    // Apply in deterministic order: selection -> phase -> detail
    if (pending.selection) {
      applySelectionChange(pending.selection.next);
      pending.selection = null;
    }

    if (pending.phase !== undefined) {
      applyPhaseFilterChange(pending.phase);
      pending.phase = undefined;
    }

    if (pending.detailOpen) {
      applyDetailPanelChange(pending.detailOpen.open, pending.detailOpen.wasOpen);
      pending.detailOpen = null;
    }
  };

  /**
   * Schedules a flush for the next microtask.
   */
  const scheduleFlush = (): void => {
    if (flushScheduled) return;
    flushScheduled = true;
    queueMicrotask(flush);
  };

  return {
    destroy: (): void => {
      deps.keyboardNavigation.detach();
      deps.selectionController.destroy();
      deps.viewportHandlers.destroy();
      deps.resizeHandler.destroy();
      deps.viewportManager.destroy();
      deps.animationController.cleanup();
      deps.titleOverlay.destroy();
      deps.nodeMap.forEach((node) => node.destroy());
      deps.pixi.app.destroy(true, { children: true });
    },

    setSelection: (next: SelectionTarget): void => {
      pending.selection = { next, prev: deps.state.selection };
      scheduleFlush();
    },

    setPhaseFilter: (phase: Phase | null): void => {
      pending.phase = phase;
      scheduleFlush();
    },

    setDetailPanelOpen: (open: boolean, wasOpen: boolean): void => {
      pending.detailOpen = { open, wasOpen };
      scheduleFlush();
    },

    setExpanded: (expanded: boolean): void => {
      deps.state.isExpanded = expanded;
    },

    resize: (width: number, height: number): void => {
      deps.viewportState.width = width;
      deps.viewportState.height = height;
      deps.pixi.app.resize();
      deps.lodController.updateViewport(deps.viewportState);

      const nodeId = deps.state.selection?.type === 'node' ? deps.state.selection.nodeId : null;
      if (deps.state.detailPanelOpen && nodeId) {
        deps.viewportManager.centerOnNode(nodeId, { zoom: true });
      }
    },

    centerOnNode: (nodeId: string, options = {}): void => {
      deps.viewportManager.centerOnNode(nodeId, options);
    },

    zoomToBounds: (nodeId?: string, options = {}): void => {
      deps.viewportManager.zoomToBounds(nodeId, options);
    },

    setTitleSecondaryVisible: (visible: boolean): void => {
      deps.titleOverlay.setSecondaryVisible(visible);
    },
  };
};
