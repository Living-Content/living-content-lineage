/**
 * Graph controller using Pixi.js for WebGL rendering.
 * Orchestrates viewport, LOD, and rendering modules.
 * Nodes use Pixi's built-in cullable property for automatic off-screen culling.
 *
 * Selection is managed by Svelte stores (single source of truth).
 * The controller subscribes to selection changes and updates visuals accordingly.
 */
import { Application, Container, Culler } from 'pixi.js';
import { loadManifest } from '../../manifest/registry.js';
import type { LineageGraph, LineageNodeData } from '../../types.js';
import { createPillNode, type PillNode, type PillRenderOptions, DEFAULT_NODE_ALPHA } from './nodeRenderer.js';
import { createIconNode } from './iconNodeRenderer.js';
import { renderEdges } from './edgeRenderer.js';
import { getIconNodeConfig, PHASE_ICON_PATHS } from '../../ui/theme.js';
import { renderStageEdges } from './stageEdgeRenderer.js';
import { createStageLabels, type TopNodeInfo } from './stageLabelRenderer.js';
import { createViewportState, createViewportHandlers } from './viewport.js';
import { createLODController, type LODLayers } from './lodController.js';
import { createTitleOverlay } from './titleOverlay.js';
import { LOD_THRESHOLD, STAGE_NODE_SCALE, FADED_NODE_ALPHA, EDGE_GAP, PANEL_DETAIL_MAX_WIDTH, PANEL_MARGIN, MOBILE_BREAKPOINT } from '../../config/constants.js';
import {
  selectedNode,
  selectedStage,
  selectNode,
  selectStage,
  clearSelection,
} from '../../stores/lineageState.js';
import { isDetailOpen } from '../../stores/uiState.js';
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

  const selectionLayer = new Container();
  const edgeLayer = new Container();
  const nodeLayer = new Container();
  const dotLayer = new Container();
  const stageEdgeLayer = new Container();
  const stageNodeLayer = new Container();
  viewport.addChild(selectionLayer);
  viewport.addChild(edgeLayer);
  viewport.addChild(nodeLayer);
  viewport.addChild(dotLayer);
  viewport.addChild(stageEdgeLayer);
  viewport.addChild(stageNodeLayer);
  stageEdgeLayer.visible = false;
  stageNodeLayer.visible = false;

  const titleOverlay = createTitleOverlay(app.stage, {
    title: lineageData.title ?? 'Lineage',
    lineageId: lineageData.lineageId ?? '',
  });

  const viewportState = createViewportState(width, height);
  viewport.scale.set(viewportState.scale);
  viewport.position.set(viewportState.x, viewportState.y);

  const nodeMap = new Map<string, PillNode>();
  const stageNodeMap = new Map<string, PillNode>();

  // Track current selection from store subscriptions (for hover logic)
  let selectedNodeId: string | null = null;
  let selectedStageId: string | null = null;

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
    // Highlight nodes in expanded view
    nodeMap.forEach((node, nodeId) => {
      if (nodeId === selectedId) {
        setNodeAlpha(nodeId, 1);
        node.setSelected(true);
      } else if (verticallyConnected.has(nodeId)) {
        setNodeAlpha(nodeId, 1);
        node.setSelected(false);
      } else {
        setNodeAlpha(nodeId, FADED_NODE_ALPHA);
        node.setSelected(false);
      }
    });
    // Dim stage nodes and edges (for collapsed view consistency)
    stageNodeMap.forEach((node) => {
      node.alpha = FADED_NODE_ALPHA;
      node.setSelected(false);
    });
    renderEdges(edgeLayer, dotLayer, lineageData.edges, nodeMap, selectedId, verticallyConnected);
    // Dim all stage edges when a node is selected
    renderStageEdges(stageEdgeLayer, lineageData.stages, stageNodeMap, '');
  }

  function applyStageSelectionHighlight(stageId: string): void {
    // Dim all stage nodes except selected
    stageNodeMap.forEach((node, id) => {
      if (id === stageId) {
        node.alpha = 1;
        node.setSelected(true);
      } else {
        node.alpha = FADED_NODE_ALPHA;
        node.setSelected(false);
      }
    });
    // Also dim expanded nodes for consistency
    nodeMap.forEach((node, nodeId) => {
      setNodeAlpha(nodeId, FADED_NODE_ALPHA);
      node.setSelected(false);
    });
    // Re-render stage edges with selection highlighting
    renderStageEdges(stageEdgeLayer, lineageData.stages, stageNodeMap, stageId);
  }

  function clearSelectionVisuals(): void {
    nodeMap.forEach((node, nodeId) => {
      setNodeAlpha(nodeId, DEFAULT_NODE_ALPHA);
      node.setSelected(false);
    });
    stageNodeMap.forEach((node) => {
      node.alpha = DEFAULT_NODE_ALPHA;
      node.setSelected(false);
    });
    renderEdges(edgeLayer, dotLayer, lineageData.edges, nodeMap, null, null);
    renderStageEdges(stageEdgeLayer, lineageData.stages, stageNodeMap, null);
  }

  const nodeCreationPromises: Promise<void>[] = [];

  for (const node of lineageData.nodes) {
    const nodeCallbacks = {
      onClick: () => {
        selectNode(node);
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
            title: node.title ?? node.label,
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
        selectionLayer,
      }).then((iconNode) => {
        nodeLayer.addChild(iconNode);
        nodeMap.set(node.id, iconNode);
      });
      nodeCreationPromises.push(promise);
    } else {
      const pillNode = createPillNode(node, graphScale, app.ticker, nodeCallbacks, { selectionLayer });
      nodeLayer.addChild(pillNode);
      nodeMap.set(node.id, pillNode);
    }
  }

  await Promise.all(nodeCreationPromises);

  // Reposition nodes based on actual bounds with fixed edge gap
  // Group nodes that share the same x position (vertically stacked)
  const nodesByX = new Map<number, PillNode[]>();
  nodeMap.forEach((node) => {
    const x = Math.round(node.position.x);
    if (!nodesByX.has(x)) nodesByX.set(x, []);
    nodesByX.get(x)!.push(node);
  });

  // Sort groups by x position
  const sortedGroups = Array.from(nodesByX.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, nodes]) => nodes);

  let rightEdge = -Infinity;
  for (const group of sortedGroups) {
    // Find widest node in this group (use pillWidth, not getBounds)
    let maxHalfWidth = 0;
    for (const node of group) {
      maxHalfWidth = Math.max(maxHalfWidth, node.pillWidth / 2);
    }

    // Position group: left edge = previous right edge + gap
    let newX: number;
    if (rightEdge === -Infinity) {
      newX = group[0].position.x;
    } else {
      newX = rightEdge + EDGE_GAP + maxHalfWidth;
    }

    // Move all nodes in group to new x
    for (const node of group) {
      node.position.x = newX;
      // Update selection ring position if it's in the separate layer
      if (node.selectionRing) {
        node.selectionRing.position.x = newX;
      }
    }

    rightEdge = newX + maxHalfWidth;
  }

  // Recalculate stage bounds based on repositioned nodes
  const stagePadding = 0.04 * graphScale;
  for (const stage of lineageData.stages) {
    let minX = Infinity;
    let maxX = -Infinity;
    nodeMap.forEach((node) => {
      if (node.nodeData.stage === stage.id) {
        const halfW = node.pillWidth / 2;
        minX = Math.min(minX, node.position.x - halfW);
        maxX = Math.max(maxX, node.position.x + halfW);
      }
    });
    if (minX !== Infinity) {
      stage.xStart = (minX - stagePadding) / graphScale + 0.5;
      stage.xEnd = (maxX + stagePadding) / graphScale + 0.5;
    }
  }

  for (const stage of lineageData.stages) {
    const stageNodes = lineageData.nodes.filter((n) => n.stage === stage.id);
    const stageNodeData: LineageNodeData = {
      id: `stage-${stage.id}`,
      label: stage.label,
      nodeType: 'stage',
      shape: 'circle',
      stage: stage.id,
      phase: stage.phase,
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
        selectStage({ stageId: stage.id, label: stage.label, nodes: stageNodes, edges: stageEdges });
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
    }, { scale: STAGE_NODE_SCALE, renderOptions: stageRenderOptions, selectionLayer });
    stageNodeLayer.addChild(pillNode);
    stageNodeMap.set(stage.id, pillNode);
  }

  renderStageEdges(stageEdgeLayer, lineageData.stages, stageNodeMap);

  // Calculate top node info for stage label line rendering
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

  // Create stage labels once - just update positions on viewport changes
  // Uses stageNodeMap positions so labels align with collapsed stage nodes
  const stageLabels = createStageLabels(lineageData.stages, stageNodeMap, topNodeInfo);
  app.stage.addChild(stageLabels.container);
  stageLabels.update(viewportState);

  function updateTitlePosition(): void {
    const firstStage = lineageData.stages[0];
    if (!firstStage) return;
    const leftmostNode = stageNodeMap.get(firstStage.id);
    if (!leftmostNode) return;
    titleOverlay.updatePosition(leftmostNode, viewportState);
  }

  const lodLayers: LODLayers = { nodeLayer, edgeLayer, dotLayer, stageNodeLayer, stageEdgeLayer, stageLayer: stageLabels.container };

  const lodController = createLODController(lodLayers, {
    onCollapseStart: () => {
      clearSelection(); // Clears store, triggers subscription to update visuals
      titleOverlay.setMode('relative');
    },
    onCollapseEnd: () => {
      updateTitlePosition();
    },
    onExpandStart: () => {
      clearSelection(); // Clears store, triggers subscription to update visuals
      titleOverlay.setMode('fixed');
    },
    onExpandEnd: () => {
      stageLabels.update(viewportState);
      cullAndRender();
    },
  });

  // Track detail panel state for centering logic
  let detailPanelOpen = false;

  // Center selected node on right side of viewport (when detail panel is open)
  function centerSelectedNode(nodeId: string): void {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    const currentWidth = viewportState.width;
    const currentHeight = viewportState.height;

    // Skip on mobile - panel is full width at bottom
    if (currentWidth <= MOBILE_BREAKPOINT) return;

    // Calculate the panel width (half viewport, max 800px)
    const panelWidth = Math.min(currentWidth * 0.5 - PANEL_MARGIN * 2, PANEL_DETAIL_MAX_WIDTH) + PANEL_MARGIN * 2;

    // Target: center the node in the right half of the viewport (after the panel)
    const rightHalfCenterX = panelWidth + (currentWidth - panelWidth) / 2;
    const targetScreenX = rightHalfCenterX;
    const targetScreenY = currentHeight / 2;

    // Calculate where viewport needs to move so node appears at target screen position
    const nodeWorldX = node.position.x;
    const nodeWorldY = node.position.y;
    const targetViewportX = targetScreenX - nodeWorldX * viewportState.scale;
    const targetViewportY = targetScreenY - nodeWorldY * viewportState.scale;

    // Animate the pan
    gsap.to(viewportState, {
      x: targetViewportX,
      y: targetViewportY,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        viewport.position.set(viewportState.x, viewportState.y);
        stageLabels.update(viewportState);
        cullAndRender();
      },
    });
  }

  // Subscribe to Svelte stores - this is the single source of truth for selection
  const unsubscribeNode = selectedNode.subscribe((node) => {
    selectedNodeId = node?.id ?? null;
    if (node) {
      // Clear any stage selection visuals first
      stageNodeMap.forEach((n) => n.setSelected(false));
      applySelectionHighlight(node.id);

      // Center node if detail panel is open
      if (detailPanelOpen) {
        centerSelectedNode(node.id);
      }
    } else if (!selectedStageId) {
      // Only clear if no stage is selected either
      clearSelectionVisuals();
    }
  });

  const unsubscribeStage = selectedStage.subscribe((stage) => {
    selectedStageId = stage?.stageId ?? null;
    if (stage) {
      applyStageSelectionHighlight(stage.stageId);
      renderEdges(edgeLayer, dotLayer, lineageData.edges, nodeMap, null, null);
    } else if (!selectedNodeId) {
      // Only clear if no stage is selected either
      clearSelectionVisuals();
    }
  });

  // Subscribe to detail panel state to center selected node on right side
  const unsubscribeDetail = isDetailOpen.subscribe((open) => {
    detailPanelOpen = open;
    if (open && selectedNodeId) {
      centerSelectedNode(selectedNodeId);
    }
  });

  function cullAndRender(): void {
    if (lodController.state.isCollapsed) return;
    Culler.shared.cull(nodeLayer, app.screen);
    const verticallyConnected = selectedNodeId
      ? getVerticallyConnectedNodeIds(selectedNodeId)
      : null;
    renderEdges(edgeLayer, dotLayer, lineageData.edges, nodeMap, selectedNodeId, verticallyConnected);
  }

  cullAndRender();

  const viewportHandlers = createViewportHandlers(app.canvas, viewport, container, viewportState, {
    onZoom: (scale) => {
      lodController.checkThreshold(scale);
      // Always update stage labels so they track viewport even during animation
      stageLabels.update(viewportState);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) {
        cullAndRender();
      } else if (lodController.state.isCollapsed) {
        updateTitlePosition();
      }
      callbacks.onSimpleViewChange(scale < LOD_THRESHOLD);
    },
    onPan: () => {
      // Always update stage labels so they track viewport even during animation
      stageLabels.update(viewportState);
      if (!lodController.state.isCollapsed && !lodController.state.isAnimating) {
        cullAndRender();
      } else if (lodController.state.isCollapsed) {
        updateTitlePosition();
      }
    },
    onPanStart: () => {},
    onPanEnd: () => {},
    isZoomBlocked: () => lodController.state.isAnimating,
  });

  // Debounced resize handler
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleResize(): void {
    // Update cached dimensions
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    viewportState.width = newWidth;
    viewportState.height = newHeight;

    // Resize the Pixi app
    app.resize();

    // Update stage labels
    stageLabels.update(viewportState);

    // Re-center selected node if detail panel is open
    if (detailPanelOpen && selectedNodeId) {
      centerSelectedNode(selectedNodeId);
    }

    // Re-render
    if (!lodController.state.isCollapsed) {
      cullAndRender();
    } else {
      updateTitlePosition();
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    // Debounce resize handling
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(handleResize, 100);
  });
  resizeObserver.observe(container);

  return {
    destroy: () => {
      unsubscribeNode();
      unsubscribeStage();
      unsubscribeDetail();
      viewportHandlers.destroy();
      resizeObserver.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      titleOverlay.destroy();
      nodeMap.forEach((node) => node.destroy());
      app.destroy(true, { children: true });
    },
  };
}
