/**
 * Graph controller using Pixi.js for WebGL rendering.
 * Provides smooth zoom/pan and animated node interactions.
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { loadManifest } from '../../manifest/registry.js';
import { getCssVar } from '../../ui/theme.js';
import type { LineageGraph, LineageNodeData, NodeType } from '../../types.js';
import { createPillNode, type PillNode } from './nodeRenderer.js';

interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

interface GraphControllerCallbacks {
  onNodeSelect: (nodeData: LineageNodeData) => void;
  onStageSelect: (
    stageLabel: string,
    nodes: LineageNodeData[],
    edges: LineageGraph['edges']
  ) => void;
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

const NODE_COLOR_VARS: Record<NodeType, string> = {
  data: '--node-data-color',
  process: '--node-compute-color',
  attestation: '--node-attestation-color',
  filter: '--node-filter-color',
  join: '--node-join-color',
  store: '--node-store-color',
  media: '--node-media-color',
  meta: '--node-meta-color',
};

// ============================================
// GRAPH CONSTANTS
// ============================================

// Zoom limits
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.0;
const ZOOM_DEFAULT = 0.8;
const ZOOM_FACTOR = 0.95; // Per scroll tick

// LOD (Level of Detail)
const LOD_THRESHOLD = 0.7; // Scale below which we collapse to meta nodes
const LOD_ANIMATION_DURATION = 300; // ms

// Meta nodes
const META_NODE_SCALE = 2.0;

// Edges
const EDGE_COLOR = 0x1a1a1a;
const EDGE_WIDTH = 2;
const EDGE_ARROW_SIZE = 8;
const EDGE_ARROW_GAP = 8;
const EDGE_GRADIENT_STEPS = 10;

// Stage labels
const STAGE_LABEL_FONT_SIZE = 20;
const STAGE_LABEL_TOP_PADDING = 80;
const STAGE_LABEL_LINE_START = 30;
const STAGE_DIVIDER_DASH = 6;
const STAGE_DIVIDER_GAP = 4;

// ============================================

const NODE_FALLBACK_COLORS: Record<NodeType, number> = {
  data: 0x4d96ff,
  process: 0xff6b6b,
  attestation: 0x6bcb77,
  filter: 0x4d96ff,
  join: 0xffd93d,
  store: 0xffd93d,
  media: 0x4d96ff,
  meta: 0x4d96ff,
};

function parseColor(colorString: string): number {
  if (!colorString) return 0x666666;

  const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return (r << 16) | (g << 8) | b;
  }

  if (colorString.startsWith('#')) {
    return parseInt(colorString.slice(1), 16);
  }

  return 0x666666;
}

function getNodeColor(nodeType: NodeType): number {
  const cssVar = NODE_COLOR_VARS[nodeType];
  if (!cssVar) return NODE_FALLBACK_COLORS[nodeType] ?? 0x666666;

  const color = getCssVar(cssVar);
  if (!color) return NODE_FALLBACK_COLORS[nodeType] ?? 0x666666;

  return parseColor(color);
}

function renderEdges(
  edgeLayer: Container,
  edges: LineageGraph['edges'],
  nodeMap: Map<string, PillNode>
): void {
  edgeLayer.removeChildren();

  const graphics = new Graphics();
  const endColor = EDGE_COLOR;
  const arrowSize = EDGE_ARROW_SIZE;
  const arrowGap = EDGE_ARROW_GAP;
  const gradientSteps = EDGE_GRADIENT_STEPS;

  // Interpolate between two colors
  function lerpColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return (r << 16) | (g << 8) | b;
  }

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) continue;

    const sx = sourceNode.position.x;
    const sy = sourceNode.position.y;
    const tx = targetNode.position.x;
    const ty = targetNode.position.y;

    const sourceHalfW = sourceNode.pillWidth / 2;
    const sourceHalfH = sourceNode.pillHeight / 2;
    const targetHalfW = targetNode.pillWidth / 2;
    const targetHalfH = targetNode.pillHeight / 2;

    // Get source node color
    const sourceColor = getNodeColor(sourceNode.nodeData.nodeType);

    const dx = tx - sx;
    const dy = ty - sy;
    const isMainlyHorizontal = Math.abs(dx) > Math.abs(dy);

    if (isMainlyHorizontal) {
      const goingRight = dx > 0;
      const lineStartX = goingRight ? sx + sourceHalfW : sx - sourceHalfW;
      const lineEndX = goingRight ? tx - targetHalfW - arrowGap : tx + targetHalfW + arrowGap;

      // Draw gradient line in segments
      for (let i = 0; i < gradientSteps; i++) {
        const t1 = i / gradientSteps;
        const t2 = (i + 1) / gradientSteps;
        const x1 = lineStartX + (lineEndX - lineStartX) * t1;
        const y1 = sy + (ty - sy) * t1;
        const x2 = lineStartX + (lineEndX - lineStartX) * t2;
        const y2 = sy + (ty - sy) * t2;
        const color = lerpColor(sourceColor, endColor, t1);

        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.stroke({ width: EDGE_WIDTH, color });
      }

      // Chevron arrow in end color
      if (goingRight) {
        graphics.moveTo(lineEndX - arrowSize, ty - arrowSize / 2);
        graphics.lineTo(lineEndX, ty);
        graphics.lineTo(lineEndX - arrowSize, ty + arrowSize / 2);
      } else {
        graphics.moveTo(lineEndX + arrowSize, ty - arrowSize / 2);
        graphics.lineTo(lineEndX, ty);
        graphics.lineTo(lineEndX + arrowSize, ty + arrowSize / 2);
      }
      graphics.stroke({ width: 2, color: endColor });
    } else {
      // Vertical edge with gradient
      const goingDown = dy > 0;
      const startY = goingDown ? sy + sourceHalfH : sy - sourceHalfH;
      const endY = goingDown ? ty - targetHalfH : ty + targetHalfH;

      for (let i = 0; i < gradientSteps; i++) {
        const t1 = i / gradientSteps;
        const t2 = (i + 1) / gradientSteps;
        const x1 = sx + (tx - sx) * t1;
        const y1 = startY + (endY - startY) * t1;
        const x2 = sx + (tx - sx) * t2;
        const y2 = startY + (endY - startY) * t2;
        const color = lerpColor(sourceColor, endColor, t1);

        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.stroke({ width: EDGE_WIDTH, color });
      }
    }
  }

  edgeLayer.addChild(graphics);
}

function renderStageLabels(
  stageLayer: Container,
  stages: LineageGraph['stages'],
  graphScale: number,
  viewportX: number,
  viewportY: number,
  viewportScale: number,
  screenHeight: number
): void {
  stageLayer.removeChildren();

  const style = new TextStyle({
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: STAGE_LABEL_FONT_SIZE,
    fontWeight: '600',
    fill: 0x666666,
    letterSpacing: -0.5,
  });

  const topPadding = STAGE_LABEL_TOP_PADDING;
  const lineStartY = STAGE_LABEL_LINE_START;

  for (const stage of stages) {
    // World position of stage center
    const worldX = (((stage.xStart + stage.xEnd) / 2) - 0.5) * graphScale;
    // Convert to screen position
    const screenX = viewportX + worldX * viewportScale;
    const labelY = topPadding;

    const label = new Text({ text: stage.label, style });
    label.anchor.set(0.5, 0);
    label.position.set(screenX, labelY);
    stageLayer.addChild(label);

    const lineGraphics = new Graphics();
    const dashLength = STAGE_DIVIDER_DASH;
    const gapLength = STAGE_DIVIDER_GAP;
    const startY = labelY + lineStartY;
    const endY = screenHeight;

    let currentY = startY;
    while (currentY < endY) {
      const dashEnd = Math.min(currentY + dashLength, endY);
      lineGraphics.moveTo(screenX, currentY);
      lineGraphics.lineTo(screenX, dashEnd);
      currentY = dashEnd + gapLength;
    }
    lineGraphics.stroke({ width: 1, color: 0xcccccc });
    stageLayer.addChild(lineGraphics);
  }
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
  viewport.position.set(width / 2, height / 2);
  app.stage.addChild(viewport);

  const edgeLayer = new Container();
  const nodeLayer = new Container();
  viewport.addChild(edgeLayer);
  viewport.addChild(nodeLayer);

  // Stage labels layer - outside viewport so it doesn't scale
  const stageLayer = new Container();
  app.stage.addChild(stageLayer);

  const nodeMap = new Map<string, PillNode>();

  for (const node of lineageData.nodes) {
    const pillNode = createPillNode(node, graphScale, app.ticker, {
      onClick: () => {
        callbacks.onSelectionClear();
        callbacks.onNodeSelect(node);
      },
      onHover: () => {
        container.style.cursor = 'pointer';
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
        callbacks.onHoverEnd();
      },
    });
    nodeLayer.addChild(pillNode);
    nodeMap.set(node.id, pillNode);
  }

  // Create meta nodes for LOD collapse
  const metaNodeLayer = new Container();
  viewport.addChild(metaNodeLayer);
  metaNodeLayer.visible = false;

  const metaNodeMap = new Map<string, PillNode>();
  for (const stage of lineageData.stages) {
    const stageNodes = lineageData.nodes.filter((n) => n.stage === stage.id);
    const nodeCount = stageNodes.length;
    const metaNode: LineageNodeData = {
      id: `meta-${stage.id}`,
      label: `${stage.label} (${nodeCount})`,
      nodeType: 'meta',
      shape: 'circle',
      stage: stage.id,
      x: (stage.xStart + stage.xEnd) / 2,
      y: 0.5,
    };

    const pillNode = createPillNode(metaNode, graphScale, app.ticker, {
      onClick: () => {
        const stageEdges = lineageData.edges.filter(
          (e) =>
            stageNodes.some((n) => n.id === e.source) ||
            stageNodes.some((n) => n.id === e.target)
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
    });
    // Scale up meta nodes to be larger
    pillNode.scale.set(1.5);
    pillNode.pillWidth *= 1.5;
    pillNode.pillHeight *= 1.5;
    metaNodeLayer.addChild(pillNode);
    metaNodeMap.set(stage.id, pillNode);
  }

  // Create edges between meta nodes
  const metaEdgeLayer = new Container();
  viewport.addChild(metaEdgeLayer);
  metaEdgeLayer.visible = false;

  function renderMetaEdges(): void {
    metaEdgeLayer.removeChildren();
    const graphics = new Graphics();
    const edgeColor = 0x1a1a1a;
    const arrowSize = 8;

    const stageOrder = lineageData.stages.map((s) => s.id);
    for (let i = 0; i < stageOrder.length - 1; i++) {
      const sourceStage = stageOrder[i];
      const targetStage = stageOrder[i + 1];
      const sourceNode = metaNodeMap.get(sourceStage);
      const targetNode = metaNodeMap.get(targetStage);

      if (!sourceNode || !targetNode) continue;

      const sx = sourceNode.position.x + sourceNode.pillWidth / 2;
      const sy = sourceNode.position.y;
      const tx = targetNode.position.x - targetNode.pillWidth / 2;
      const ty = targetNode.position.y;

      graphics.moveTo(sx, sy);
      graphics.lineTo(tx, ty);
      graphics.stroke({ width: 2, color: edgeColor });

      graphics.moveTo(tx - arrowSize, ty - arrowSize / 2);
      graphics.lineTo(tx, ty);
      graphics.lineTo(tx - arrowSize, ty + arrowSize / 2);
      graphics.stroke({ width: 2, color: edgeColor });
    }

    metaEdgeLayer.addChild(graphics);
  }

  renderMetaEdges();

  // LOD toggle function with liquid animation
  let isCollapsed = false;
  let isAnimating = false;

  // Store original positions for animation
  const originalPositions = new Map<string, { x: number; y: number }>();
  nodeMap.forEach((node, id) => {
    originalPositions.set(id, { x: node.position.x, y: node.position.y });
  });

  // Get meta node position for a stage
  function getMetaPosition(stageId: string): { x: number; y: number } | null {
    const metaNode = metaNodeMap.get(stageId);
    return metaNode ? { x: metaNode.position.x, y: metaNode.position.y } : null;
  }

  // Animate nodes collapsing into meta nodes
  function animateCollapse(): void {
    if (isAnimating) return;
    isAnimating = true;
    edgeLayer.visible = false;

    const duration = 300; // ms
    const startTime = performance.now();

    const animate = (): void => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      nodeMap.forEach((node) => {
        const nodeData = node.nodeData;
        const original = originalPositions.get(nodeData.id);
        const metaPos = getMetaPosition(nodeData.stage || '');

        if (original && metaPos) {
          node.position.x = original.x + (metaPos.x - original.x) * eased;
          node.position.y = original.y + (metaPos.y - original.y) * eased;
          node.alpha = 1 - eased;
          node.scale.set(1 - eased * 0.5);
        }
      });

      metaNodeMap.forEach((node) => {
        node.alpha = eased;
        node.scale.set(0.75 + eased * 0.75); // Animate to 1.5x
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        nodeLayer.visible = false;
        metaNodeLayer.visible = true;
        metaEdgeLayer.visible = true;
        isAnimating = false;
      }
    };

    metaNodeLayer.visible = true;
    metaNodeMap.forEach((node) => {
      node.alpha = 0;
      node.scale.set(0.75);
    });

    requestAnimationFrame(animate);
  }

  // Animate nodes expanding from meta nodes
  function animateExpand(): void {
    if (isAnimating) return;
    isAnimating = true;
    metaEdgeLayer.visible = false;

    const duration = 300; // ms
    const startTime = performance.now();

    // Set initial positions at meta nodes
    nodeMap.forEach((node) => {
      const nodeData = node.nodeData;
      const metaPos = getMetaPosition(nodeData.stage || '');
      if (metaPos) {
        node.position.x = metaPos.x;
        node.position.y = metaPos.y;
      }
      node.alpha = 0;
      node.scale.set(0.5);
    });

    nodeLayer.visible = true;

    const animate = (): void => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      nodeMap.forEach((node) => {
        const nodeData = node.nodeData;
        const original = originalPositions.get(nodeData.id);
        const metaPos = getMetaPosition(nodeData.stage || '');

        if (original && metaPos) {
          node.position.x = metaPos.x + (original.x - metaPos.x) * eased;
          node.position.y = metaPos.y + (original.y - metaPos.y) * eased;
          node.alpha = eased;
          node.scale.set(0.5 + eased * 0.5);
        }
      });

      metaNodeMap.forEach((node) => {
        node.alpha = 1 - eased;
        node.scale.set(1.5 - eased * 0.75); // Animate from 1.5x down
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        metaNodeLayer.visible = false;
        edgeLayer.visible = true;
        isAnimating = false;
      }
    };

    requestAnimationFrame(animate);
  }

  function updateLOD(scale: number): void {
    const shouldCollapse = scale < LOD_THRESHOLD;
    if (shouldCollapse === isCollapsed || isAnimating) return;

    isCollapsed = shouldCollapse;

    if (shouldCollapse) {
      animateCollapse();
    } else {
      animateExpand();
    }
  }

  renderEdges(edgeLayer, lineageData.edges, nodeMap);

  // Zoom state
  let currentScale = ZOOM_DEFAULT;
  const minScale = ZOOM_MIN;
  const maxScale = ZOOM_MAX;

  viewport.scale.set(currentScale);
  renderStageLabels(stageLayer, lineageData.stages, graphScale, viewport.position.x, viewport.position.y, currentScale, height);

  let isDragging = false;
  let lastPointerPos = { x: 0, y: 0 };

  const handleWheel = (e: WheelEvent): void => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(minScale, Math.min(maxScale, currentScale * zoomFactor));

    if (newScale === currentScale) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - viewport.position.x) / currentScale;
    const worldY = (mouseY - viewport.position.y) / currentScale;

    currentScale = newScale;
    viewport.scale.set(currentScale);

    viewport.position.x = mouseX - worldX * currentScale;
    viewport.position.y = mouseY - worldY * currentScale;

    renderStageLabels(stageLayer, lineageData.stages, graphScale, viewport.position.x, viewport.position.y, currentScale, height);
    updateLOD(currentScale);
    callbacks.onSimpleViewChange(currentScale < LOD_THRESHOLD);
  };

  const handlePointerDown = (e: PointerEvent): void => {
    if (e.button === 1 || (e.target === app.canvas && e.button === 0)) {
      isDragging = true;
      lastPointerPos = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (e: PointerEvent): void => {
    if (!isDragging) return;

    const dx = e.clientX - lastPointerPos.x;
    const dy = e.clientY - lastPointerPos.y;

    viewport.position.x += dx;
    viewport.position.y += dy;

    lastPointerPos = { x: e.clientX, y: e.clientY };
    renderStageLabels(stageLayer, lineageData.stages, graphScale, viewport.position.x, viewport.position.y, currentScale, height);
  };

  const handlePointerUp = (): void => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = 'grab';
    }
  };

  app.canvas.addEventListener('wheel', handleWheel, { passive: false });
  app.canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  container.style.cursor = 'grab';

  const resizeObserver = new ResizeObserver(() => {
    app.resize();
  });
  resizeObserver.observe(container);

  return {
    destroy: () => {
      app.canvas.removeEventListener('wheel', handleWheel);
      app.canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();
      nodeMap.forEach((node) => node.destroy());
      app.destroy(true, { children: true });
    },
  };
}
