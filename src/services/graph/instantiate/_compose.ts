/**
 * Graph runtime composition.
 * Wires controllers, handlers, and dependencies into a cohesive runtime.
 *
 * This is system composition: creating the relationships between parts.
 */
import type { Trace, StepUI, TraceNodeData } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { ViewportState } from '../interaction/viewport.js';
import { createViewportHandlers } from '../interaction/viewport.js';
import type { PixiContext } from '../layout/pixiSetup.js';
import type { GraphIndices } from '../engine/indices.js';
import type { EngineState } from '../engine/state.js';
import { createGraphEngine } from '../engine/state.js';
import type { GraphEngine, BootstrapCallbacks } from '../engine/interface.js';
import { renderStepEdges } from '../rendering/edgeRenderer.js';
import { createWorkflowLabels, type WorkflowLabelData } from '../rendering/workflowLabelRenderer.js';
import { createLODController, type LODLayers, type LODRenderCallbacks } from '../layout/lodController.js';
import { createTitleOverlay } from '../rendering/titleOverlay.js';
import { LOD_THRESHOLD, TEXT_SIMPLIFY_THRESHOLD, VIEWPORT_TOP_MARGIN, VIEWPORT_BOTTOM_MARGIN } from '../../../config/constants.js';
import { recalculateStepBounds, createStepNodes } from '../layout/workflowCreator.js';
import { createViewportManager, createResizeHandler } from '../layout/viewportManager.js';
import { createSelectionController } from '../interaction/selectionController.js';
import { createKeyboardNavigation } from '../interaction/keyboardNavigation.js';
import { createNodeAccessor } from '../layout/nodeAccessor.js';
import { Culler } from 'pixi.js';
import { createWorkflowManager } from '../workflowManager.js';
import { createWorkflowRenderer } from '../workflowRenderer.js';
import { createNodesForAllWorkflows, type NodeCreationDeps } from '../workflowNodeFactory.js';
import { getStepColumnPositions, alignNodesToStepColumns } from '../workflowAlignment.js';
import { fetchRelatedWorkflows } from '../workflowLoader.js';
import { getCssVarFloat } from '../../../themes/index.js';

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

  // Create workflow manager
  const workflowManager = createWorkflowManager();

  // Create nodeAccessor - reads isCollapsed from traceState store
  const nodeAccessor = createNodeAccessor({ nodeMap, stepNodeMap });

  // Create selection controller - centerOnNode bound later via bindCenterOnNode
  const selectionController = createSelectionController({ nodeAccessor });

  // Node creation dependencies (shared for all workflows)
  const nodeCreationDeps: NodeCreationDeps = {
    container,
    nodeLayer: layers.nodeLayer,
    graphScale,
    ticker: app.ticker,
    callbacks: {
      onHover: callbacks.onHover,
      onHoverEnd: callbacks.onHoverEnd,
      onNodeClick: (node: TraceNodeData) => selectionController.expand(node),
    },
    getSelectedNodeId: () => selectionController.getSelectedElementId(),
    setNodeAlpha: animationController.setNodeAlpha,
  };

  // 1. Register main workflow
  const mainWorkflowId = traceData.workflowId ?? 'main';
  workflowManager.register(mainWorkflowId, traceData, {
    yOffset: 0.5,
    opacity: 1.0,
    relationship: 'main',
  });

  // 2. Fetch and register related workflows
  const fadedAlpha = getCssVarFloat('--node-faded-alpha');
  await fetchRelatedWorkflows(workflowManager, mainWorkflowId, fadedAlpha);

  // 3. Create nodes for all workflows with shared widths
  await createNodesForAllWorkflows(workflowManager, nodeCreationDeps);

  // 4. Get step positions from main workflow and align others
  const mainWorkflow = workflowManager.get(mainWorkflowId);
  if (mainWorkflow) {
    const stepPositions = getStepColumnPositions(mainWorkflow.nodeMap);

    // Align child/ancestor workflows to main workflow's step columns
    for (const wf of workflowManager.getAll()) {
      if (wf.workflowId !== mainWorkflowId) {
        alignNodesToStepColumns(wf.nodeMap, stepPositions);
      }
    }
  }

  // 5. Merge ALL workflow nodes into shared nodeMap (enables selection of all nodes)
  for (const wf of workflowManager.getAll()) {
    wf.nodeMap.forEach((node, id) => nodeMap.set(id, node));
  }

  recalculateStepBounds(traceData.steps, nodeMap, graphScale);

  // Build step position map from main workflow for alignment
  const mainStepPositions = new Map<string, number>();
  for (const step of traceData.steps) {
    mainStepPositions.set(step.id, (step.xStart + step.xEnd) / 2);
  }

  // Create step nodes for ALL workflows using main workflow's X positions
  for (const wf of workflowManager.getAll()) {
    await createStepNodes(wf.trace.steps, wf.trace.nodes, wf.trace.edges, stepNodeMap, {
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
      yOffset: wf.yOffset - 0.5,
      workflowId: wf.workflowId,
      stepPositions: mainStepPositions,
    });
  }

  // Render step edges for all workflows (clear layer first, then add all)
  layers.stepEdgeLayer.removeChildren();
  for (const wf of workflowManager.getAll()) {
    renderStepEdges(layers.stepEdgeLayer, wf.trace.steps, stepNodeMap, null, wf.workflowId);
  }

  // Create workflow renderer (handles edges and connector)
  // Must be after step nodes exist so connector can use step node positions
  const workflowRenderer = createWorkflowRenderer({
    layers,
    workflowManager,
    mainWorkflowId,
    stepNodeMap,
  });
  workflowRenderer.initialize();

  // Dynamic getters for bounds (always fresh, includes all workflows)
  const getTopNodeInfo = () => workflowManager.getTopNodeInfo();
  const getBottomNodeInfo = () => workflowManager.getBottomNodeInfo();

  // Create step labels for each workflow independently
  const workflowLabelData: WorkflowLabelData[] = workflowManager.getAll().map((wf) => ({
    workflowId: wf.workflowId,
    steps: wf.trace.steps,
    nodeMap: wf.nodeMap,
  }));
  const stepLabels = createWorkflowLabels(workflowLabelData);
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
        // Edges are redrawn via renderer (reuses Graphics objects)
        const nodeId = state.selection?.type === 'node' ? state.selection.nodeId : null;
        workflowRenderer.setRenderState({ selectedNodeId: nodeId });
      },
      step: (vs) => {
        const firstStepId = `${mainWorkflowId}-step-${traceData.steps[0]?.id}`;
        const firstStep = stepNodeMap.get(firstStepId);
        if (firstStep) titleOverlay.updatePosition(firstStep, vs);
      },
    },
  };

  // Create LOD controller
  const lodController = createLODController(lodLayers, {
    onCollapseStart: () => { callbacks.onLODCollapse(); titleOverlay.setMode('relative'); },
    onCollapseEnd: () => { lodController.updateViewport(viewportState); workflowRenderer.redrawConnector(); },
    onExpandStart: () => { callbacks.onLODExpand(); titleOverlay.setMode('fixed'); },
    onExpandEnd: () => { lodController.updateViewport(viewportState); workflowRenderer.redrawConnector(); },
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

      // Content bounds
      const contentTop = topInfo.worldY - topInfo.halfHeight;
      const contentBottom = bottomInfo.worldY + bottomInfo.halfHeight;
      const contentHeight = contentBottom - contentTop;
      const contentCenter = (contentTop + contentBottom) / 2;

      // Worldspace is 2x content height plus 200px buffer all around
      const worldspaceHalf = contentHeight + 200;

      return {
        topWorldY: contentCenter - worldspaceHalf,
        bottomWorldY: contentCenter + worldspaceHalf,
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
    workflowRenderer,
    state,
  });
}
