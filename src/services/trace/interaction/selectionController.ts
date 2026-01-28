/**
 * Selection controller.
 * Unified selection system for both node and step elements.
 *
 * Uses callback-based dependency injection to avoid direct store imports.
 * State reads and writes go through the deps interface.
 */
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { TraceNodeData } from '../../../config/types.js';
import type { NodeAccessor } from '../layout/nodeAccessor.js';
import { logger } from '../../../lib/logger.js';

/**
 * Selection target types passed through callbacks.
 */
export type SelectionTarget =
  | { type: 'step'; stepId: string }
  | { type: 'node'; nodeId: string }
  | null;

/**
 * Step data passed to selectStep.
 */
export interface StepData {
  stepId: string;
  label: string;
  phase: TraceNodeData['phase'];
  nodes: TraceNodeData[];
  edges: TraceNodeData[];
}

/**
 * Overlay node info for positioning.
 */
export interface OverlayNodeInfo {
  worldX: number;
  worldY: number;
  nodeWidth: number;
  nodeHeight: number;
}

/**
 * Callback-based dependencies for SelectionController.
 * Enables Pixi/Svelte separation by injecting store operations.
 */
export interface SelectionControllerDeps {
  nodeAccessor: NodeAccessor;
  // Getters
  getSelection: () => SelectionTarget;
  getIsExpanded: () => boolean;
  // Callbacks for state changes
  onExpandNode: (node: TraceNodeData) => void;
  onCollapseNode: () => void;
  onSelectStep: (stepData: StepData) => void;
  onClearSelection: () => void;
  onSetOverlayNode: (info: OverlayNodeInfo | null) => void;
  onSetExpansionProgress: (progress: number) => void;
  onCollapseRequest: (callback: (() => void) | null) => void;
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
 * State is managed through callbacks - no direct store access.
 */
export const createSelectionController = (deps: SelectionControllerDeps): SelectionController => {
  const { nodeAccessor } = deps;

  // Late binding for centerOnNode - set via bindCenterOnNode after viewportManager exists
  let centerOnNodeFn: CenterOnNodeFn = (nodeId) => {
    logger.warn(`selectionController.expand() called before bindCenterOnNode() - node ${nodeId} won't be centered`);
  };

  // Register collapse callback
  deps.onCollapseRequest(() => collapse());

  /**
   * Gets the currently expanded node ID.
   */
  const getExpandedNodeId = (): string | null => {
    const selection = deps.getSelection();
    return deps.getIsExpanded() && selection?.type === 'node'
      ? selection.nodeId
      : null;
  };

  /**
   * Gets the currently selected step ID.
   */
  const getSelectedStepId = (): string | null => {
    const selection = deps.getSelection();
    return selection?.type === 'step' ? selection.stepId : null;
  };

  const updateOverlayNode = (): void => {
    const selection = deps.getSelection();
    const id = getExpandedNodeId() ?? getSelectedStepId() ??
      (selection?.type === 'node' ? selection.nodeId : null) ??
      (selection?.type === 'step' ? selection.stepId : null);
    const node = id ? nodeAccessor.getAny(id) : null;
    deps.onSetOverlayNode(node ? {
      worldX: node.position.x,
      worldY: node.position.y,
      nodeWidth: node.nodeWidth,
      nodeHeight: node.nodeHeight,
    } : null);
  };

  const expand = (node: TraceNodeData): void => {
    const currentId = getExpandedNodeId();
    if (currentId === node.id) return;

    // Call expansion callback
    deps.onExpandNode(node);
    deps.onSetExpansionProgress(1);

    // Set overlay node immediately so panel tracks during animation
    updateOverlayNode();

    // Center on node
    centerOnNodeFn(node.id, {});
  };

  const selectStep = (graphNode: GraphNode, stepData: StepData): void => {
    deps.onSetOverlayNode({
      worldX: graphNode.position.x,
      worldY: graphNode.position.y,
      nodeWidth: graphNode.nodeWidth,
      nodeHeight: graphNode.nodeHeight,
    });
    deps.onSelectStep(stepData);
  };

  const collapse = (): void => {
    const isExpanded = deps.getIsExpanded();
    const hasStepSelection = getSelectedStepId() !== null;

    if (!isExpanded && !hasStepSelection) return;

    if (isExpanded) {
      deps.onSetExpansionProgress(0);
      deps.onCollapseNode();
    } else {
      deps.onClearSelection();
    }
  };

  const isExpanding = (): boolean => false;

  const getSelectedElementId = (): string | null => {
    const expandedId = getExpandedNodeId();
    if (expandedId) return expandedId;

    const stepId = getSelectedStepId();
    if (stepId) return stepId;

    const sel = deps.getSelection();
    if (!sel) return null;
    return sel.type === 'node' ? sel.nodeId : sel.stepId;
  };

  const destroy = (): void => {
    deps.onSetOverlayNode(null);
    deps.onCollapseRequest(null);
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
