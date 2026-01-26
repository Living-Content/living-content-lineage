/**
 * Graph controller using Pixi.js for WebGL rendering.
 * Orchestrates viewport, LOD, and rendering modules.
 */
import { loadManifest } from '../../manifest/registry.js';
import { ManifestLoadError, type ManifestErrorInfo } from '../../manifest/errors.js';
import type { Trace } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { renderStepEdges } from '../rendering/edgeRenderer.js';
import { createStepLabels } from '../rendering/workflowLabelRenderer.js';
import { createViewportState, createViewportHandlers } from '../interaction/viewport.js';
import { createLODController, type LODLayers, type LODRenderCallbacks } from './lodController.js';
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
import { createNodeAccessor } from './nodeAccessor.js';
import { Culler } from 'pixi.js';
import { renderEdges } from '../rendering/edgeRenderer.js';

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

  // Late-bound reference for isCollapsed (set after lodController is created)
  let isCollapsedRef: (() => boolean) | null = null;

  // Node accessor for unified access to nodes in either view
  const nodeAccessor = createNodeAccessor({
    nodeMap,
    stepNodeMap,
    isCollapsed: () => isCollapsedRef ? isCollapsedRef() : false,
  });

  // Selection controller for unified node and step selection
  const selectionController = createSelectionController({
    nodeAccessor,
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

  // LOD controller
  const lodLayers: LODLayers = {
    nodeLayer: layers.nodeLayer,
    edgeLayer: layers.edgeLayer,
    stepNodeLayer: layers.stepNodeLayer,
    stepEdgeLayer: layers.stepEdgeLayer,
    stepLayer: stepLabels.container,
  };

  // Render callbacks - logic defined once, owned by LODController
  const renderCallbacks: LODRenderCallbacks = {
    onViewportUpdate: {
      always: (vs) => {
        stepLabels.update(vs);
        traceState.updateViewport(vs);
      },
      workflow: () => {
        Culler.shared.cull(layers.nodeLayer, app.screen);
        const nodeId = state.currentSelection?.type === 'node' ? state.currentSelection.nodeId : null;
        renderEdges(layers.edgeLayer, traceData.edges, nodeMap, { view: 'workflow', selectedId: nodeId });
      },
      step: (vs) => {
        const firstStep = stepNodeMap.get(traceData.steps[0]?.id);
        if (firstStep) titleOverlay.updatePosition(firstStep, vs);
      },
    },
  };

  const lodController = createLODController(lodLayers, {
    onCollapseStart: () => { traceState.clearSelection(); titleOverlay.setMode('relative'); },
    onCollapseEnd: () => lodController.updateViewport(viewportState),
    onExpandStart: () => { traceState.clearSelection(); uiState.clearPhaseFilter(); titleOverlay.setMode('fixed'); },
    onExpandEnd: () => lodController.updateViewport(viewportState),
  }, renderCallbacks);

  // Wire up late-bound reference now that lodController exists
  isCollapsedRef = () => lodController.state.isCollapsed;

  // Viewport manager
  const viewportManager = createViewportManager({
    nodeAccessor,
    viewport,
    viewportState,
    onUpdate: () => lodController.updateViewport(viewportState),
    topNodeInfo,
    bottomNodeInfo,
  });

  // Wire up late-bound reference now that viewportManager exists
  centerOnNodeRef = viewportManager.centerOnNode;

  // Keyboard navigation
  const keyboardNavigation = createKeyboardNavigation({
    nodeAccessor,
    nodes: traceData.nodes,
    steps: traceData.steps,
    onExpand: (node) => selectionController.expand(node),
    onCollapse: () => selectionController.collapse(),
    onStepSelect: (step) => {
      const graphNode = stepNodeMap.get(step.id);
      if (graphNode) {
        selectionController.selectStep(step.id, graphNode, {
          stepId: step.id,
          label: step.label,
          phase: step.phase,
          nodes: traceData.nodes.filter(n => n.step === step.id),
          edges: traceData.edges.filter(e => {
            const source = traceData.nodes.find(n => n.id === e.source);
            const target = traceData.nodes.find(n => n.id === e.target);
            return source?.step === step.id || target?.step === step.id;
          }),
        });
      }
    },
    centerOnNode: (nodeId, options) => viewportManager.centerOnNode(nodeId, options),
    updateOverlayNode: () => selectionController.updateOverlayNode(),
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
    updateOverlayNode: () => selectionController.updateOverlayNode(),
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

  // Resize handling
  const resizeHandler = createResizeHandler({
    container,
    viewportState,
    app,
    onUpdate: () => lodController.updateViewport(viewportState),
    centerSelectedNode: (nodeId) => viewportManager.centerOnNode(nodeId, { zoom: true }),
    getDetailPanelOpen: () => state.detailPanelOpen,
    getSelectedNodeId: () => state.currentSelection?.type === 'node' ? state.currentSelection.nodeId : null,
  });

  lodController.updateViewport(viewportState);

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
