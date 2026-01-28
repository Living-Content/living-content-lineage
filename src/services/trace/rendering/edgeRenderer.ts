/**
 * Workflow renderer - single source of truth for all visual output.
 * Owns Graphics objects and reuses them (never recreated).
 * Decoupled from WorkflowManager which handles data only.
 *
 * Key principle: UI loads first, workflows load later.
 * Renderer initializes with zero workflows and redraws when content arrives.
 */
import { Graphics, Text, TextStyle, Container } from 'pixi.js';
import type { Phase } from '../../../config/types.js';
import type { GraphNode } from './nodeRenderer.js';
import type { WorkflowManager } from '../workflow/manager.js';
import { getCssVarColorHex, getCssVarInt, getCssVarFloat, getCssVar, type CssVar } from '../../../themes/index.js';
import { EDGE_ALPHA, DASH_LENGTH, GAP_LENGTH } from '../../../config/edges.js';

export interface RenderState {
  selectedNodeId: string | null;
  phaseFilter: Phase | null;
}

export interface WorkflowRendererLayers {
  nodeLayer: Container;
  edgeLayer: Container;
  connectorLayer: Container;
}

export interface WorkflowRendererDeps {
  layers: WorkflowRendererLayers;
  workflowManager: WorkflowManager;
  mainWorkflowId: string;
}

export interface WorkflowRenderer {
  /** Update render state (triggers redraw) */
  setRenderState(state: Partial<RenderState>): void;

  /** Get current render state */
  getRenderState(): RenderState;

  /** Explicit full redraw */
  redraw(): void;

  /** Redraw only edges */
  redrawEdges(): void;

  /** Redraw only connector line */
  redrawConnector(): void;

  /** Lifecycle: called when workflow added */
  onWorkflowAdded(workflowId: string): void;

  /** Lifecycle: called when workflow removed */
  onWorkflowRemoved(workflowId: string): void;

  /** Initialize renderer (can be called with 0 workflows) */
  initialize(): void;

  /** Clean up resources */
  destroy(): void;
}

/**
 * Draw a single edge between two nodes.
 */
const drawEdge = (
  graphics: Graphics,
  sourceNode: GraphNode,
  targetNode: GraphNode,
  opacity: number,
  color: number,
  edgeWidth: number
): void => {
  const sx = sourceNode.position.x;
  const sy = sourceNode.position.y;
  const tx = targetNode.position.x;
  const ty = targetNode.position.y;

  const sourceHalfW = sourceNode.nodeWidth / 2;
  const sourceHalfH = sourceNode.nodeHeight / 2;
  const targetHalfW = targetNode.nodeWidth / 2;
  const targetHalfH = targetNode.nodeHeight / 2;

  const dx = tx - sx;
  const dy = ty - sy;
  const isMainlyHorizontal = Math.abs(dx) > Math.abs(dy);

  if (isMainlyHorizontal) {
    const goingRight = tx > sx;
    const startX = goingRight ? sx + sourceHalfW : sx - sourceHalfW;
    const endX = goingRight ? tx - targetHalfW : tx + targetHalfW;
    const controlOffset = Math.abs(endX - startX) * 0.2;

    graphics.moveTo(startX, sy);
    graphics.bezierCurveTo(
      startX + (goingRight ? controlOffset : -controlOffset), sy,
      endX - (goingRight ? controlOffset : -controlOffset), ty,
      endX, ty
    );
    graphics.stroke({ width: edgeWidth, color, alpha: EDGE_ALPHA * opacity });
  } else {
    const goingDown = ty > sy;
    const startY = goingDown ? sy + sourceHalfH : sy - sourceHalfH;
    const endY = goingDown ? ty - targetHalfH : ty + targetHalfH;
    const controlOffset = Math.abs(endY - startY) * 0.2;

    graphics.moveTo(sx, startY);
    graphics.bezierCurveTo(
      sx, startY + (goingDown ? controlOffset : -controlOffset),
      tx, endY - (goingDown ? controlOffset : -controlOffset),
      tx, endY
    );
    graphics.stroke({ width: edgeWidth, color, alpha: EDGE_ALPHA * opacity });
  }
};

/**
 * Get color for a phase.
 */
const getPhaseColor = (phase: Phase | null): number => {
  if (!phase) return getCssVarColorHex('--color-edge');
  return getCssVarColorHex(`--phase-${phase.toLowerCase()}` as CssVar);
};

/**
 * Draw dashed connector line between workflows.
 */
const drawConnectorLine = (
  graphics: Graphics,
  x: number,
  topY: number,
  bottomY: number,
  color: number,
  width: number
): void => {
  let y = topY;
  let drawing = true;

  while (y < bottomY) {
    const segmentEnd = Math.min(y + (drawing ? DASH_LENGTH : GAP_LENGTH), bottomY);
    if (drawing) {
      graphics.moveTo(x, y);
      graphics.lineTo(x, segmentEnd);
      graphics.stroke({ width, color });
    }
    y = segmentEnd;
    drawing = !drawing;
  }
};

/**
 * Create text style for connector metadata.
 */
const createConnectorTextStyle = (): TextStyle => {
  return new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: getCssVarInt('--connector-text-size'),
    fontWeight: '600',
    fill: getCssVarColorHex('--color-node-text'),
    letterSpacing: 0.5,
  });
};

export const createWorkflowRenderer = (deps: WorkflowRendererDeps): WorkflowRenderer => {
  const { layers, workflowManager, mainWorkflowId } = deps;

  // === REUSABLE Graphics objects (never recreated) ===
  const edgeGraphics = {
    highlighted: new Graphics(),
    faded: new Graphics(),
  };
  layers.edgeLayer.addChild(edgeGraphics.faded);
  layers.edgeLayer.addChild(edgeGraphics.highlighted);

  let connectorContainer: Container | null = null;
  let connectorGraphics: Graphics | null = null;
  let connectorText: Text | null = null;

  // === Render state ===
  let renderState: RenderState = {
    selectedNodeId: null,
    phaseFilter: null,
  };

  const redrawEdges = (): void => {
    // CLEAR existing drawings, don't recreate Graphics
    edgeGraphics.highlighted.clear();
    edgeGraphics.faded.clear();

    const edgeData = workflowManager.getEdgeData();
    if (edgeData.length === 0) return; // No workflows yet - that's OK

    const color = getCssVarColorHex('--color-edge');
    const edgeWidth = getCssVarInt('--edge-width');

    for (const workflow of edgeData) {
      for (const edge of workflow.edges) {
        const sourceNode = workflow.nodeMap.get(edge.source);
        const targetNode = workflow.nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) continue;

        // Skip if both nodes are culled
        if (sourceNode.culled && targetNode.culled) continue;

        const isHighlighted = renderState.selectedNodeId === null ||
          edge.source === renderState.selectedNodeId ||
          edge.target === renderState.selectedNodeId;

        const target = isHighlighted ? edgeGraphics.highlighted : edgeGraphics.faded;
        drawEdge(target, sourceNode, targetNode, workflow.opacity, color, edgeWidth);
      }
    }

    edgeGraphics.faded.alpha = getCssVarFloat('--node-faded-alpha');
  };

  const redrawConnector = (): void => {
    // Create container on first use
    if (!connectorContainer) {
      connectorContainer = new Container();
      connectorGraphics = new Graphics();
      connectorContainer.addChild(connectorGraphics);
      layers.connectorLayer.addChild(connectorContainer);
    }

    connectorGraphics!.clear();

    // Remove old text if exists
    if (connectorText) {
      connectorContainer.removeChild(connectorText);
      connectorText.destroy();
      connectorText = null;
    }

    // Get connector context (calculated in workflowConnector.ts)
    const context = workflowManager.getConnectorContext(mainWorkflowId);
    if (context.x === null || context.topY === null || context.bottomY === null) return;

    const color = getPhaseColor(context.phase);
    const width = 2;

    // Use the Y values from context directly - they're already calculated correctly
    drawConnectorLine(connectorGraphics!, context.x, context.topY, context.bottomY, color, width);

    // Add metadata text at end of connector line (before child workflow)
    const labelText = context.childWorkflowTitle ?? '';

    if (labelText) {
      connectorText = new Text({
        text: labelText,
        style: createConnectorTextStyle(),
      });
      connectorText.anchor.set(0, 1);
      connectorText.position.set(context.x + 16, context.bottomY);
      connectorContainer.addChild(connectorText);
    }
  };

  return {
    setRenderState(partial) {
      renderState = { ...renderState, ...partial };
      this.redrawEdges(); // Redraw on state change
    },

    getRenderState() {
      return { ...renderState };
    },

    redraw() {
      this.redrawEdges();
      this.redrawConnector();
    },

    redrawEdges,

    redrawConnector,

    onWorkflowAdded() {
      this.redraw();
    },

    onWorkflowRemoved() {
      this.redraw();
    },

    initialize() {
      // Works with 0 workflows - UI loads first
      this.redraw();
    },

    destroy() {
      edgeGraphics.highlighted.destroy();
      edgeGraphics.faded.destroy();
      connectorText?.destroy();
      connectorGraphics?.destroy();
      connectorContainer?.destroy();
    },
  };
};
