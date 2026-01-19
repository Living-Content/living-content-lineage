/**
 * Graph controller using Pixi.js for WebGL rendering.
 * Orchestrates viewport, LOD, and rendering modules.
 */
import { Culler } from 'pixi.js';
import { loadManifest } from '../../manifest/registry.js';
import { ManifestLoadError, type ManifestErrorInfo } from '../../manifest/errors.js';
import type { LineageGraph } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import { renderEdges } from '../rendering/edgeRenderer.js';
import { renderWorkflowEdges } from '../rendering/workflowEdgeRenderer.js';
import { createWorkflowLabels } from '../rendering/workflowLabelRenderer.js';
import { createViewportState, createViewportHandlers } from '../interaction/viewport.js';
import { createLODController, type LODLayers } from './lodController.js';
import { createTitleOverlay } from '../rendering/titleOverlay.js';
import { LOD_THRESHOLD } from '../../../config/constants.js';
import { clearSelection } from '../../../stores/lineageState.js';
import { buildVerticalAdjacencyMap } from '../interaction/selectionHighlighter.js';
import { createNodeAnimationController } from '../interaction/nodeAnimationController.js';
import { createNodes, repositionNodesWithGaps } from './nodeCreator.js';
import { recalculateWorkflowBounds, createWorkflowNodes, calculateTopNodeInfo } from './workflowCreator.js';
import { initializePixi } from './pixiSetup.js';
import { createStoreSubscriptions } from './graphSubscriptions.js';
import { createViewportManager, createResizeHandler } from './viewportManager.js';

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
  onLoaded: (data: LineageGraph) => void;
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
  let lineageData: LineageGraph;
  try {
    lineageData = await loadManifest(manifestUrl);
  } catch (error) {
    console.error('Failed to load lineage manifest', error);
    callbacks.onError({
      message: 'Failed to load manifest',
      details: error instanceof ManifestLoadError ? error.message : String(error),
      failedAssets: error instanceof ManifestLoadError ? error.failedAssets : undefined,
    });
    return null;
  }
  callbacks.onLoaded(lineageData);

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
    title: lineageData.title ?? 'Lineage',
    lineageId: lineageData.lineageId ?? '',
  });

  // Node maps
  const nodeMap = new Map<string, GraphNode>();
  const workflowNodeMap = new Map<string, GraphNode>();

  // Build adjacency map and animation controller
  const verticalAdjacency = buildVerticalAdjacencyMap(lineageData.nodes, lineageData.edges);
  const animationController = createNodeAnimationController(nodeMap);

  // Create nodes
  await createNodes(lineageData.nodes, nodeMap, {
    container,
    nodeLayer: layers.nodeLayer,
    selectionLayer: layers.selectionLayer,
    graphScale,
    ticker: app.ticker,
    callbacks: { onHover: callbacks.onHover, onHoverEnd: callbacks.onHoverEnd },
    getSelectedNodeId: () => subscriptions.state.selectedNodeId,
    setNodeAlpha: animationController.setNodeAlpha,
  });

  repositionNodesWithGaps(nodeMap);
  recalculateWorkflowBounds(lineageData.workflows, nodeMap, graphScale);

  // Create workflow nodes
  createWorkflowNodes(lineageData.workflows, lineageData.nodes, lineageData.edges, workflowNodeMap, {
    container,
    workflowNodeLayer: layers.workflowNodeLayer,
    selectionLayer: layers.selectionLayer,
    graphScale,
    ticker: app.ticker,
    callbacks: { onHover: callbacks.onHover, onHoverEnd: callbacks.onHoverEnd },
  });

  renderWorkflowEdges(layers.workflowEdgeLayer, lineageData.workflows, workflowNodeMap);

  // Workflow labels
  const topNodeInfo = calculateTopNodeInfo(nodeMap);
  const workflowLabels = createWorkflowLabels(lineageData.workflows, workflowNodeMap, topNodeInfo);
  app.stage.addChild(workflowLabels.container);
  workflowLabels.update(viewportState);

  // Helper functions
  const updateTitlePosition = (): void => {
    const firstWorkflow = lineageData.workflows[0];
    const leftmostNode = firstWorkflow ? workflowNodeMap.get(firstWorkflow.id) : null;
    if (leftmostNode) titleOverlay.updatePosition(leftmostNode, viewportState);
  };

  const cullAndRender = (): void => {
    if (lodController.state.isCollapsed) return;
    Culler.shared.cull(layers.nodeLayer, app.screen);
    const nodeId = subscriptions.state.selectedNodeId;
    const connected = nodeId ? verticalAdjacency.getConnectedNodeIds(nodeId) : null;
    renderEdges(layers.edgeLayer, layers.dotLayer, lineageData.edges, nodeMap, nodeId, connected);
  };

  // LOD controller
  const lodLayers: LODLayers = {
    nodeLayer: layers.nodeLayer,
    edgeLayer: layers.edgeLayer,
    dotLayer: layers.dotLayer,
    workflowNodeLayer: layers.workflowNodeLayer,
    workflowEdgeLayer: layers.workflowEdgeLayer,
    workflowLayer: workflowLabels.container,
  };

  const lodController = createLODController(lodLayers, {
    onCollapseStart: () => { clearSelection(); titleOverlay.setMode('relative'); },
    onCollapseEnd: updateTitlePosition,
    onExpandStart: () => { clearSelection(); titleOverlay.setMode('fixed'); },
    onExpandEnd: () => { workflowLabels.update(viewportState); cullAndRender(); },
  });

  // Viewport manager
  const viewportManager = createViewportManager({
    nodeMap,
    viewport,
    viewportState,
    workflowLabelsUpdate: workflowLabels.update,
    cullAndRender,
  });

  // Store subscriptions
  const subscriptions = createStoreSubscriptions({
    nodeMap,
    workflowNodeMap,
    edgeLayer: layers.edgeLayer,
    dotLayer: layers.dotLayer,
    workflowEdgeLayer: layers.workflowEdgeLayer,
    edges: lineageData.edges,
    workflows: lineageData.workflows,
    verticalAdjacency,
    setNodeAlpha: animationController.setNodeAlpha,
    centerSelectedNode: viewportManager.centerOnNode,
  });

  // Viewport handlers
  const viewportHandlers = createViewportHandlers(app.canvas, viewport, container, viewportState, {
    onZoom: (scale) => {
      lodController.checkThreshold(scale);
      workflowLabels.update(viewportState);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) cullAndRender();
      else if (lodController.state.isCollapsed) updateTitlePosition();
      callbacks.onSimpleViewChange(scale < LOD_THRESHOLD);
    },
    onPan: () => {
      workflowLabels.update(viewportState);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) cullAndRender();
      else if (lodController.state.isCollapsed) updateTitlePosition();
    },
    onPanStart: () => {},
    onPanEnd: () => {},
    isZoomBlocked: () => lodController.state.isAnimating,
  });

  // Resize handling
  const resizeHandler = createResizeHandler({
    container,
    viewportState,
    app,
    workflowLabelsUpdate: workflowLabels.update,
    cullAndRender,
    updateTitlePosition,
    centerSelectedNode: viewportManager.centerOnNode,
    isCollapsed: () => lodController.state.isCollapsed,
    getDetailPanelOpen: () => subscriptions.state.detailPanelOpen,
    getSelectedNodeId: () => subscriptions.state.selectedNodeId,
  });

  cullAndRender();

  return {
    destroy: () => {
      subscriptions.unsubscribe();
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
