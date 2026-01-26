/**
 * Graph asset initialization.
 * Loads data and creates inert resources - no behavior, no wiring.
 *
 * This is true bootstrapping: minimal setup to make the system exist.
 */
import { loadManifest } from '../../manifest/registry.js';
import { ManifestLoadError } from '../../manifest/errors.js';
import type { Trace } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { createViewportState, type ViewportState } from '../interaction/viewport.js';
import { preCalculateNodeWidth } from '../rendering/nodeTextMeasurement.js';
import { initializePixi, type PixiContext } from '../layout/pixiSetup.js';
import { createNodeAnimationController } from '../interaction/nodeAnimationController.js';
import { buildGraphIndices, type GraphIndices } from '../engine/indices.js';
import type { EngineState } from '../engine/state.js';
import type { InitialInputs, SelectionTarget } from '../engine/interface.js';

export interface AssetInitResult {
  traceData: Trace;
  indices: GraphIndices;
  pixi: PixiContext;
  viewportState: ViewportState;
  nodeMap: Map<string, GraphNode>;
  stepNodeMap: Map<string, GraphNode>;
  animationController: ReturnType<typeof createNodeAnimationController>;
  nodeWidths: Map<number, number>;
  state: EngineState;
  graphScale: number;
}

export interface AssetInitError {
  message: string;
  details?: string;
}

export type AssetInitOutcome =
  | { ok: true; result: AssetInitResult }
  | { ok: false; error: AssetInitError };

/**
 * Initialize graph assets: load data, create Pixi context, build indices.
 * Returns inert resources ready for composition.
 */
export async function initGraphAssets(
  container: HTMLElement,
  manifestUrl: string,
  initial: InitialInputs
): Promise<AssetInitOutcome> {
  // Load manifest
  let traceData: Trace;
  try {
    traceData = await loadManifest(manifestUrl);
  } catch (error) {
    console.error('Failed to load trace manifest', error);
    return {
      ok: false,
      error: {
        message: 'Failed to load manifest',
        details: error instanceof ManifestLoadError ? error.message : String(error),
      },
    };
  }

  // Build lookup indices
  const indices = buildGraphIndices(traceData.nodes, traceData.edges);

  // Initialize Pixi
  const pixi = await initializePixi(container);
  const { viewport } = pixi;

  // Viewport dimensions and scale
  const width = container.clientWidth;
  const height = container.clientHeight;
  const graphScale = Math.min(width, height) * 1.5;

  // Initialize viewport state
  const viewportState = createViewportState(width, height);
  viewport.scale.set(viewportState.scale);
  viewport.position.set(viewportState.x, viewportState.y);

  // Create empty node maps (populated during composition)
  const nodeMap = new Map<string, GraphNode>();
  const stepNodeMap = new Map<string, GraphNode>();

  // Create animation controller
  const animationController = createNodeAnimationController(nodeMap);

  // Calculate max node width per group (grouped by node.x position)
  const nodeWidths = new Map<number, number>();
  traceData.nodes.forEach((node) => {
    const groupKey = Math.round((node.x ?? 0.5) * 1000);
    const w = preCalculateNodeWidth(node, 1);
    const current = nodeWidths.get(groupKey) ?? 0;
    if (w > current) nodeWidths.set(groupKey, w);
  });

  // Create engine state from initial inputs
  const state: EngineState = {
    selection: initial.selection as SelectionTarget,
    detailPanelOpen: initial.detailPanelOpen,
    phaseFilter: initial.phaseFilter,
    isExpanded: initial.isExpanded,
  };

  return {
    ok: true,
    result: {
      traceData,
      indices,
      pixi,
      viewportState,
      nodeMap,
      stepNodeMap,
      animationController,
      nodeWidths,
      state,
      graphScale,
    },
  };
}
