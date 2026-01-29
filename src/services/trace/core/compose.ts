/**
 * Graph runtime composition.
 * Wires controllers, handlers, and dependencies into a cohesive runtime.
 *
 * This is system composition: creating the relationships between parts.
 */
import type { Trace, TraceNodeData, Phase } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { ViewportState } from '../interaction/viewport.js';
import { createViewportHandlers } from '../interaction/viewport.js';
import type { PixiContext } from '../layout/pixiSetup.js';
import { getContainerForLevel } from '../layout/pixiSetup.js';
import type { GraphIndices } from './indices.js';
import type { EngineState } from './engine.js';
import { createGraphEngine } from './engine.js';
import type { GraphEngine, BootstrapCallbacks } from './interface.js';
import { createWorkflowLabels, type WorkflowLabelData } from '../rendering/labelRenderer.js';
import { createViewContainerController } from '../layout/viewLayerController.js';
import { createTitleOverlay } from '../rendering/titleOverlay.js';
import { ZOOM_MIN, ZOOM_MAX } from '../../../config/viewport.js';
import { TEXT_SIMPLIFY_THRESHOLD } from '../../../config/nodes.js';
import { getCssVarInt } from '../../../themes/theme.js';
import { createViewportManager, createResizeHandler } from '../layout/viewportManager.js';
import { createSelectionController } from '../interaction/selectionController.js';
import { createKeyboardNavigation } from '../interaction/keyboardNavigation.js';
import { createNodeAccessor } from '../layout/nodeAccessor.js';
import { Culler } from 'pixi.js';
import { createWorkflowManager, type ManagedWorkflow } from '../workflow/manager.js';
import { createWorkflowRenderer } from '../rendering/edgeRenderer.js';
import { createNodesForAllWorkflows, type NodeCreationDeps } from '../workflow/nodeFactory.js';
import { getStepColumnPositions, alignNodesToStepColumns } from '../workflow/alignment.js';
import { fetchRelatedWorkflows } from '../workflow/loader.js';
import { getCssVarFloat } from '../../../themes/theme.js';
import { viewLevel } from '../../../stores/viewLevel.svelte.js';
import { createWorkflowCard, type WorkflowCardData } from '../rendering/cards/workflowCard.js';
import { createWorkflowCardConnectorRenderer, type WorkflowConnection, type CardObstacle } from '../rendering/cards/cardConnector.js';
import { createContentSessionCard } from '../rendering/cards/contentSessionCard.js';
import { WORKFLOW_CARD_WIDTH, WORKFLOW_CARD_HEIGHT, CONTENT_SESSION_CARD_WIDTH, CONTENT_SESSION_CARD_HEIGHT } from '../../../config/cards.js';

export interface CompositionInputs {
  container: HTMLElement;
  traceData: Trace;
  indices: GraphIndices;
  pixi: PixiContext;
  viewportState: ViewportState;
  nodeMap: Map<string, GraphNode>;
  animationController: { setNodeAlpha: (nodeId: string, alpha: number) => void; cleanup: () => void };
  state: EngineState;
  graphScale: number;
  callbacks: BootstrapCallbacks;
}

/**
 * Calculate the left X position (minimum) of a workflow from its nodes.
 * Cards align with the left edge of the workflow.
 */
const calculateWorkflowLeftX = (nodeMap: Map<string, GraphNode>): number => {
  let minX = Infinity;

  nodeMap.forEach((node) => {
    const halfW = node.nodeWidth / 2;
    minX = Math.min(minX, node.position.x - halfW);
  });

  return minX === Infinity ? 0 : minX;
};

/**
 * Calculate the vertical center Y position of a workflow from its nodes.
 * Cards are vertically centered with the workflow.
 */
const calculateWorkflowCenterY = (nodeMap: Map<string, GraphNode>): number => {
  let minY = Infinity;
  let maxY = -Infinity;

  nodeMap.forEach((node) => {
    const halfH = node.nodeHeight / 2;
    minY = Math.min(minY, node.position.y - halfH);
    maxY = Math.max(maxY, node.position.y + halfH);
  });

  return minY === Infinity ? 0 : (minY + maxY) / 2;
};


/**
 * Build workflow card connections from workflow relationships.
 */
const buildWorkflowConnections = (
  workflows: ManagedWorkflow[],
  mainWorkflowId: string,
  cardPositions: Map<string, { x: number; y: number }>
): WorkflowConnection[] => {
  const connections: WorkflowConnection[] = [];

  for (const wf of workflows) {
    if (wf.relationship === 'child' && wf.branchPointNodeId) {
      const parentPos = cardPositions.get(mainWorkflowId);
      const childPos = cardPositions.get(wf.workflowId);

      if (parentPos && childPos) {
        // Find the phase of the branch point node
        const mainWf = workflows.find((w) => w.workflowId === mainWorkflowId);
        let phase: Phase = 'Generation';
        if (mainWf) {
          for (const node of mainWf.nodeMap.values()) {
            if (node.nodeData.id === wf.branchPointNodeId) {
              phase = node.nodeData.phase;
              break;
            }
          }
        }

        // Connect from parent card bottom-center to child card left-center
        // Cards have top-left origin
        connections.push({
          parentWorkflowId: mainWorkflowId,
          childWorkflowId: wf.workflowId,
          parentX: parentPos.x + WORKFLOW_CARD_WIDTH / 2,
          parentY: parentPos.y + WORKFLOW_CARD_HEIGHT,
          childX: childPos.x,
          childY: childPos.y + WORKFLOW_CARD_HEIGHT / 2,
          phase,
        });
      }
    }
  }

  return connections;
};

/**
 * Compose the graph runtime by wiring all controllers and handlers.
 * Returns a fully constructed engine.
 */
export async function composeGraphRuntime(inputs: CompositionInputs): Promise<GraphEngine> {
  const {
    container,
    traceData,
    pixi,
    viewportState,
    nodeMap,
    animationController,
    state,
    graphScale,
    callbacks,
  } = inputs;

  const { app, viewport, containers } = pixi;

  // Create title overlay
  const titleOverlay = createTitleOverlay(app.stage, {
    title: traceData.title ?? 'Trace',
    workflowId: traceData.workflowId ?? '',
  });

  // Create workflow manager
  const workflowManager = createWorkflowManager();

  // Create nodeAccessor
  const nodeAccessor = createNodeAccessor({ nodeMap });

  // Create selection controller with callbacks - centerOnNode bound later via bindCenterOnNode
  const selectionController = createSelectionController({
    nodeAccessor,
    getSelection: callbacks.selection.getSelection,
    getIsExpanded: callbacks.selection.getIsExpanded,
    onExpandNode: callbacks.selection.onExpandNode,
    onCollapseNode: callbacks.selection.onCollapseNode,
    onSelectStep: callbacks.selection.onSelectStep,
    onClearSelection: callbacks.selection.onClearSelection,
    onSetOverlayNode: callbacks.selection.onSetOverlayNode,
    onSetExpansionProgress: callbacks.selection.onSetExpansionProgress,
    onCollapseRequest: callbacks.selection.onCollapseRequest,
  });

  // Node creation dependencies (shared for all workflows)
  const nodeCreationDeps: NodeCreationDeps = {
    htmlContainer: container,
    pixiContainer: containers.workflowDetail,
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

  // Dynamic getters for bounds (always fresh, includes all workflows)
  const getTopNodeInfo = () => workflowManager.getTopNodeInfo();
  const getBottomNodeInfo = () => workflowManager.getBottomNodeInfo();

  // Create step labels for each workflow independently
  // Step labels belong to DETAIL view
  const workflowLabelData: WorkflowLabelData[] = workflowManager.getAll().map((wf) => ({
    workflowId: wf.workflowId,
    steps: wf.trace.steps,
    nodeMap: wf.nodeMap,
  }));
  const stepLabels = createWorkflowLabels(workflowLabelData);
  containers.workflowDetail.addChild(stepLabels.container);
  stepLabels.update(viewportState);

  // Create workflow renderer (handles edges and detail connector)
  const workflowRenderer = createWorkflowRenderer({
    container: containers.workflowDetail,
    workflowManager,
    mainWorkflowId,
  });
  workflowRenderer.initialize();

  // Calculate card positions from workflow node positions
  // Cards align with LEFT edge of workflow and are VERTICALLY CENTERED
  const cardPositions = new Map<string, { x: number; y: number }>();
  const workflows = workflowManager.getAll();

  for (const wf of workflows) {
    const leftX = calculateWorkflowLeftX(wf.nodeMap);
    const centerY = calculateWorkflowCenterY(wf.nodeMap);
    // Card origin is top-left, so subtract half card height to center it
    cardPositions.set(wf.workflowId, { x: leftX, y: centerY - WORKFLOW_CARD_HEIGHT / 2 });
  }

  // Create workflow card connectors for overview mode (add first for z-order)
  const cardConnectorRenderer = createWorkflowCardConnectorRenderer(containers.workflowOverview);
  const cardConnections = buildWorkflowConnections(workflows, mainWorkflowId, cardPositions);

  // Build obstacles from card positions for A* pathfinding
  const cardObstacles: CardObstacle[] = workflows.map((wf) => {
    const pos = cardPositions.get(wf.workflowId)!;
    return {
      id: wf.workflowId,
      x: pos.x,
      y: pos.y,
      width: WORKFLOW_CARD_WIDTH,
      height: WORKFLOW_CARD_HEIGHT,
    };
  });

  cardConnectorRenderer.render(cardConnections, cardObstacles);

  // Create workflow cards for overview mode
  const workflowCards = workflows.map((wf) => {
    const pos = cardPositions.get(wf.workflowId)!;
    const cardData: WorkflowCardData = {
      workflowId: wf.workflowId,
      title: wf.trace.title,
      steps: wf.trace.steps,
      date: new Date(),
      x: pos.x,
      y: pos.y,
    };
    return createWorkflowCard(cardData);
  });
  workflowCards.forEach((card) => containers.workflowOverview.addChild(card));

  // Create content session card for content session view
  const contentSessionCard = createContentSessionCard({
    sessionId: traceData.contentSessionId ?? 'session',
    workflowCount: workflows.length,
    x: cardPositions.get(mainWorkflowId)?.x ?? 0,
    y: cardPositions.get(mainWorkflowId)?.y ?? 0,
  });
  containers.contentSession.addChild(contentSessionCard);

  // Helper functions for view-aware bounds
  const getWorkflowCardBounds = (): { minX: number; maxX: number; minY: number; maxY: number } => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    cardPositions.forEach((pos) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + WORKFLOW_CARD_WIDTH);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y + WORKFLOW_CARD_HEIGHT);
    });

    return { minX, maxX, minY, maxY };
  };

  const getContentSessionCardBounds = (): { minX: number; maxX: number; minY: number; maxY: number } => {
    const mainPos = cardPositions.get(mainWorkflowId);
    if (!mainPos) {
      return { minX: 0, maxX: CONTENT_SESSION_CARD_WIDTH, minY: 0, maxY: CONTENT_SESSION_CARD_HEIGHT };
    }
    return {
      minX: mainPos.x,
      maxX: mainPos.x + CONTENT_SESSION_CARD_WIDTH,
      minY: mainPos.y,
      maxY: mainPos.y + CONTENT_SESSION_CARD_HEIGHT,
    };
  };

  // For user pan/zoom - no culling (PixiJS handles it naturally)
  const onUnculledViewportUpdate = (): void => {
    stepLabels.update(viewportState);
    callbacks.onViewportChange(viewportState);
    workflowRenderer.redrawEdges();
    const nodeId = state.selection?.type === 'node' ? state.selection.nodeId : null;
    workflowRenderer.setRenderState({ selectedNodeId: nodeId });
  };

  // For programmatic jumps - forces transform update before culling
  const onViewportUpdate = (): void => {
    stepLabels.update(viewportState);
    callbacks.onViewportChange(viewportState);
    workflowRenderer.redrawEdges();
    const nodeId = state.selection?.type === 'node' ? state.selection.nodeId : null;
    workflowRenderer.setRenderState({ selectedNodeId: nodeId });
    const currentContainer = getContainerForLevel(containers, viewLevel.current);
    Culler.shared.cull(currentContainer, app.screen, false);
  };

  // Create viewportManager with view-level-aware bounds
  const viewportManager = createViewportManager({
    nodeAccessor,
    viewport,
    viewportState,
    onUpdate: onViewportUpdate,
    getTopNodeInfo,
    getBottomNodeInfo,
    setContainerScale: (scale: number) => {
      const currentContainer = getContainerForLevel(containers, viewLevel.current);
      currentContainer.scale.set(scale);
    },
    getCurrentViewLevel: () => viewLevel.current,
    getWorkflowCardBounds,
    getContentSessionCardBounds,
  });

  // Create view container controller for 3-level zoom hierarchy
  const viewContainerController = createViewContainerController({
    containers,
    setPositionForCurrentView: () => viewportManager.setPositionForCurrentView(),
    render: () => app.render(),
  });

  // Wire up late binding for centerOnNode
  selectionController.bindCenterOnNode((nodeId, opts) => viewportManager.centerOnNode(nodeId, opts));

  // Create keyboard navigation (uses nodeAccessor for all workflows)
  const keyboardNavigation = createKeyboardNavigation({
    nodeAccessor,
    steps: traceData.steps,
    onExpand: (node) => selectionController.expand(node),
    onCollapse: () => selectionController.collapse(),
    onStepSelect: () => {},
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
      // Clamp scale to boundaries for ALL view levels (no zoom-wheel transitions)
      const actualScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale));
      viewportState.scale = actualScale;
      const currentContainer = getContainerForLevel(containers, viewLevel.current);
      currentContainer.scale.set(actualScale);
      checkTextSimplifyThreshold(actualScale);
      onUnculledViewportUpdate();
      return { actualScale };
    },
    onPan: onViewportUpdate,
    onPanStart: () => {},
    onPanEnd: () => {},
    isZoomBlocked: () => viewLevel.isTransitioning,
    isInteractionBlocked: () => state.detailPanelOpen,
    getBounds: () => {
      // Get bounds based on current view level
      let contentTop: number;
      let contentBottom: number;

      if (viewLevel.current === 'content-session') {
        const bounds = getContentSessionCardBounds();
        contentTop = bounds.minY;
        contentBottom = bounds.maxY;
      } else if (viewLevel.current === 'workflow-overview') {
        const bounds = getWorkflowCardBounds();
        contentTop = bounds.minY;
        contentBottom = bounds.maxY;
      } else {
        // workflow-detail: use node bounds
        const topInfo = getTopNodeInfo();
        const bottomInfo = getBottomNodeInfo();
        if (!topInfo || !bottomInfo) return null;
        contentTop = topInfo.worldY - topInfo.halfHeight;
        contentBottom = bottomInfo.worldY + bottomInfo.halfHeight;
      }

      const contentHeight = contentBottom - contentTop;
      const contentCenter = (contentTop + contentBottom) / 2;

      // Worldspace is 2x content height plus 200px buffer all around
      const worldspaceHalf = contentHeight + 200;

      return {
        topWorldY: contentCenter - worldspaceHalf,
        bottomWorldY: contentCenter + worldspaceHalf,
        topMargin: getCssVarInt('--header-height'),
        bottomMargin: getCssVarInt('--space-3xl'),
      };
    },
  });

  // Create resize handler
  const resizeHandler = createResizeHandler({
    container,
    viewportState,
    app,
    onUpdate: onViewportUpdate,
    centerSelectedNode: (nodeId) => viewportManager.centerOnNode(nodeId, { zoom: true }),
    getDetailPanelOpen: () => state.detailPanelOpen,
    getSelectedNodeId: () => state.selection?.type === 'node' ? state.selection.nodeId : null,
  });

  // Initial viewport update
  onUnculledViewportUpdate();

  // Create and return engine
  return createGraphEngine({
    pixi,
    nodeMap,
    edges: traceData.edges,
    nodeAccessor,
    viewportManager,
    selectionController,
    keyboardNavigation,
    viewContainerController,
    viewportState,
    animationController,
    stepLabels,
    titleOverlay,
    resizeHandler,
    viewportHandlers,
    workflowRenderer,
    state,
    onViewportUpdate,
  });
}
