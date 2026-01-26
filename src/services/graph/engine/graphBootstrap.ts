/**
 * Graph bootstrap.
 * Handles ordered async initialization.
 *
 * IMPORTANT: This file must NOT import Svelte stores.
 * All state enters through InitialInputs parameter.
 * All events exit through BootstrapCallbacks.
 */
import { loadManifest } from '../../manifest/registry.js';
import { ManifestLoadError } from '../../manifest/errors.js';
import type { Trace, StepUI } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { renderStepEdges, renderEdges } from '../rendering/edgeRenderer.js';
import { createStepLabels } from '../rendering/workflowLabelRenderer.js';
import { createViewportState, createViewportHandlers } from '../interaction/viewport.js';
import { createLODController, type LODLayers, type LODRenderCallbacks } from '../layout/lodController.js';
import { createTitleOverlay } from '../rendering/titleOverlay.js';
import { LOD_THRESHOLD, TEXT_SIMPLIFY_THRESHOLD, VIEWPORT_TOP_MARGIN, VIEWPORT_BOTTOM_MARGIN } from '../../../config/constants.js';
import { createNodeAnimationController } from '../interaction/nodeAnimationController.js';
import { createNodes, repositionNodesWithGaps, repositionStepNodesWithGaps } from '../layout/nodeCreator.js';
import { preCalculateNodeWidth } from '../rendering/nodeTextMeasurement.js';
import { recalculateStepBounds, createStepNodes, calculateTopNodeInfo, calculateBottomNodeInfo } from '../layout/workflowCreator.js';
import { initializePixi } from '../layout/pixiSetup.js';
import { createViewportManager, createResizeHandler } from '../layout/viewportManager.js';
import { createSelectionController } from '../interaction/selectionController.js';
import { createKeyboardNavigation } from '../interaction/keyboardNavigation.js';
import { createNodeAccessor } from '../layout/nodeAccessor.js';
import { Culler } from 'pixi.js';
import { buildGraphIndices, type GraphIndices } from './graphIndices.js';
import { createGraphEngine, type EngineState } from './graphEngine.js';
import type { GraphEngine, BootstrapCallbacks, InitialInputs } from './graphInterface.js';

export interface BootstrapResult {
  engine: GraphEngine;
  traceData: Trace;
  indices: GraphIndices;
  nodeWidth: number;
}

/**
 * Bootstraps the graph with ordered initialization.
 * Returns a fully constructed engine ready for use.
 *
 * @param container - DOM element to render into
 * @param manifestUrl - URL to load manifest from
 * @param callbacks - Event callbacks (Pixi reports, Svelte decides)
 * @param initial - Initial state values (from Svelte stores)
 */
export async function bootstrapGraph(
  container: HTMLElement,
  manifestUrl: string,
  callbacks: BootstrapCallbacks,
  initial: InitialInputs
): Promise<BootstrapResult | null> {
  // 1. Load manifest data
  let traceData: Trace;
  try {
    traceData = await loadManifest(manifestUrl);
  } catch (error) {
    console.error('Failed to load trace manifest', error);
    callbacks.onError({
      message: 'Failed to load manifest',
      details: error instanceof ManifestLoadError ? error.message : String(error),
    });
    return null;
  }
  callbacks.onLoaded(traceData);

  // 2. Build graph indices for efficient lookups
  const indices = buildGraphIndices(traceData.nodes, traceData.edges);

  // 3. Initialize Pixi and layers
  const pixi = await initializePixi(container);
  const { app, viewport, layers } = pixi;

  const width = container.clientWidth;
  const height = container.clientHeight;
  const graphScale = Math.min(width, height) * 1.5;

  // 4. Initialize viewport state
  const viewportState = createViewportState(width, height);
  viewport.scale.set(viewportState.scale);
  viewport.position.set(viewportState.x, viewportState.y);

  // 5. Create node maps
  const nodeMap = new Map<string, GraphNode>();
  const stepNodeMap = new Map<string, GraphNode>();

  // 6. Create animation controller
  const animationController = createNodeAnimationController(nodeMap);

  // 7. Calculate max node width (returned in result, not emitted via callback)
  const nodeWidth = traceData.nodes.reduce((max, node) => {
    const w = preCalculateNodeWidth(node, 1);
    return w > max ? w : max;
  }, 0);

  // 8. Create engine state from initial inputs (NOT from stores)
  const state: EngineState = {
    selection: initial.selection,
    detailPanelOpen: initial.detailPanelOpen,
    phaseFilter: initial.phaseFilter,
    isExpanded: initial.isExpanded,
  };

  // 9. Create title overlay
  const titleOverlay = createTitleOverlay(app.stage, {
    title: traceData.title ?? 'Trace',
    workflowId: traceData.workflowId ?? '',
  });

  // 10-11. Declare controllers with definite assignment for ordered construction.
  // These closures capture by reference, so assignments below will be visible when invoked.
  let lodController!: ReturnType<typeof createLODController>;
  let viewportManager!: ReturnType<typeof createViewportManager>;

  // 10. Create nodeAccessor - reads isCollapsed directly from lodController (no local snapshot)
  const nodeAccessor = createNodeAccessor({
    nodeMap,
    stepNodeMap,
    isCollapsed: () => lodController.state.isCollapsed,
  });

  // 11. Create selection controller - centerOnNode reads from viewportManager (no placeholder)
  const selectionController = createSelectionController({
    nodeAccessor,
    centerOnNode: (nodeId, options) => viewportManager.centerOnNode(nodeId, options),
  });

  // 12. Create nodes with callbacks
  await createNodes(traceData.nodes, nodeMap, {
    container,
    nodeLayer: layers.nodeLayer,
    graphScale,
    ticker: app.ticker,
    callbacks: {
      onHover: callbacks.onHover,
      onHoverEnd: callbacks.onHoverEnd,
      onNodeClick: (node) => selectionController.expand(node),
    },
    getSelectedNodeId: () => selectionController.getSelectedElementId(),
    setNodeAlpha: animationController.setNodeAlpha,
  });

  repositionNodesWithGaps(nodeMap);
  recalculateStepBounds(traceData.steps, nodeMap, graphScale);

  // 13. Create step nodes
  createStepNodes(traceData.steps, traceData.nodes, traceData.edges, stepNodeMap, {
    container,
    stepNodeLayer: layers.stepNodeLayer,
    graphScale,
    ticker: app.ticker,
    callbacks: {
      onHover: callbacks.onHover,
      onHoverEnd: callbacks.onHoverEnd,
      onStepSelect: (stepId, graphNode, payload) => {
        selectionController.selectStep(stepId, graphNode, {
          stepId: payload.stepId,
          label: payload.label,
          phase: payload.phase,
          nodes: indices.nodesByStep.get(stepId) ?? [],
          edges: indices.edgesByStep.get(stepId) ?? [],
        });
      },
      getSelectedElementId: () => selectionController.getSelectedElementId(),
    },
  });

  repositionStepNodesWithGaps(stepNodeMap);
  renderStepEdges(layers.stepEdgeLayer, traceData.steps, stepNodeMap, null);

  // 14. Calculate bounds and create step labels
  const topNodeInfo = calculateTopNodeInfo(nodeMap);
  const bottomNodeInfo = calculateBottomNodeInfo(nodeMap);
  const stepLabels = createStepLabels(traceData.steps, nodeMap, stepNodeMap, topNodeInfo);
  app.stage.addChild(stepLabels.container);
  stepLabels.update(viewportState);

  // 15. Create LOD layers (all dependencies now exist)
  const lodLayers: LODLayers = {
    nodeLayer: layers.nodeLayer,
    edgeLayer: layers.edgeLayer,
    stepNodeLayer: layers.stepNodeLayer,
    stepEdgeLayer: layers.stepEdgeLayer,
    stepLayer: stepLabels.container,
  };

  // 16. Create render callbacks (emit viewport changes via callback)
  const renderCallbacks: LODRenderCallbacks = {
    onViewportUpdate: {
      always: (vs) => {
        stepLabels.update(vs);
        callbacks.onViewportChange(vs);
      },
      workflow: () => {
        // Cull using screen bounds - getBounds() returns global/stage coordinates
        Culler.shared.cull(layers.nodeLayer, app.screen);
        const nodeId = state.selection?.type === 'node' ? state.selection.nodeId : null;
        renderEdges(layers.edgeLayer, traceData.edges, nodeMap, { view: 'workflow', selectedId: nodeId });
      },
      step: (vs) => {
        const firstStep = stepNodeMap.get(traceData.steps[0]?.id);
        if (firstStep) titleOverlay.updatePosition(firstStep, vs);
      },
    },
  };

  // 17. Create LOD controller (emit LOD events via callbacks)
  // Assigned to variable declared above (definite assignment pattern)
  lodController = createLODController(lodLayers, {
    onCollapseStart: () => { callbacks.onLODCollapse(); titleOverlay.setMode('relative'); },
    onCollapseEnd: () => lodController.updateViewport(viewportState),
    onExpandStart: () => { callbacks.onLODExpand(); titleOverlay.setMode('fixed'); },
    onExpandEnd: () => lodController.updateViewport(viewportState),
  }, renderCallbacks);

  // 18. Create viewportManager
  // Assigned to variable declared above (definite assignment pattern)
  // TODO: topNodeInfo/bottomNodeInfo are static snapshots - should be dynamic getters
  viewportManager = createViewportManager({
    nodeAccessor,
    viewport,
    viewportState,
    onUpdate: () => lodController.updateViewport(viewportState),
    topNodeInfo,
    bottomNodeInfo,
  });

  // 19. Create keyboard navigation
  const keyboardNavigation = createKeyboardNavigation({
    nodeAccessor,
    nodes: traceData.nodes,
    steps: traceData.steps,
    onExpand: (node) => selectionController.expand(node),
    onCollapse: () => selectionController.collapse(),
    onStepSelect: (step: StepUI) => {
      const graphNode = stepNodeMap.get(step.id);
      if (graphNode) {
        selectionController.selectStep(step.id, graphNode, {
          stepId: step.id,
          label: step.label,
          phase: step.phase,
          nodes: indices.nodesByStep.get(step.id) ?? [],
          edges: indices.edgesByStep.get(step.id) ?? [],
        });
      }
    },
    centerOnNode: (nodeId, options) => viewportManager.centerOnNode(nodeId, options),
    updateOverlayNode: () => selectionController.updateOverlayNode(),
  });
  keyboardNavigation.attach();

  // 20. Text simplification tracking
  let isTextSimplified = false;

  const updateNodeTextModes = (simplified: boolean): void => {
    const targetMode = simplified ? 'simple' : 'detailed';
    nodeMap.forEach((node) => {
      if (node.updateMode) {
        node.updateMode(targetMode);
      }
    });
  };

  const checkTextSimplifyThreshold = (scale: number): void => {
    const shouldSimplify = scale < TEXT_SIMPLIFY_THRESHOLD;
    if (shouldSimplify !== isTextSimplified) {
      isTextSimplified = shouldSimplify;
      updateNodeTextModes(shouldSimplify);
    }
  };

  // 21. Create viewport handlers
  const viewportHandlers = createViewportHandlers(app.canvas, viewport, container, viewportState, {
    onZoom: (scale) => {
      lodController.checkThreshold(scale);
      checkTextSimplifyThreshold(scale);
      lodController.updateViewport(viewportState);
      callbacks.onSimpleViewChange(scale < LOD_THRESHOLD);
    },
    onPan: () => {
      lodController.updateViewport(viewportState);
    },
    onPanStart: () => {},
    onPanEnd: () => {},
    isZoomBlocked: () => lodController.state.isAnimating,
    isInteractionBlocked: () => state.detailPanelOpen,
    getBounds: () => {
      if (!topNodeInfo || !bottomNodeInfo) return null;
      return {
        topWorldY: topNodeInfo.worldY - topNodeInfo.halfHeight,
        bottomWorldY: bottomNodeInfo.worldY + bottomNodeInfo.halfHeight,
        topMargin: VIEWPORT_TOP_MARGIN,
        bottomMargin: VIEWPORT_BOTTOM_MARGIN,
      };
    },
  });

  // 22. Create resize handler
  const resizeHandler = createResizeHandler({
    container,
    viewportState,
    app,
    onUpdate: () => lodController.updateViewport(viewportState),
    centerSelectedNode: (nodeId) => viewportManager.centerOnNode(nodeId, { zoom: true }),
    getDetailPanelOpen: () => state.detailPanelOpen,
    getSelectedNodeId: () => state.selection?.type === 'node' ? state.selection.nodeId : null,
  });

  // 23. Initial viewport update
  lodController.updateViewport(viewportState);

  // 24. Create engine with all dependencies
  const engine = createGraphEngine({
    pixi,
    nodeMap,
    stepNodeMap,
    edges: traceData.edges,
    steps: traceData.steps,
    nodeAccessor,
    viewportManager,
    selectionController,
    keyboardNavigation,
    lodController,
    viewportState,
    animationController,
    stepLabels,
    titleOverlay,
    resizeHandler,
    viewportHandlers,
    state,
    topNodeInfo,
    bottomNodeInfo,
  });

  // 25. Apply initial state
  if (initial.selection) {
    engine.setSelection(initial.selection);
  }
  if (initial.phaseFilter) {
    engine.setPhaseFilter(initial.phaseFilter);
  }
  if (initial.detailPanelOpen) {
    engine.setDetailPanelOpen(true, false);
  }

  return { engine, traceData, indices, nodeWidth };
}
