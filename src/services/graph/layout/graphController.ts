/**
 * Graph controller using Pixi.js for WebGL rendering.
 * Orchestrates viewport, LOD, and rendering modules.
 */
import { Application, Container, Culler } from 'pixi.js';
import { loadManifest } from '../../manifest/registry.js';
import type { LineageGraph } from '../../../config/types.js';
import type { PillNode } from '../rendering/nodeRenderer.js';
import { renderEdges } from '../rendering/edgeRenderer.js';
import { renderStageEdges } from '../rendering/stageEdgeRenderer.js';
import { createStageLabels } from '../rendering/stageLabelRenderer.js';
import { createViewportState, createViewportHandlers } from '../interaction/viewport.js';
import { createLODController, type LODLayers } from './lodController.js';
import { createTitleOverlay } from '../rendering/titleOverlay.js';
import { LOD_THRESHOLD, PANEL_DETAIL_MAX_WIDTH, PANEL_MARGIN, MOBILE_BREAKPOINT } from '../../../config/constants.js';
import { selectedNode, selectedStage, clearSelection } from '../../../stores/lineageState.js';
import { isDetailOpen } from '../../../stores/uiState.js';
import { buildVerticalAdjacencyMap, applySelectionHighlight, applyStageSelectionHighlight, clearSelectionVisuals, type SelectionHighlighterDeps } from '../interaction/selectionHighlighter.js';
import { createNodeAnimationController } from '../../animation/nodeAnimationController.js';
import { createNodes, repositionNodesWithGaps } from './nodeCreator.js';
import { recalculateStageBounds, createStageNodes, calculateTopNodeInfo } from './stageCreator.js';
import gsap from 'gsap';

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
  onError: (message: string) => void;
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
    callbacks.onError('Unable to load manifest data.');
    return null;
  }
  callbacks.onLoaded(lineageData);

  // Initialize Pixi application
  const app = new Application();
  await app.init({
    resizeTo: container,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  container.appendChild(app.canvas);

  const width = container.clientWidth;
  const height = container.clientHeight;
  const graphScale = Math.min(width, height) * 1.5;

  // Create layer hierarchy
  const viewport = new Container();
  app.stage.addChild(viewport);

  const selectionLayer = new Container();
  const edgeLayer = new Container();
  const nodeLayer = new Container();
  const dotLayer = new Container();
  const stageEdgeLayer = new Container();
  const stageNodeLayer = new Container();
  viewport.addChild(selectionLayer, edgeLayer, nodeLayer, dotLayer, stageEdgeLayer, stageNodeLayer);
  stageEdgeLayer.visible = false;
  stageNodeLayer.visible = false;

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
  const nodeMap = new Map<string, PillNode>();
  const stageNodeMap = new Map<string, PillNode>();

  // Selection state
  let selectedNodeId: string | null = null;
  let selectedStageId: string | null = null;
  let detailPanelOpen = false;

  // Build adjacency map and animation controller
  const verticalAdjacency = buildVerticalAdjacencyMap(lineageData.nodes, lineageData.edges);
  const animationController = createNodeAnimationController(nodeMap);

  const getHighlighterDeps = (): SelectionHighlighterDeps => ({
    nodeMap, stageNodeMap, edgeLayer, dotLayer, stageEdgeLayer,
    edges: lineageData.edges, stages: lineageData.stages,
    verticalAdjacency, setNodeAlpha: animationController.setNodeAlpha,
  });

  // Create nodes
  await createNodes(lineageData.nodes, nodeMap, {
    container, nodeLayer, selectionLayer, graphScale, ticker: app.ticker,
    callbacks: { onHover: callbacks.onHover, onHoverEnd: callbacks.onHoverEnd },
    getSelectedNodeId: () => selectedNodeId,
    setNodeAlpha: animationController.setNodeAlpha,
  });

  repositionNodesWithGaps(nodeMap);
  recalculateStageBounds(lineageData.stages, nodeMap, graphScale);

  // Create stage nodes
  createStageNodes(lineageData.stages, lineageData.nodes, lineageData.edges, stageNodeMap, {
    container, stageNodeLayer, selectionLayer, graphScale, ticker: app.ticker,
    callbacks: { onHover: callbacks.onHover, onHoverEnd: callbacks.onHoverEnd },
  });

  renderStageEdges(stageEdgeLayer, lineageData.stages, stageNodeMap);

  // Stage labels
  const topNodeInfo = calculateTopNodeInfo(nodeMap);
  const stageLabels = createStageLabels(lineageData.stages, stageNodeMap, topNodeInfo);
  app.stage.addChild(stageLabels.container);
  stageLabels.update(viewportState);

  // Helper functions
  const updateTitlePosition = (): void => {
    const firstStage = lineageData.stages[0];
    const leftmostNode = firstStage ? stageNodeMap.get(firstStage.id) : null;
    if (leftmostNode) titleOverlay.updatePosition(leftmostNode, viewportState);
  };

  const cullAndRender = (): void => {
    if (lodController.state.isCollapsed) return;
    Culler.shared.cull(nodeLayer, app.screen);
    const connected = selectedNodeId ? verticalAdjacency.getConnectedNodeIds(selectedNodeId) : null;
    renderEdges(edgeLayer, dotLayer, lineageData.edges, nodeMap, selectedNodeId, connected);
  };

  const centerSelectedNode = (nodeId: string): void => {
    const node = nodeMap.get(nodeId);
    if (!node || viewportState.width <= MOBILE_BREAKPOINT) return;

    const panelWidth = Math.min(viewportState.width * 0.5 - PANEL_MARGIN * 2, PANEL_DETAIL_MAX_WIDTH) + PANEL_MARGIN * 2;
    const targetX = panelWidth + (viewportState.width - panelWidth) / 2 - node.position.x * viewportState.scale;
    const targetY = viewportState.height / 2 - node.position.y * viewportState.scale;

    gsap.to(viewportState, {
      x: targetX, y: targetY, duration: 0.3, ease: 'power2.out',
      onUpdate: () => {
        viewport.position.set(viewportState.x, viewportState.y);
        stageLabels.update(viewportState);
        cullAndRender();
      },
    });
  };

  // LOD controller
  const lodLayers: LODLayers = { nodeLayer, edgeLayer, dotLayer, stageNodeLayer, stageEdgeLayer, stageLayer: stageLabels.container };
  const lodController = createLODController(lodLayers, {
    onCollapseStart: () => { clearSelection(); titleOverlay.setMode('relative'); },
    onCollapseEnd: updateTitlePosition,
    onExpandStart: () => { clearSelection(); titleOverlay.setMode('fixed'); },
    onExpandEnd: () => { stageLabels.update(viewportState); cullAndRender(); },
  });

  // Store subscriptions
  const unsubscribeNode = selectedNode.subscribe((node) => {
    selectedNodeId = node?.id ?? null;
    if (node) {
      stageNodeMap.forEach((n) => n.setSelected(false));
      applySelectionHighlight(node.id, getHighlighterDeps());
      if (detailPanelOpen) centerSelectedNode(node.id);
    } else if (!selectedStageId) {
      clearSelectionVisuals(getHighlighterDeps());
    }
  });

  const unsubscribeStage = selectedStage.subscribe((stage) => {
    selectedStageId = stage?.stageId ?? null;
    if (stage) {
      applyStageSelectionHighlight(stage.stageId, getHighlighterDeps());
      renderEdges(edgeLayer, dotLayer, lineageData.edges, nodeMap, null, null);
    } else if (!selectedNodeId) {
      clearSelectionVisuals(getHighlighterDeps());
    }
  });

  const unsubscribeDetail = isDetailOpen.subscribe((open) => {
    detailPanelOpen = open;
    if (open && selectedNodeId) centerSelectedNode(selectedNodeId);
  });

  // Viewport handlers
  const viewportHandlers = createViewportHandlers(app.canvas, viewport, container, viewportState, {
    onZoom: (scale) => {
      lodController.checkThreshold(scale);
      stageLabels.update(viewportState);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) cullAndRender();
      else if (lodController.state.isCollapsed) updateTitlePosition();
      callbacks.onSimpleViewChange(scale < LOD_THRESHOLD);
    },
    onPan: () => {
      stageLabels.update(viewportState);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) cullAndRender();
      else if (lodController.state.isCollapsed) updateTitlePosition();
    },
    onPanStart: () => {},
    onPanEnd: () => {},
    isZoomBlocked: () => lodController.state.isAnimating,
  });

  // Resize handling
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  const resizeObserver = new ResizeObserver(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      viewportState.width = container.clientWidth;
      viewportState.height = container.clientHeight;
      app.resize();
      stageLabels.update(viewportState);
      if (detailPanelOpen && selectedNodeId) centerSelectedNode(selectedNodeId);
      if (!lodController.state.isCollapsed) cullAndRender();
      else updateTitlePosition();
    }, 100);
  });
  resizeObserver.observe(container);

  cullAndRender();

  return {
    destroy: () => {
      unsubscribeNode();
      unsubscribeStage();
      unsubscribeDetail();
      viewportHandlers.destroy();
      resizeObserver.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      animationController.cleanup();
      titleOverlay.destroy();
      nodeMap.forEach((node) => node.destroy());
      app.destroy(true, { children: true });
    },
  };
}
