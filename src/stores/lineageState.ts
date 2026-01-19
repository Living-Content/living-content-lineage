/**
 * Stores for lineage data and current selection.
 * These are the single source of truth - components and the graph controller
 * subscribe to these stores directly.
 */
import { derived, writable } from 'svelte/store';
import type { LineageEdgeData, LineageGraph, LineageNodeData } from '../config/types.js';

export interface WorkflowData {
  workflowId: string;
  label: string;
  nodes: LineageNodeData[];
  edges: LineageEdgeData[];
}

export type SelectionTarget =
  | { type: 'workflow'; workflowId: string; data: WorkflowData }
  | { type: 'node'; nodeId: string; data: LineageNodeData }
  | null;

export const lineageData = writable<LineageGraph | null>(null);
export const selection = writable<SelectionTarget>(null);

let currentSelectionKey: string | null = null;

export const select = (target: SelectionTarget): void => {
  const key = target
    ? `${target.type}:${target.type === 'workflow' ? target.workflowId : target.nodeId}`
    : null;
  if (key === currentSelectionKey) return;
  currentSelectionKey = key;
  selection.set(target);
};

export const clearSelection = (): void => {
  currentSelectionKey = null;
  selection.set(null);
};

export const setLineageData = (data: LineageGraph): void => {
  lineageData.set(data);
};

// Derived stores for backwards compatibility
export const selectedNode = derived(selection, ($selection) =>
  $selection?.type === 'node' ? $selection.data : null
);

export const selectedWorkflow = derived(selection, ($selection) =>
  $selection?.type === 'workflow' ? $selection.data : null
);

// Convenience functions for backwards compatibility
export const selectNode = (node: LineageNodeData): void => {
  select({ type: 'node', nodeId: node.id, data: node });
};

export const selectWorkflow = (workflowData: WorkflowData): void => {
  select({ type: 'workflow', workflowId: workflowData.workflowId, data: workflowData });
};
