/**
 * Selection controller.
 * Unified selection system for both node and step elements.
 * Manages selection state without handling overlay positioning (handled by UI).
 */
import { traceState, type StepData } from '../../../stores/traceState.svelte.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { TraceNodeData } from '../../../config/types.js';
import type { NodeAccessor } from '../layout/nodeAccessor.js';

export interface SelectionControllerDeps {
  nodeAccessor: NodeAccessor;
  centerOnNode: (nodeId: string, options?: { zoom?: boolean; onComplete?: () => void }) => void;
}

export interface SelectionController {
  expand: (node: TraceNodeData) => void;
  selectStep: (stepId: string, graphNode: GraphNode, stepData: StepData) => void;
  collapse: () => void;
  updateOverlayNode: () => void;
  isExpanding: () => boolean;
  getSelectedElementId: () => string | null;
  destroy: () => void;
}

/**
 * Creates a unified selection controller for nodes and steps.
 */
export const createSelectionController = (deps: SelectionControllerDeps): SelectionController => {
  const { nodeAccessor, centerOnNode } = deps;

  let expandedNodeId: string | null = null;
  let selectedStepId: string | null = null;

  traceState.onCollapseRequest(() => collapse());

  const updateOverlayNode = (): void => {
    const id = expandedNodeId ?? selectedStepId ??
      (traceState.selection?.type === 'node' ? traceState.selection.nodeId : null) ??
      (traceState.selection?.type === 'step' ? traceState.selection.stepId : null);
    const node = id ? nodeAccessor.getAny(id) : null;
    traceState.setOverlayNode(node ? {
      worldX: node.position.x,
      worldY: node.position.y,
      nodeWidth: node.nodeWidth,
      nodeHeight: node.nodeHeight,
    } : null);
  };

  const expand = (node: TraceNodeData): void => {
    if (expandedNodeId === node.id) return;

    expandedNodeId = node.id;
    selectedStepId = null;

    // Update store (triggers graphSubscriptions → selectionHighlighter)
    traceState.expandNode(node);
    traceState.setExpansionProgress(1);

    // Set overlay node immediately so panel tracks during animation
    updateOverlayNode();

    // Center on node
    centerOnNode(node.id, {});
  };

  const selectStep = (stepId: string, graphNode: GraphNode, stepData: StepData): void => {
    expandedNodeId = null;
    selectedStepId = stepId;

    traceState.setOverlayNode({
      worldX: graphNode.position.x,
      worldY: graphNode.position.y,
      nodeWidth: graphNode.nodeWidth,
      nodeHeight: graphNode.nodeHeight,
    });
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
    traceState.setOverlayNode(null);
    traceState.onCollapseRequest(null);
  };

  return {
    expand,
    selectStep,
    collapse,
    updateOverlayNode,
    isExpanding,
    getSelectedElementId,
    destroy,
  };
};
