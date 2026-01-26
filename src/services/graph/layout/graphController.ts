/**
 * Graph controller using Pixi.js for WebGL rendering.
 * Orchestrates viewport, LOD, and rendering modules.
 */
import { Culler } from 'pixi.js';
import { loadManifest } from '../../manifest/registry.js';
import { ManifestLoadError, type ManifestErrorInfo } from '../../manifest/errors.js';
import type { Trace } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { renderEdges, renderStepEdges } from '../rendering/edgeRenderer.js';
import { createStepLabels } from '../rendering/workflowLabelRenderer.js';
import { createViewportState, createViewportHandlers } from '../interaction/viewport.js';
import { createLODController, type LODLayers } from './lodController.js';
import { createTitleOverlay } from '../rendering/titleOverlay.js';
import { LOD_THRESHOLD, TEXT_SIMPLIFY_THRESHOLD, VIEWPORT_TOP_MARGIN, VIEWPORT_BOTTOM_MARGIN } from '../../../config/constants.js';
import { traceState } from '../../../stores/traceState.svelte.js';
import { uiState } from '../../../stores/uiState.svelte.js';
import { createNodeAnimationController } from '../interaction/nodeAnimationController.js';
import { createNodes, repositionNodesWithGaps, repositionStepNodesWithGaps } from './nodeCreator.js';
import { preCalculateNodeWidth } from '../rendering/nodeTextMeasurement.js';
import { recalculateStepBounds, createStepNodes, calculateTopNodeInfo, calculateBottomNodeInfo } from './workflowCreator.js';
import { initializePixi } from './pixiSetup.js';
import { createStoreSubscriptions } from './graphSubscriptions.svelte.js';
import { createViewportManager, createResizeHandler } from './viewportManager.js';
import { createSelectionController } from '../interaction/selectionController.js';
import { createKeyboardNavigation } from '../interaction/keyboardNavigation.js';

interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

interface GraphControllerCallbacks {
  onSimpleViewChange: (isSimple: boolean) => void;
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
  onLoaded: (data: Trace) => void;
  onError: (error: ManifestErrorInfo) => void;
}

export interface GraphController {
  destroy: () => void;
}

interface GraphControllerOptions {
  container: HTMLElement;
  manifestUrl: string;
  callbacks: GraphControllerCallbacks;
}

export async function createGraphController({
  container,
  manifestUrl,
  callbacks,
}: GraphControllerOptions): Promise<GraphController | null> {
  // Load manifest data
  let traceData: Trace;
  try {
    traceData = await loadManifest(manifestUrl);
  } catch (error) {
    console.error('Failed to load trace manifest', error);
    callbacks.onError({
      message: 'Failed to load manifest',
      details: error instanceof ManifestLoadError ? error.message : String(error),
      failedAssets: error instanceof ManifestLoadError ? error.failedAssets : undefined,
    });
    return null;
  }
  callbacks.onLoaded(traceData);

  // Initialize Pixi and layers
  const pixi = await initializePixi(container);
  const { app, viewport, layers } = pixi;

  const width = container.clientWidth;
  const height = container.clientHeight;
  const graphScale = Math.min(width, height) * 1.5;

  // Initialize viewport state
  const viewportState = createViewportState(width, height);
  viewport.scale.set(viewportState.scale);
  viewport.position.set(viewportState.x, viewportState.y);

  // Create title overlay
  const titleOverlay = createTitleOverlay(app.stage, {
    title: traceData.title ?? 'Trace',
    workflowId: traceData.workflowId ?? '',
  });

  // Node maps
  const nodeMap = new Map<string, GraphNode>();
  const stepNodeMap = new Map<string, GraphNode>();

  // Animation controller
  const animationController = createNodeAnimationController(nodeMap);

  // State tracking for subscriptions
  const state = {
    currentSelection: traceState.selection,
    detailPanelOpen: uiState.isDetailOpen,
    currentPhaseFilter: uiState.phaseFilter,
  };

  // Late-bound reference for centerOnNode (set after viewportManager is created)
  let centerOnNodeRef: ((nodeId: string, options?: { zoom?: boolean; onComplete?: () => void }) => void) | null = null;

  // Selection controller for unified node and step selection
  const selectionController = createSelectionController({
    nodeMap,
    stepNodeMap,
    viewport,
    viewportState,
    centerOnNode: (nodeId, options) => {
      if (centerOnNodeRef) {
        centerOnNodeRef(nodeId, options);
      } else {
        options?.onComplete?.();
      }
    },
  });

  // Calculate max node width and store it
  const maxNodeWidth = traceData.nodes.reduce((max, node) => {
    const width = preCalculateNodeWidth(node, 1);
    return width > max ? width : max;
  }, 0);
  traceState.setNodeWidth(maxNodeWidth);

  // Create nodes
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

  // Create step nodes
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
          nodes: payload.nodes,
          edges: payload.edges,
        });
      },
      getSelectedElementId: () => selectionController.getSelectedElementId(),
    },
  });

  repositionStepNodesWithGaps(stepNodeMap);
  renderStepEdges(layers.stepEdgeLayer, traceData.steps, stepNodeMap, null);

  // Step labels
  const topNodeInfo = calculateTopNodeInfo(nodeMap);
  const bottomNodeInfo = calculateBottomNodeInfo(nodeMap);
  const stepLabels = createStepLabels(traceData.steps, nodeMap, stepNodeMap, topNodeInfo);
  app.stage.addChild(stepLabels.container);
  stepLabels.update(viewportState);

  // Text simplification state
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

  // Helper functions
  const updateTitlePosition = (): void => {
    const firstStep = traceData.steps[0];
    const leftmostNode = firstStep ? stepNodeMap.get(firstStep.id) : null;
    if (leftmostNode) titleOverlay.updatePosition(leftmostNode, viewportState);
  };

  const cullAndRender = (): void => {
    if (lodController.state.isCollapsed) return;
    Culler.shared.cull(layers.nodeLayer, app.screen);
    const selection = state.currentSelection;
    const nodeId = selection?.type === 'node' ? selection.nodeId : null;
    renderEdges(layers.edgeLayer, traceData.edges, nodeMap, {
      view: 'workflow',
      selectedId: nodeId,
    });
  };

  // LOD controller
  const lodLayers: LODLayers = {
    nodeLayer: layers.nodeLayer,
    edgeLayer: layers.edgeLayer,
    stepNodeLayer: layers.stepNodeLayer,
    stepEdgeLayer: layers.stepEdgeLayer,
    stepLayer: stepLabels.container,
  };

  const lodController = createLODController(lodLayers, {
    onCollapseStart: () => { traceState.clearSelection(); titleOverlay.setMode('relative'); },
    onCollapseEnd: updateTitlePosition,
    onExpandStart: () => { traceState.clearSelection(); uiState.clearPhaseFilter(); titleOverlay.setMode('fixed'); },
    onExpandEnd: () => { stepLabels.update(viewportState); cullAndRender(); },
  });

  // Viewport manager
  const viewportManager = createViewportManager({
    nodeMap,
    viewport,
    viewportState,
    stepLabelsUpdate: stepLabels.update,
    cullAndRender,
    topNodeInfo,
    bottomNodeInfo,
  });

  // Wire up late-bound reference now that viewportManager exists
  centerOnNodeRef = viewportManager.centerOnNode;

  // Keyboard navigation
  const keyboardNavigation = createKeyboardNavigation({
    nodeMap,
    nodes: traceData.nodes,
    onExpand: (node) => selectionController.expand(node),
    onCollapse: () => selectionController.collapse(),
    centerOnNode: (nodeId, options) => viewportManager.centerOnNode(nodeId, options),
    updateOverlayPosition: () => selectionController.updateOverlayPosition(),
  });
  keyboardNavigation.attach();

  // Store subscriptions
  const subscriptions = createStoreSubscriptions({
    nodeMap,
    stepNodeMap,
    edgeLayer: layers.edgeLayer,
    stepEdgeLayer: layers.stepEdgeLayer,
    edges: traceData.edges,
    steps: traceData.steps,
    setNodeAlpha: animationController.setNodeAlpha,
    centerSelectedNode: (nodeId) => viewportManager.centerOnNode(nodeId, { zoom: true }),
    setStepLabelsPhaseFilter: stepLabels.setPhaseFilter,
    setStepLabelsVisible: stepLabels.setVisible,
    zoomToBounds: (nodeId, options) => viewportManager.zoomToBounds(nodeId, options),
    updateOverlayPosition: () => selectionController.updateOverlayPosition(),
    onStateChange: (newState) => {
      state.currentSelection = newState.currentSelection;
      state.detailPanelOpen = newState.detailPanelOpen;
      state.currentPhaseFilter = newState.currentPhaseFilter;
    },
  });

  // Viewport handlers
  const viewportHandlers = createViewportHandlers(app.canvas, viewport, container, viewportState, {
    onZoom: (scale) => {
      lodController.checkThreshold(scale);
      checkTextSimplifyThreshold(scale);
      stepLabels.update(viewportState);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) cullAndRender();
      else if (lodController.state.isCollapsed) updateTitlePosition();
      callbacks.onSimpleViewChange(scale < LOD_THRESHOLD);
    },
    onPan: () => {
      stepLabels.update(viewportState);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) cullAndRender();
      else if (lodController.state.isCollapsed) updateTitlePosition();
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

  // Resize handling
  const resizeHandler = createResizeHandler({
    container,
    viewportState,
    app,
    stepLabelsUpdate: stepLabels.update,
    cullAndRender,
    updateTitlePosition,
    centerSelectedNode: (nodeId) => viewportManager.centerOnNode(nodeId, { zoom: true }),
    isCollapsed: () => lodController.state.isCollapsed,
    getDetailPanelOpen: () => state.detailPanelOpen,
    getSelectedNodeId: () => state.currentSelection?.type === 'node' ? state.currentSelection.nodeId : null,
  });

  cullAndRender();

  return {
    destroy: () => {
      keyboardNavigation.detach();
      selectionController.destroy();
      subscriptions.destroy();
      viewportHandlers.destroy();
      resizeHandler.destroy();
      viewportManager.destroy();
      animationController.cleanup();
      titleOverlay.destroy();
      nodeMap.forEach((node) => node.destroy());
      app.destroy(true, { children: true });
    },
  };
}
