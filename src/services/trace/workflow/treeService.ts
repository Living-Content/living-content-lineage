/**
 * Service for fetching and processing workflow tree data.
 * Handles tree traversal, flattening, and computing display positions.
 */
import { api } from '../../../lib/api.js';
import { configStore } from '../../../stores/configStore.svelte.js';
import { loadManifest } from '../../manifest/registry.js';
import type { Trace } from '../../../config/types.js';
import { BAND_HEIGHT, GAP_BETWEEN_BANDS } from '../../../config/layout.js';

/**
 * Response structure from /replay/trace/{id}/tree endpoint.
 * Represents a node in the workflow hierarchy tree.
 */
export interface WorkflowTreeNode {
  workflowId: string;
  branchPointNodeId: string | null;
  branchDepth: number;
  createdAt: number | null;
  modificationsCount: number;
  title: string | null;
  children: WorkflowTreeNode[];
}

/**
 * Flattened workflow representation for easier processing.
 * Preserves parent relationships from tree structure.
 */
export interface FlatWorkflow {
  workflowId: string;
  parentWorkflowId: string | null;
  branchDepth: number;
  branchPointNodeId: string | null;
}

/**
 * Workflow prepared for rendering with position and style.
 */
export interface DisplayWorkflow {
  workflowId: string;
  parentWorkflowId: string | null;
  branchPointNodeId: string | null;
  yOffset: number;
  opacity: number;
  trace: Trace | null;
  relationship: 'ancestor' | 'current' | 'child';
}

/**
 * Fetch the full workflow tree starting from any workflow.
 * The API returns the entire tree from root, with the requested
 * workflow somewhere in the hierarchy.
 */
export async function fetchWorkflowTree(
  workflowId: string
): Promise<WorkflowTreeNode | null> {
  const { apiUrl } = configStore.current;
  if (!apiUrl) return null;

  try {
    const response = await api.fetch(`${apiUrl}/replay/trace/${workflowId}/tree`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Flatten tree into array preserving parent relationships.
 * Performs depth-first traversal.
 */
export function flattenTree(
  node: WorkflowTreeNode,
  parentId: string | null = null
): FlatWorkflow[] {
  const result: FlatWorkflow[] = [{
    workflowId: node.workflowId,
    parentWorkflowId: parentId,
    branchDepth: node.branchDepth,
    branchPointNodeId: node.branchPointNodeId,
  }];

  for (const child of node.children) {
    result.push(...flattenTree(child, node.workflowId));
  }

  return result;
}

/** Position step in normalized space */
const POSITION_STEP = BAND_HEIGHT + GAP_BETWEEN_BANDS;

/**
 * Determine which workflows to display and compute their Y offsets.
 *
 * Display rule: ancestors + current + direct children only.
 * - Siblings, cousins, and grandchildren are not shown.
 *
 * Y positioning:
 * - Current workflow centered at Y = 0.5
 * - Ancestors stack above (lower Y values)
 * - Children stack below (higher Y values)
 */
export function computeDisplayWorkflows(
  flatList: FlatWorkflow[],
  currentWorkflowId: string,
  fadedAlpha: number = 0.6
): DisplayWorkflow[] {
  const current = flatList.find(w => w.workflowId === currentWorkflowId);
  if (!current) return [];

  const ancestors = collectAncestors(flatList, current);
  const children = flatList.filter(w => w.parentWorkflowId === currentWorkflowId);

  const display: DisplayWorkflow[] = [];

  // Add ancestors above current (oldest first, furthest from center)
  ancestors.forEach((ancestor, index) => {
    const distanceFromCurrent = ancestors.length - index;
    display.push({
      workflowId: ancestor.workflowId,
      parentWorkflowId: ancestor.parentWorkflowId,
      branchPointNodeId: ancestor.branchPointNodeId,
      yOffset: 0.5 - POSITION_STEP * distanceFromCurrent,
      opacity: fadedAlpha,
      trace: null,
      relationship: 'ancestor',
    });
  });

  // Add current at center
  display.push({
    workflowId: current.workflowId,
    parentWorkflowId: current.parentWorkflowId,
    branchPointNodeId: current.branchPointNodeId,
    yOffset: 0.5,
    opacity: 1.0,
    trace: null,
    relationship: 'current',
  });

  // Add children below current
  children.forEach((child, index) => {
    display.push({
      workflowId: child.workflowId,
      parentWorkflowId: child.parentWorkflowId,
      branchPointNodeId: child.branchPointNodeId,
      yOffset: 0.5 + POSITION_STEP * (index + 1),
      opacity: fadedAlpha,
      trace: null,
      relationship: 'child',
    });
  });

  return display;
}

/**
 * Walk up the parent chain to collect all ancestors.
 * Returns array ordered from oldest ancestor to direct parent.
 */
const collectAncestors = (
  flatList: FlatWorkflow[],
  current: FlatWorkflow
): FlatWorkflow[] => {
  const ancestors: FlatWorkflow[] = [];
  let parentId = current.parentWorkflowId;

  while (parentId) {
    const parent = flatList.find(w => w.workflowId === parentId);
    if (parent) {
      ancestors.unshift(parent);
      parentId = parent.parentWorkflowId;
    } else {
      break;
    }
  }

  return ancestors;
};

/**
 * Fetch trace data for each display workflow in parallel.
 * Uses loadManifest to properly transform raw manifest into Trace format.
 * Populates the trace field on each DisplayWorkflow.
 */
export async function fetchTracesForDisplay(
  displayWorkflows: DisplayWorkflow[]
): Promise<DisplayWorkflow[]> {
  const { apiUrl } = configStore.current;
  if (!apiUrl) return displayWorkflows;

  const fetches = displayWorkflows.map(async (dw) => {
    try {
      const url = `${apiUrl}/trace/${dw.workflowId}/manifest`;
      dw.trace = await loadManifest(url);
    } catch {
      // Leave trace as null - workflow will be skipped during rendering
    }
    return dw;
  });

  return Promise.all(fetches);
}

/**
 * Find the X position of a branch point node in a parent workflow.
 * Used to position the vertical branch line.
 */
export function findBranchPointX(
  branchPointNodeId: string | null,
  parentNodeMap: Map<string, { position: { x: number } }> | undefined
): number | null {
  if (!branchPointNodeId || !parentNodeMap) return null;

  const node = parentNodeMap.get(branchPointNodeId);
  return node?.position.x ?? null;
}
