/**
 * Branch API client.
 * Fetches branch history, children, and tree data.
 */

import { logger } from '../../lib/logger.js';
import { api } from '../../lib/api.js';
import { configStore } from '../../stores/configStore.svelte.js';
import { type Result, ok, err } from '../../lib/types/result.js';

/**
 * Branch history item from the API.
 */
export interface BranchHistoryItem {
  workflowId: string;
  parentWorkflowId: string | null;
  branchPointNodeId: string | null;
  branchDepth: number;
}

/**
 * Branch info for child branches.
 */
export interface BranchInfo {
  workflowId: string;
  branchPointNodeId: string;
  branchDepth: number;
  createdAt: string;
  modificationsCount: number;
  title: string | null;
}

/**
 * Branch tree node for visualization.
 */
export interface BranchTreeNode {
  workflowId: string;
  branchPointNodeId: string | null;
  branchDepth: number;
  createdAt: string | null;
  modificationsCount: number;
  title: string | null;
  children: BranchTreeNode[];
}

/**
 * Fetch branch history (parent chain) for current workflow.
 */
export async function fetchBranchHistory(): Promise<Result<BranchHistoryItem[]>> {
  const { apiUrl, workflowId } = configStore.current;

  if (!apiUrl || !workflowId) {
    return err('Configuration not loaded');
  }

  try {
    const response = await api.fetch(
      `${apiUrl}/replay/trace/${workflowId}/history`
    );

    if (!response.ok) {
      logger.warn('Branch: Failed to fetch history', response.status);
      return err(`Failed to fetch history: ${response.status}`);
    }

    const data = await response.json();
    return ok(data);
  } catch (error) {
    logger.error('Branch: Error fetching history:', error);
    return err(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Fetch child branches for current workflow.
 */
export async function fetchBranches(): Promise<Result<BranchInfo[]>> {
  const { apiUrl, workflowId } = configStore.current;

  if (!apiUrl || !workflowId) {
    return err('Configuration not loaded');
  }

  try {
    const response = await api.fetch(
      `${apiUrl}/replay/trace/${workflowId}/branches`
    );

    if (!response.ok) {
      logger.warn('Branch: Failed to fetch branches', response.status);
      return err(`Failed to fetch branches: ${response.status}`);
    }

    const data = await response.json();
    return ok(data);
  } catch (error) {
    logger.error('Branch: Error fetching branches:', error);
    return err(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Fetch full branch tree for visualization.
 */
export async function fetchBranchTree(): Promise<Result<BranchTreeNode>> {
  const { apiUrl, workflowId } = configStore.current;

  if (!apiUrl || !workflowId) {
    return err('Configuration not loaded');
  }

  try {
    const response = await api.fetch(
      `${apiUrl}/replay/trace/${workflowId}/tree`
    );

    if (!response.ok) {
      logger.warn('Branch: Failed to fetch tree', response.status);
      return err(`Failed to fetch tree: ${response.status}`);
    }

    const data = await response.json();
    return ok(data);
  } catch (error) {
    logger.error('Branch: Error fetching tree:', error);
    return err(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Get branches for a specific node (nodes that branch from this point).
 */
export async function fetchBranchesForNode(nodeId: string): Promise<Result<BranchInfo[]>> {
  const result = await fetchBranches();
  if (!result.ok) {
    return result;
  }

  const nodeBranches = result.data.filter((b: BranchInfo) => b.branchPointNodeId === nodeId);
  return ok(nodeBranches);
}
