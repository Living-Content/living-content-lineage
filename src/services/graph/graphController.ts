/**
 * Graph controller using Pixi.js for WebGL rendering.
 * Orchestrates viewport, LOD, and rendering modules.
 * Nodes use Pixi's built-in cullable property for automatic off-screen culling.
 */
import { Application, Container, Culler } from 'pixi.js';
import { loadManifest } from '../../manifest/registry.js';
import type { LineageGraph, LineageNodeData } from '../../types.js';
import { createPillNode, type PillNode, type PillRenderOptions, DEFAULT_NODE_ALPHA } from './nodeRenderer.js';
import { createIconNode } from './iconNodeRenderer.js';
import { renderEdges } from './edgeRenderer.js';
import { getIconNodeConfig, PHASE_ICON_PATHS } from '../../ui/theme.js';
import { renderStageEdges } from './stageEdgeRenderer.js';
import { renderStageLabels, type TopNodeInfo } from './stageLabelRenderer.js';
import { createViewportState, createViewportHandlers } from './viewport.js';
import { createLODController, type LODLayers } from './lodController.js';
import { createTitleOverlay } from './titleOverlay.js';
import { LOD_THRESHOLD, STAGE_NODE_SCALE, FADED_NODE_ALPHA } from '../../config/constants.js';

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
  onSimpleViewChange: (isSimple: boolean) => void;
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
  onLoaded: (data: LineageGraph) => void;
  onError: (message: string) => void;
}

export interface GraphController {
  destroy: () => void;
  clearSelection: () => void;
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
  const stageNodeLayer = new Container();
  const stageEdgeLayer = new Container();
  viewport.addChild(edgeLayer);
  viewport.addChild(nodeLayer);
  viewport.addChild(stageNodeLayer);
  viewport.addChild(stageEdgeLayer);
  stageNodeLayer.visible = false;
  stageEdgeLayer.visible = false;

  const stageLayer = new Container();
  app.stage.addChild(stageLayer);

  const titleOverlay = createTitleOverlay(app.stage);

  const viewportState = createViewportState(width, height);
  viewport.scale.set(viewportState.scale);
  viewport.position.set(viewportState.x, viewportState.y);

  const nodeMap = new Map<string, PillNode>();
  const stageNodeMap = new Map<string, PillNode>();
  let selectedNodeId: string | null = null;

  const nodePositions = new Map<string, { x: number; y: number }>();
  for (const node of lineageData.nodes) {
    nodePositions.set(node.id, { x: node.x ?? 0.5, y: node.y ?? 0.5 });
  }

  const verticalAdjacencyMap = new Map<string, Set<string>>();
  for (const edge of lineageData.edges) {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);
    if (!sourcePos || !targetPos) continue;

    const dx = Math.abs(targetPos.x - sourcePos.x);
    const dy = Math.abs(targetPos.y - sourcePos.y);
    const isVertical = dy > dx;

    if (isVertical) {
      if (!verticalAdjacencyMap.has(edge.source)) verticalAdjacencyMap.set(edge.source, new Set());
      if (!verticalAdjacencyMap.has(edge.target)) verticalAdjacencyMap.set(edge.target, new Set());
      verticalAdjacencyMap.get(edge.source)!.add(edge.target);
      verticalAdjacencyMap.get(edge.target)!.add(edge.source);
    }
  }

  function getVerticallyConnectedNodeIds(nodeId: string): Set<string> {
    const connected = new Set<string>();
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = verticalAdjacencyMap.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          connected.add(neighbor);
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }

    return connected;
  }

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

  function applySelectionHighlight(selectedId: string): void {
    const verticallyConnected = getVerticallyConnectedNodeIds(selectedId);
    nodeMap.forEach((_, nodeId) => {
      if (nodeId === selectedId || verticallyConnected.has(nodeId)) {
        setNodeAlpha(nodeId, 1);
      } else {
        setNodeAlpha(nodeId, FADED_NODE_ALPHA);
      }
    });
    renderEdges(edgeLayer, lineageData.edges, nodeMap, selectedId, verticallyConnected);
  }

  function clearSelectionHighlight(): void {
    selectedNodeId = null;
    nodeMap.forEach((_, nodeId) => {
      setNodeAlpha(nodeId, DEFAULT_NODE_ALPHA);
    });
    renderEdges(edgeLayer, lineageData.edges, nodeMap, null, null);
  }

  const nodeCreationPromises: Promise<void>[] = [];

  for (const node of lineageData.nodes) {
    const nodeCallbacks = {
      onClick: () => {
        selectedNodeId = node.id;
        applySelectionHighlight(node.id);
        callbacks.onNodeSelect(node);
      },
      onHover: () => {
        container.style.cursor = 'pointer';
        if (!selectedNodeId) {
          setNodeAlpha(node.id, 1);
        }
        const renderedNode = nodeMap.get(node.id);
        if (renderedNode) {
          const bounds = renderedNode.getBounds();
          const hoverIconConfig = getIconNodeConfig(node.nodeType);
          callbacks.onHover({
            title: node.label,
            nodeType: node.nodeType,
            screenX: bounds.x + bounds.width / 2,
            screenY: bounds.y,
            size: hoverIconConfig?.size ?? 28,
          });
        }
      },
      onHoverEnd: () => {
        container.style.cursor = 'grab';
        if (!selectedNodeId) {
          setNodeAlpha(node.id, DEFAULT_NODE_ALPHA);
        }
        callbacks.onHoverEnd();
      },
    };

    const iconConfig = getIconNodeConfig(node.nodeType);
    if (iconConfig) {
      const promise = createIconNode(node, graphScale, app.ticker, nodeCallbacks, {
        iconPath: iconConfig.iconPath,
        size: iconConfig.size,
      }).then((iconNode) => {
        nodeLayer.addChild(iconNode);
        nodeMap.set(node.id, iconNode);
      });
      nodeCreationPromises.push(promise);
    } else {
      const pillNode = createPillNode(node, graphScale, app.ticker, nodeCallbacks);
      nodeLayer.addChild(pillNode);
      nodeMap.set(node.id, pillNode);
    }
  }

  await Promise.all(nodeCreationPromises);

  for (const stage of lineageData.stages) {
    const stageNodes = lineageData.nodes.filter((n) => n.stage === stage.id);
    const stageNodeData: LineageNodeData = {
      id: `stage-${stage.id}`,
      label: stage.label,
      nodeType: 'stage',
      shape: 'circle',
      stage: stage.id,
      x: (stage.xStart + stage.xEnd) / 2,
      y: 0.5,
    };

    // Get phase icon path, defaulting to Reasoning if no phase specified
    const phaseIconPath = stage.phase
      ? PHASE_ICON_PATHS[stage.phase]
      : PHASE_ICON_PATHS.Reasoning;

    const stageRenderOptions: PillRenderOptions = {
      mode: 'simple',
      iconPath: phaseIconPath,
      typeLabel: stage.label,
    };

    const pillNode = createPillNode(stageNodeData, graphScale, app.ticker, {
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
          nodeType: 'stage',
          screenX: bounds.x + bounds.width / 2,
          screenY: bounds.y,
          size: 40,
        });
      },
      onHoverEnd: () => {
        container.style.cursor = 'grab';
        callbacks.onHoverEnd();
      },
    }, { scale: STAGE_NODE_SCALE, renderOptions: stageRenderOptions });
    stageNodeLayer.addChild(pillNode);
    stageNodeMap.set(stage.id, pillNode);
  }

  renderStageEdges(stageEdgeLayer, lineageData.stages, stageNodeMap);

  const lodLayers: LODLayers = { nodeLayer, edgeLayer, stageNodeLayer, stageEdgeLayer, stageLayer };

  const lodController = createLODController(nodeMap, stageNodeMap, lineageData.stages, lodLayers, {
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
    const leftmostNode = stageNodeMap.get(firstStage.id);
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
    const verticallyConnected = selectedNodeId
      ? getVerticallyConnectedNodeIds(selectedNodeId)
      : null;
    renderEdges(edgeLayer, lineageData.edges, nodeMap, selectedNodeId, verticallyConnected);
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
    clearSelection: clearSelectionHighlight,
  };
}
