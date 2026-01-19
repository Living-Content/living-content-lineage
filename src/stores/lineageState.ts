/**
 * Stores for lineage data and current selection.
 * These are the single source of truth - components and the graph controller
 * subscribe to these stores directly.
 */
import { writable } from 'svelte/store';
import type { LineageEdgeData, LineageGraph, LineageNodeData } from '../config/types.js';

export interface WorkflowSelection {
  workflowId: string;
  label: string;
  nodes: LineageNodeData[];
  edges: LineageEdgeData[];
}

export const lineageData = writable<LineageGraph | null>(null);
export const selectedNode = writable<LineageNodeData | null>(null);
export const selectedWorkflow = writable<WorkflowSelection | null>(null);

export const setLineageData = (data: LineageGraph): void => {
  lineageData.set(data);
};

export const selectNode = (node: LineageNodeData): void => {
  selectedWorkflow.set(null);
  selectedNode.set(node);
};

export const selectWorkflow = (selection: WorkflowSelection): void => {
  selectedNode.set(null);
  selectedWorkflow.set(selection);
};

export const clearSelection = (): void => {
  selectedNode.set(null);
  selectedWorkflow.set(null);
};
