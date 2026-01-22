/**
 * Stores for trace data and current selection.
 * These are the single source of truth - components and the graph controller
 * subscribe to these stores directly.
 */
import { derived, writable } from 'svelte/store';
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

export const trace = writable<Trace | null>(null);
export const selection = writable<SelectionTarget>(null);

let currentSelectionKey: string | null = null;

export const select = (target: SelectionTarget): void => {
  const key = target
    ? `${target.type}:${target.type === 'step' ? target.stepId : target.nodeId}`
    : null;
  if (key === currentSelectionKey) return;
  currentSelectionKey = key;
  selection.set(target);
};

export const clearSelection = (): void => {
  currentSelectionKey = null;
  selection.set(null);
};

export const setTrace = (data: Trace): void => {
  trace.set(data);
};

// Derived stores
export const selectedNode = derived(selection, ($selection) =>
  $selection?.type === 'node' ? $selection.data : null
);

export const selectedStep = derived(selection, ($selection) =>
  $selection?.type === 'step' ? $selection.data : null
);

// Convenience functions
export const selectNode = (node: TraceNodeData): void => {
  select({ type: 'node', nodeId: node.id, data: node });
};

export const selectStep = (stepData: StepData): void => {
  select({ type: 'step', stepId: stepData.stepId, data: stepData });
};
