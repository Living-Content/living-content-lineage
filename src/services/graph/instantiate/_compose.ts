/**
 * Graph runtime composition.
 * Wires controllers, handlers, and dependencies into a cohesive runtime.
 *
 * This is system composition: creating the relationships between parts.
 */
import type { Trace, StepUI } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { ViewportState } from '../interaction/viewport.js';
import { createViewportHandlers } from '../interaction/viewport.js';
import type { PixiContext } from '../layout/pixiSetup.js';
import type { GraphIndices } from '../engine/indices.js';
import type { EngineState } from '../engine/state.js';
import { createGraphEngine } from '../engine/state.js';
import type { GraphEngine, BootstrapCallbacks } from '../engine/interface.js';
import { renderStepEdges, renderEdges } from '../rendering/edgeRenderer.js';
import { createStepLabels } from '../rendering/workflowLabelRenderer.js';
import { createLODController, type LODLayers, type LODRenderCallbacks } from '../layout/lodController.js';
import { createTitleOverlay } from '../rendering/titleOverlay.js';
import { LOD_THRESHOLD, TEXT_SIMPLIFY_THRESHOLD, VIEWPORT_TOP_MARGIN, VIEWPORT_BOTTOM_MARGIN } from '../../../config/constants.js';
import { createNodes, repositionNodesWithGaps, repositionStepNodesWithGaps } from '../layout/nodeCreator.js';
import { recalculateStepBounds, createStepNodes, calculateTopNodeInfo, calculateBottomNodeInfo } from '../layout/workflowCreator.js';
import { createViewportManager, createResizeHandler } from '../layout/viewportManager.js';
import { createSelectionController } from '../interaction/selectionController.js';
import { createKeyboardNavigation } from '../interaction/keyboardNavigation.js';
import { createNodeAccessor } from '../layout/nodeAccessor.js';
import { Culler } from 'pixi.js';

export interface CompositionInputs {
  container: HTMLElement;
  traceData: Trace;
  indices: GraphIndices;
  pixi: PixiContext;
  viewportState: ViewportState;
  nodeMap: Map<string, GraphNode>;
  stepNodeMap: Map<string, GraphNode>;
  animationController: { setNodeAlpha: (nodeId: string, alpha: number) => void; cleanup: () => void };
  state: EngineState;
  graphScale: number;
  callbacks: BootstrapCallbacks;
}

/**
 * Compose the graph runtime by wiring all controllers and handlers.
 * Returns a fully constructed engine.
 */
export async function composeGraphRuntime(inputs: CompositionInputs): Promise<GraphEngine> {
  const {
    container,
    traceData,
    indices,
    pixi,
    viewportState,
    nodeMap,
    stepNodeMap,
    animationController,
    state,
    graphScale,
    callbacks,
  } = inputs;

  const { app, viewport, layers } = pixi;

  // Create title overlay
  const titleOverlay = createTitleOverlay(app.stage, {
    title: traceData.title ?? 'Trace',
    workflowId: traceData.workflowId ?? '',
  });

  // Create nodeAccessor - reads isCollapsed from traceState store
  const nodeAccessor = createNodeAccessor({ nodeMap, stepNodeMap });

  // Create selection controller - centerOnNode bound later via bindCenterOnNode
  const selectionController = createSelectionController({ nodeAccessor });

  // Create nodes with callbacks
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
  await createStepNodes(traceData.steps, traceData.nodes, traceData.edges, stepNodeMap, {
    container,
    stepNodeLayer: layers.stepNodeLayer,
    graphScale,
    ticker: app.ticker,
    callbacks: {
      onHover: callbacks.onHover,
      onHoverEnd: callbacks.onHoverEnd,
      onStepSelect: (stepId, graphNode, payload) => {
        selectionController.selectStep(graphNode, {
          stepId: payload.stepId,
          label: payload.label,
          phase: payload.phase,
          nodes: indices.nodesByStep.get(stepId) ?? [],
          edges: indices.edgesByStep.get(stepId) ?? [],
        });
      },
      getSelectedElementId: () => selectionController.getSelectedElementId(),
    },
    setNodeAlpha: animationController.setNodeAlpha,
  });

  repositionStepNodesWithGaps(stepNodeMap);
  renderStepEdges(layers.stepEdgeLayer, traceData.steps, stepNodeMap, null);

  // Create dynamic getters for bounds (always fresh)
  const getTopNodeInfo = () => calculateTopNodeInfo(nodeMap);
  const getBottomNodeInfo = () => calculateBottomNodeInfo(nodeMap);

  // Create step labels with initial bounds (world space - add to viewport)
  const stepLabels = createStepLabels(traceData.steps, nodeMap, stepNodeMap, getTopNodeInfo());
  viewport.addChild(stepLabels.container);
  stepLabels.update(viewportState);

  // Create LOD layers
  const lodLayers: LODLayers = {
    nodeLayer: layers.nodeLayer,
    edgeLayer: layers.edgeLayer,
    stepNodeLayer: layers.stepNodeLayer,
    stepEdgeLayer: layers.stepEdgeLayer,
    stepLayer: stepLabels.container,
  };

  // Create render callbacks
  const renderCallbacks: LODRenderCallbacks = {
    onViewportUpdate: {
      always: (vs) => {
        stepLabels.update(vs);
        callbacks.onViewportChange(vs);
      },
      workflow: () => {
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

  // Create LOD controller
  const lodController = createLODController(lodLayers, {
    onCollapseStart: () => { callbacks.onLODCollapse(); titleOverlay.setMode('relative'); },
    onCollapseEnd: () => lodController.updateViewport(viewportState),
    onExpandStart: () => { callbacks.onLODExpand(); titleOverlay.setMode('fixed'); },
    onExpandEnd: () => lodController.updateViewport(viewportState),
  }, renderCallbacks);

  // Create viewportManager with dynamic bounds getters
  const viewportManager = createViewportManager({
    nodeAccessor,
    viewport,
    viewportState,
    onUpdate: () => lodController.updateViewport(viewportState),
    getTopNodeInfo,
    getBottomNodeInfo,
  });

  // Wire up late binding for centerOnNode
  selectionController.bindCenterOnNode((nodeId, opts) => viewportManager.centerOnNode(nodeId, opts));

  // Create keyboard navigation
  const keyboardNavigation = createKeyboardNavigation({
    nodeAccessor,
    nodes: traceData.nodes,
    steps: traceData.steps,
    onExpand: (node) => selectionController.expand(node),
    onCollapse: () => selectionController.collapse(),
    onStepSelect: (step: StepUI) => {
      const graphNode = stepNodeMap.get(step.id);
      if (graphNode) {
        selectionController.selectStep(graphNode, {
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

  // Text simplification tracking
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

  // Create viewport handlers
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
      const topInfo = getTopNodeInfo();
      const bottomInfo = getBottomNodeInfo();
      if (!topInfo || !bottomInfo) return null;
      return {
        topWorldY: topInfo.worldY - topInfo.halfHeight,
        bottomWorldY: bottomInfo.worldY + bottomInfo.halfHeight,
        topMargin: VIEWPORT_TOP_MARGIN,
        bottomMargin: VIEWPORT_BOTTOM_MARGIN,
      };
    },
  });

  // Create resize handler
  const resizeHandler = createResizeHandler({
    container,
    viewportState,
    app,
    onUpdate: () => lodController.updateViewport(viewportState),
    centerSelectedNode: (nodeId) => viewportManager.centerOnNode(nodeId, { zoom: true }),
    getDetailPanelOpen: () => state.detailPanelOpen,
    getSelectedNodeId: () => state.selection?.type === 'node' ? state.selection.nodeId : null,
  });

  // Initial viewport update
  lodController.updateViewport(viewportState);

  // Create and return engine
  return createGraphEngine({
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
  });
}
