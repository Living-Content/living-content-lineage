/**
 * Trace state store using Svelte 5 runes.
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

let trace = $state<Trace | null>(null);
let selection = $state<SelectionTarget>(null);
let currentSelectionKey: string | null = null;

const selectedNode = $derived(selection?.type === 'node' ? selection.data : null);
const selectedStep = $derived(selection?.type === 'step' ? selection.data : null);

export const traceState = {
  get trace() { return trace; },
  get selection() { return selection; },
  get selectedNode() { return selectedNode; },
  get selectedStep() { return selectedStep; },

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
  },

  selectNode(node: TraceNodeData): void {
    this.select({ type: 'node', nodeId: node.id, data: node });
  },

  selectStep(stepData: StepData): void {
    this.select({ type: 'step', stepId: stepData.stepId, data: stepData });
  },
};
