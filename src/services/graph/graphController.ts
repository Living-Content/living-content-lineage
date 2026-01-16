/**
 * Graph controller using Pixi.js for WebGL rendering.
 * Orchestrates viewport, LOD, and rendering modules.
 * Nodes use Pixi's built-in cullable property for automatic off-screen culling.
 */
import { Application, Container, Culler } from 'pixi.js';
import { loadManifest } from '../../manifest/registry.js';
import type { LineageGraph, LineageNodeData } from '../../types.js';
import { createPillNode, type PillNode, DEFAULT_NODE_ALPHA } from './nodeRenderer.js';
import { renderEdges } from './edgeRenderer.js';
import { renderMetaEdges } from './metaEdgeRenderer.js';
import { renderStageLabels, type TopNodeInfo } from './stageLabelRenderer.js';
import { createViewportState, createViewportHandlers } from './viewport.js';
import { createLODController, type LODLayers } from './lodController.js';
import { createTitleOverlay } from './titleOverlay.js';
import { LOD_THRESHOLD, META_NODE_SCALE } from '../../config/constants.js';

interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

interface GraphControllerCallbacks {
  onNodeSelect: (nodeData: LineageNodeData) => void;
  onStageSelect: (stageLabel: string, nodes: LineageNodeData[], edges: LineageGraph['edges']) => void;
  onSelectionClear: () => void;
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
  let lineageData: LineageGraph;
  try {
    lineageData = await loadManifest(manifestUrl);
  } catch (error) {
    console.error('Failed to load lineage manifest', error);
    callbacks.onError('Unable to load manifest data.');
    return null;
  }

  callbacks.onLoaded(lineageData);

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

  const viewport = new Container();
  app.stage.addChild(viewport);

  const edgeLayer = new Container();
  const nodeLayer = new Container();
  const metaNodeLayer = new Container();
  const metaEdgeLayer = new Container();
  viewport.addChild(edgeLayer);
  viewport.addChild(nodeLayer);
  viewport.addChild(metaNodeLayer);
  viewport.addChild(metaEdgeLayer);
  metaNodeLayer.visible = false;
  metaEdgeLayer.visible = false;

  const stageLayer = new Container();
  app.stage.addChild(stageLayer);

  const titleOverlay = createTitleOverlay(app.stage);

  const viewportState = createViewportState(width, height);
  viewport.scale.set(viewportState.scale);
  viewport.position.set(viewportState.x, viewportState.y);

  const nodeMap = new Map<string, PillNode>();
  const metaNodeMap = new Map<string, PillNode>();
  let selectedNodeId: string | null = null;

  const animatingNodes = new Map<string, number>();
  let nodeAlphaAnimationId: number | null = null;

  function animateNodeAlpha(): void {
    const toRemove: string[] = [];
    animatingNodes.forEach((target, id) => {
      const pillNode = nodeMap.get(id);
      if (!pillNode) {
        toRemove.push(id);
        return;
      }
      const diff = target - pillNode.alpha;
      if (Math.abs(diff) > 0.01) {
        pillNode.alpha += diff * 0.2;
      } else {
        pillNode.alpha = target;
        toRemove.push(id);
      }
    });
    toRemove.forEach((id) => animatingNodes.delete(id));
    nodeAlphaAnimationId = animatingNodes.size > 0
      ? requestAnimationFrame(animateNodeAlpha)
      : null;
  }

  function setNodeAlpha(nodeId: string, alpha: number): void {
    animatingNodes.set(nodeId, alpha);
    if (nodeAlphaAnimationId === null) {
      nodeAlphaAnimationId = requestAnimationFrame(animateNodeAlpha);
    }
  }

  for (const node of lineageData.nodes) {
    const pillNode = createPillNode(node, graphScale, app.ticker, {
      onClick: () => {
        if (selectedNodeId && selectedNodeId !== node.id) {
          setNodeAlpha(selectedNodeId, DEFAULT_NODE_ALPHA);
        }
        selectedNodeId = node.id;
        setNodeAlpha(node.id, 1);
        callbacks.onSelectionClear();
        callbacks.onNodeSelect(node);
      },
      onHover: () => {
        container.style.cursor = 'pointer';
        setNodeAlpha(node.id, 1);
        const bounds = pillNode.getBounds();
        callbacks.onHover({
          title: node.label,
          nodeType: node.nodeType,
          screenX: bounds.x + bounds.width / 2,
          screenY: bounds.y,
          size: 28,
        });
      },
      onHoverEnd: () => {
        container.style.cursor = 'grab';
        if (selectedNodeId !== node.id) {
          setNodeAlpha(node.id, DEFAULT_NODE_ALPHA);
        }
        callbacks.onHoverEnd();
      },
    });
    nodeLayer.addChild(pillNode);
    nodeMap.set(node.id, pillNode);
  }

  for (const stage of lineageData.stages) {
    const stageNodes = lineageData.nodes.filter((n) => n.stage === stage.id);
    const metaNode: LineageNodeData = {
      id: `meta-${stage.id}`,
      label: `${stage.label} (${stageNodes.length})`,
      nodeType: 'meta',
      shape: 'circle',
      stage: stage.id,
      x: (stage.xStart + stage.xEnd) / 2,
      y: 0.5,
    };

    const pillNode = createPillNode(metaNode, graphScale, app.ticker, {
      onClick: () => {
        const stageEdges = lineageData.edges.filter(
          (e) => stageNodes.some((n) => n.id === e.source) || stageNodes.some((n) => n.id === e.target)
        );
        callbacks.onStageSelect(stage.label, stageNodes, stageEdges);
      },
      onHover: () => {
        container.style.cursor = 'pointer';
        const bounds = pillNode.getBounds();
        callbacks.onHover({
          title: stage.label,
          nodeType: 'meta',
          screenX: bounds.x + bounds.width / 2,
          screenY: bounds.y,
          size: 40,
        });
      },
      onHoverEnd: () => {
        container.style.cursor = 'grab';
        callbacks.onHoverEnd();
      },
    }, { scale: META_NODE_SCALE });
    metaNodeLayer.addChild(pillNode);
    metaNodeMap.set(stage.id, pillNode);
  }

  renderMetaEdges(metaEdgeLayer, lineageData.stages, metaNodeMap);

  const lodLayers: LODLayers = { nodeLayer, edgeLayer, metaNodeLayer, metaEdgeLayer, stageLayer };

  const lodController = createLODController(nodeMap, metaNodeMap, lineageData.stages, lodLayers, {
    onCollapseEnd: () => {
      titleOverlay.setVisible(true);
      updateTitlePosition();
    },
    onExpandEnd: () => {
      titleOverlay.setVisible(false);
      updateStageLabels();
      cullAndRender();
    },
  });

  function updateTitlePosition(): void {
    const firstStage = lineageData.stages[0];
    if (!firstStage) return;
    const leftmostNode = metaNodeMap.get(firstStage.id);
    if (!leftmostNode) return;
    titleOverlay.updatePosition(leftmostNode, viewportState);
  }

  const topNodeInfo: TopNodeInfo | null = (() => {
    let minWorldY = Infinity;
    let halfHeight = 0;
    nodeMap.forEach((pillNode) => {
      if (pillNode.position.y < minWorldY) {
        minWorldY = pillNode.position.y;
        halfHeight = pillNode.pillHeight / 2;
      }
    });
    return minWorldY === Infinity ? null : { worldY: minWorldY, halfHeight };
  })();

  function updateStageLabels(): void {
    renderStageLabels(stageLayer, lineageData.stages, viewportState, graphScale, topNodeInfo);
  }

  updateStageLabels();

  function cullAndRender(): void {
    if (lodController.state.isCollapsed) return;
    Culler.shared.cull(nodeLayer, app.screen);
    renderEdges(edgeLayer, lineageData.edges, nodeMap);
  }

  cullAndRender();

  const viewportHandlers = createViewportHandlers(app.canvas, viewport, container, viewportState, {
    onZoom: (scale) => {
      lodController.checkThreshold(scale);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) {
        updateStageLabels();
        cullAndRender();
      } else if (lodController.state.isCollapsed) {
        updateTitlePosition();
      }
      callbacks.onSimpleViewChange(scale < LOD_THRESHOLD);
    },
    onPan: () => {
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) {
        updateStageLabels();
        cullAndRender();
      } else if (lodController.state.isCollapsed) {
        updateTitlePosition();
      }
    },
    onPanStart: () => {},
    onPanEnd: () => {},
    isZoomBlocked: () => lodController.state.isAnimating,
  });

  const resizeObserver = new ResizeObserver(() => app.resize());
  resizeObserver.observe(container);

  return {
    destroy: () => {
      viewportHandlers.destroy();
      resizeObserver.disconnect();
      titleOverlay.destroy();
      nodeMap.forEach((node) => node.destroy());
      app.destroy(true, { children: true });
    },
  };
}
