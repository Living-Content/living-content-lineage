/**
 * Selection controller.
 * Unified selection system for both node and step elements.
 *
 * No local state - derives everything from traceState store.
 * This ensures single source of truth and prevents state drift.
 */
import { traceState, type StepData } from '../../../stores/traceState.svelte.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { TraceNodeData } from '../../../config/types.js';
import type { NodeAccessor } from '../layout/nodeAccessor.js';
import { logger } from '../../../lib/logger.js';

export interface SelectionControllerDeps {
  nodeAccessor: NodeAccessor;
}

type CenterOnNodeFn = (nodeId: string, options?: { zoom?: boolean; onComplete?: () => void }) => void;

export interface SelectionController {
  expand: (node: TraceNodeData) => void;
  selectStep: (graphNode: GraphNode, stepData: StepData) => void;
  collapse: () => void;
  updateOverlayNode: () => void;
  isExpanding: () => boolean;
  getSelectedElementId: () => string | null;
  /**
   * Binds the centerOnNode function. Must be called after viewportManager is created.
   * Required before expand() will work correctly.
   */
  bindCenterOnNode: (fn: CenterOnNodeFn) => void;
  destroy: () => void;
}

/**
 * Creates a unified selection controller for nodes and steps.
 * Derives all state from traceState - no local tracking.
 */
export const createSelectionController = (deps: SelectionControllerDeps): SelectionController => {
  const { nodeAccessor } = deps;

  // Late binding for centerOnNode - set via bindCenterOnNode after viewportManager exists
  let centerOnNodeFn: CenterOnNodeFn = (nodeId) => {
    logger.warn(`selectionController.expand() called before bindCenterOnNode() - node ${nodeId} won't be centered`);
  };

  traceState.onCollapseRequest(() => collapse());

  /**
   * Gets the currently expanded node ID from store.
   */
  const getExpandedNodeId = (): string | null =>
    traceState.isExpanded && traceState.selection?.type === 'node'
      ? traceState.selection.nodeId
      : null;

  /**
   * Gets the currently selected step ID from store.
   */
  const getSelectedStepId = (): string | null =>
    traceState.selection?.type === 'step'
      ? traceState.selection.stepId
      : null;

  const updateOverlayNode = (): void => {
    const id = getExpandedNodeId() ?? getSelectedStepId() ??
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
    const currentId = getExpandedNodeId();
    if (currentId === node.id) return;

    // Only write to store - no local tracking
    traceState.expandNode(node);
    traceState.setExpansionProgress(1);

    // Set overlay node immediately so panel tracks during animation
    updateOverlayNode();

    // Center on node
    centerOnNodeFn(node.id, {});
  };

  const selectStep = (graphNode: GraphNode, stepData: StepData): void => {
    traceState.setOverlayNode({
      worldX: graphNode.position.x,
      worldY: graphNode.position.y,
      nodeWidth: graphNode.nodeWidth,
      nodeHeight: graphNode.nodeHeight,
    });
    // Only write to store - no local tracking
    traceState.selectStep(stepData);
  };

  const collapse = (): void => {
    const isExpanded = traceState.isExpanded;
    const hasStepSelection = getSelectedStepId() !== null;

    if (!isExpanded && !hasStepSelection) return;

    if (isExpanded) {
      traceState.setExpansionProgress(0);
      traceState.collapseNode();
    } else {
      traceState.clearSelection();
    }
  };

  const isExpanding = (): boolean => false;

  const getSelectedElementId = (): string | null => {
    const expandedId = getExpandedNodeId();
    if (expandedId) return expandedId;

    const stepId = getSelectedStepId();
    if (stepId) return stepId;

    const sel = traceState.selection;
    if (!sel) return null;
    return sel.type === 'node' ? sel.nodeId : sel.stepId;
  };

  const destroy = (): void => {
    traceState.setOverlayNode(null);
    traceState.onCollapseRequest(null);
  };

  const bindCenterOnNode = (fn: CenterOnNodeFn): void => {
    centerOnNodeFn = fn;
  };

  return {
    expand,
    selectStep,
    collapse,
    updateOverlayNode,
    isExpanding,
    getSelectedElementId,
    bindCenterOnNode,
    destroy,
  };
};
