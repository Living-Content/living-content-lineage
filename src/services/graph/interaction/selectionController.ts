/**
 * Selection controller.
 * Unified selection system for both node and step elements.
 * Manages expand/collapse animations for nodes with scale and opacity transitions.
 */
import { GEOMETRY } from '../../../config/animationConstants.js';
import { traceState, type OverlayPosition, type StepData } from '../../../stores/traceState.svelte.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { TraceNodeData } from '../../../config/types.js';

export interface SelectionControllerDeps {
  nodeMap: Map<string, GraphNode>;
  stepNodeMap: Map<string, GraphNode>;
  viewport: { position: { x: number; y: number }; scale: { x: number; y: number } };
  viewportState: { width: number; height: number; x: number; y: number; scale: number };
  centerOnExpandedNode: (nodeId: string, callback: () => void) => void;
}

export interface SelectionController {
  expand: (node: TraceNodeData) => void;
  selectStep: (stepId: string, graphNode: GraphNode, stepData: StepData) => void;
  collapse: () => void;
  updateOverlayPosition: () => void;
  isExpanding: () => boolean;
  getSelectedElementId: () => string | null;
  destroy: () => void;
}

/**
 * Converts world coordinates to screen position for overlay placement.
 */
const worldToScreen = (
  worldX: number,
  worldY: number,
  viewportState: SelectionControllerDeps['viewportState']
): { x: number; y: number } => {
  const screenX = worldX * viewportState.scale + viewportState.x;
  const screenY = worldY * viewportState.scale + viewportState.y;
  return { x: screenX, y: screenY };
};

/**
 * Calculates overlay position from a graph node.
 * Positions panel to the LEFT of the node.
 */
const PANEL_WIDTH = 360; // Must match DetailPanel.svelte width

const calculateOverlayPosition = (
  graphNode: GraphNode,
  viewportState: SelectionControllerDeps['viewportState']
): OverlayPosition => {
  const screenPos = worldToScreen(graphNode.position.x, graphNode.position.y, viewportState);
  const nodeWidth = graphNode.nodeWidth * viewportState.scale;
  const nodeHeight = graphNode.nodeHeight * viewportState.scale;

  // Position panel to the LEFT of the node
  const panelRightEdge = screenPos.x - nodeWidth / 2 - GEOMETRY.OVERLAY_GAP;
  const panelLeftEdge = panelRightEdge - PANEL_WIDTH;

  return {
    x: panelLeftEdge,
    y: screenPos.y,
    width: nodeWidth,
    height: nodeHeight,
    scale: 1,
  };
};

/**
 * Creates a unified selection controller for nodes and steps.
 */
export const createSelectionController = (deps: SelectionControllerDeps): SelectionController => {
  const { nodeMap, stepNodeMap, viewportState, centerOnExpandedNode } = deps;

  let expandedNodeId: string | null = null;
  let selectedStepId: string | null = null;

  traceState.onCollapseRequest(() => collapse());

  const expand = (node: TraceNodeData): void => {
    if (expandedNodeId === node.id) return;

    expandedNodeId = node.id;
    selectedStepId = null;

    // Update store (triggers graphSubscriptions → selectionHighlighter)
    traceState.expandNode(node);
    traceState.setExpansionProgress(1);

    // Center on node, then set overlay position AFTER viewport settles
    centerOnExpandedNode(node.id, () => {
      updateOverlayPosition();
    });
  };

  const selectStep = (stepId: string, graphNode: GraphNode, stepData: StepData): void => {
    expandedNodeId = null;
    selectedStepId = stepId;

    const overlayPos = calculateOverlayPosition(graphNode, viewportState);
    traceState.setOverlayPosition(overlayPos);
    traceState.selectStep(stepData);
  };

  const collapse = (): void => {
    if (!expandedNodeId && !selectedStepId) return;

    const wasNodeExpanded = expandedNodeId !== null;
    expandedNodeId = null;
    selectedStepId = null;

    if (wasNodeExpanded) {
      traceState.setExpansionProgress(0);
      traceState.collapseNode();
    } else {
      traceState.clearSelection();
      traceState.setOverlayPosition(null);
    }
  };

  const updateOverlayPosition = (): void => {
    if (expandedNodeId) {
      const node = nodeMap.get(expandedNodeId);
      if (node) {
        traceState.setOverlayPosition(calculateOverlayPosition(node, viewportState));
      } else {
        traceState.setOverlayPosition(null);
      }
    } else if (selectedStepId) {
      const stepNode = stepNodeMap.get(selectedStepId);
      if (stepNode) {
        traceState.setOverlayPosition(calculateOverlayPosition(stepNode, viewportState));
      } else {
        traceState.setOverlayPosition(null);
      }
    } else {
      traceState.setOverlayPosition(null);
    }
  };

  const isExpanding = (): boolean => false;

  const getSelectedElementId = (): string | null => {
    if (expandedNodeId) return expandedNodeId;
    if (selectedStepId) return selectedStepId;
    const sel = traceState.selection;
    if (!sel) return null;
    return sel.type === 'node' ? sel.nodeId : sel.stepId;
  };

  const destroy = (): void => {
    expandedNodeId = null;
    selectedStepId = null;
    traceState.setOverlayPosition(null);
    traceState.onCollapseRequest(null);
  };

  return {
    expand,
    selectStep,
    collapse,
    updateOverlayPosition,
    isExpanding,
    getSelectedElementId,
    destroy,
  };
};
