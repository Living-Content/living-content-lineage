/**
 * Trace state store using Svelte 5 runes.
 * Manages trace data, selection, and node expansion state.
 *
 * ## Terminology Reference
 *
 * | LOD | View Name      | What's Visible                              | Selection Target |
 * |-----|----------------|---------------------------------------------|------------------|
 * | 0   | Workflow View  | Individual asset nodes (CODE, DOCUMENT, etc)| node             |
 * | 1   | Step View      | Collapsed step nodes (Ingest, Select, etc)  | step             |
 * | 2   | Phase View     | Collapsed phases (future)                   | -                |
 *
 * **Code mappings:**
 * - `ViewMode = 'trace' | 'workflow'` in edgeRenderer refers to edge styling, NOT view names
 * - `nodeType === 'workflow'` means a step node (confusing but legacy)
 * - `traceState.selection.type` is `'node'` or `'step'`
 *
 * **Single selection mechanism for both views:**
 * - Workflow View: click node → `traceState.select({ type: 'node', ... })`
 * - Step View: click step → `traceState.select({ type: 'step', ... })`
 * - Same `DetailPanel` component handles both
 */
import type { TraceEdgeData, Trace, TraceNodeData } from '../config/types.js';

export interface StepData {
  stepId: string;
  label: string;
  phase: TraceNodeData['phase'];
  nodes: TraceNodeData[];
  edges: TraceEdgeData[];
}

export type SelectionTarget =
  | { type: 'step'; stepId: string; data: StepData }
  | { type: 'node'; nodeId: string; data: TraceNodeData }
  | null;

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export interface OverlayNodeInfo {
  worldX: number;
  worldY: number;
  nodeWidth: number;
  nodeHeight: number;
}

let trace = $state<Trace | null>(null);
let selection = $state<SelectionTarget>(null);
let expandedNode = $state<TraceNodeData | null>(null);
let expansionProgress = $state(0);
let overlayNode = $state<OverlayNodeInfo | null>(null);
let viewportState = $state<ViewportState>({ x: 0, y: 0, scale: 1, width: 0, height: 0 });
let currentSelectionKey: string | null = null;
let collapseCallback: (() => void) | null = null;

const selectedNode = $derived(selection?.type === 'node' ? selection.data : null);
const selectedStep = $derived(selection?.type === 'step' ? selection.data : null);
const isExpanded = $derived(expandedNode !== null);

/**
 * Node IDs sorted by execution order (left to right based on x coordinate).
 * Used for determining the earliest branch point in replay.
 */
const nodeExecutionOrder = $derived(() => {
  if (!trace) return [];
  return [...trace.nodes]
    .sort((a, b) => (a.x ?? 0) - (b.x ?? 0))
    .map(node => node.id);
});

export const traceState = {
  get trace() { return trace; },
  get selection() { return selection; },
  get selectedNode() { return selectedNode; },
  get selectedStep() { return selectedStep; },
  get expandedNode() { return expandedNode; },
  get expansionProgress() { return expansionProgress; },
  get isExpanded() { return isExpanded; },
  get overlayNode() { return overlayNode; },
  get viewportState() { return viewportState; },
  get nodeExecutionOrder() { return nodeExecutionOrder(); },

  setTrace(data: Trace): void {
    trace = data;
  },

  select(target: SelectionTarget): void {
    const key = target
      ? `${target.type}:${target.type === 'step' ? target.stepId : target.nodeId}`
      : null;
    if (key === currentSelectionKey) return;
    currentSelectionKey = key;
    selection = target;
  },

  clearSelection(): void {
    currentSelectionKey = null;
    selection = null;
    overlayNode = null;
  },

  selectNode(node: TraceNodeData): void {
    this.select({ type: 'node', nodeId: node.id, data: node });
  },

  selectStep(stepData: StepData): void {
    this.select({ type: 'step', stepId: stepData.stepId, data: stepData });
  },

  expandNode(node: TraceNodeData): void {
    expandedNode = node;
    // Expansion implies selection - keep them in sync
    this.selectNode(node);
  },

  collapseNode(): void {
    expandedNode = null;
    expansionProgress = 0;
    overlayNode = null;
    // Collapse clears selection to prevent lingering DataViewPanel
    this.clearSelection();
  },

  setExpansionProgress(progress: number): void {
    expansionProgress = Math.max(0, Math.min(1, progress));
  },

  setOverlayNode(info: OverlayNodeInfo | null): void {
    overlayNode = info;
  },

  updateViewport(state: ViewportState): void {
    viewportState = {
      x: state.x,
      y: state.y,
      scale: state.scale,
      width: state.width,
      height: state.height,
    };
  },

  /**
   * Registers a callback to be called when collapse is requested.
   * Used by the expansion controller to animate before collapsing.
   * Pass null to unregister.
   */
  onCollapseRequest(callback: (() => void) | null): void {
    collapseCallback = callback;
  },

  /**
   * Requests collapse with animation. If a callback is registered,
   * it will be called to handle the animation. Otherwise falls back
   * to immediate collapse.
   */
  requestCollapse(): void {
    if (collapseCallback) {
      collapseCallback();
    } else {
      this.collapseNode();
    }
  },
};
