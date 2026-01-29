/**
 * Graph activation.
 * Orchestrates initialization and composition, then activates with initial state.
 *
 * This is the entry point: coordinates phases and applies initial state.
 */
import type { Trace } from '../../../config/types.js';
import type { GraphIndices } from './indices.js';
import type { GraphEngine, BootstrapCallbacks, InitialInputs } from './interface.js';
import { initGraphAssets } from './bootstrap.js';
import { composeGraphRuntime } from './compose.js';

export interface GraphActivationResult {
  engine: GraphEngine;
  traceData: Trace;
  indices: GraphIndices;
}

/**
 * Activate a graph: initialize assets, compose runtime, apply initial state.
 * Returns null if initialization fails.
 */
export async function activateGraph(
  container: HTMLElement,
  manifestUrl: string,
  callbacks: BootstrapCallbacks,
  initial: InitialInputs
): Promise<GraphActivationResult | null> {
  // Phase 1: Initialize assets
  const initOutcome = await initGraphAssets(container, manifestUrl, initial);

  if (!initOutcome.ok) {
    callbacks.onError(initOutcome.error);
    return null;
  }

  const assets = initOutcome.result;
  callbacks.onLoaded(assets.traceData);

  // Phase 2: Compose runtime
  const engine = await composeGraphRuntime({
    container,
    traceData: assets.traceData,
    indices: assets.indices,
    pixi: assets.pixi,
    viewportState: assets.viewportState,
    nodeMap: assets.nodeMap,
    animationController: assets.animationController,
    state: assets.state,
    graphScale: assets.graphScale,
    callbacks,
  });

  // Phase 3: Activate with initial state - fit content to viewport first
  // Apply initial state before zoom so everything is positioned correctly
  if (initial.selection) {
    engine.setSelection(initial.selection);
  }
  if (initial.phaseFilter) {
    engine.setPhaseFilter(initial.phaseFilter);
  }
  if (initial.detailPanelOpen) {
    engine.setDetailPanelOpen(true, false);
  }

  // Position viewport for current view and signal ready
  engine.setPositionForCurrentView();
  callbacks.onReady();

  return {
    engine,
    traceData: assets.traceData,
    indices: assets.indices,
  };
}
