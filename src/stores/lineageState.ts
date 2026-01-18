/**
 * Stores for lineage data and current selection.
 * These are the single source of truth - components and the graph controller
 * subscribe to these stores directly.
 */
import { writable } from 'svelte/store';
import type { LineageEdgeData, LineageGraph, LineageNodeData } from '../types.js';

export interface StageSelection {
  stageId: string;
  label: string;
  nodes: LineageNodeData[];
  edges: LineageEdgeData[];
}

export const lineageData = writable<LineageGraph | null>(null);
export const selectedNode = writable<LineageNodeData | null>(null);
export const selectedStage = writable<StageSelection | null>(null);

export function setLineageData(data: LineageGraph): void {
  lineageData.set(data);
}

export function selectNode(node: LineageNodeData): void {
  selectedStage.set(null);
  selectedNode.set(node);
}

export function selectStage(selection: StageSelection): void {
  selectedNode.set(null);
  selectedStage.set(selection);
}

export function clearSelection(): void {
  selectedNode.set(null);
  selectedStage.set(null);
}
