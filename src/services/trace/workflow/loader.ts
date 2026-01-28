/**
 * Workflow loading and registration.
 * Fetches workflow trees and registers related workflows with the manager.
 */
import type { WorkflowManager } from './manager.js';
import {
  fetchWorkflowTree,
  flattenTree,
  computeDisplayWorkflows,
  fetchTracesForDisplay,
} from './treeService.js';
import { logger } from '../../../lib/logger.js';

/**
 * Fetch and register related workflows (ancestors and children) for a workflow.
 * Uses the workflow tree service to determine display workflows.
 */
export const fetchRelatedWorkflows = async (
  manager: WorkflowManager,
  currentWorkflowId: string,
  fadedAlpha: number
): Promise<void> => {
  if (!currentWorkflowId) return;

  const tree = await fetchWorkflowTree(currentWorkflowId);
  if (!tree) {
    logger.debug('No workflow tree available');
    return;
  }

  const flatList = flattenTree(tree);
  const displayWorkflows = computeDisplayWorkflows(flatList, currentWorkflowId, fadedAlpha);

  const relatedWorkflows = displayWorkflows.filter(dw => dw.relationship !== 'current');
  if (relatedWorkflows.length === 0) return;

  const workflowsWithTraces = await fetchTracesForDisplay(relatedWorkflows);

  for (const dw of workflowsWithTraces) {
    if (!dw.trace?.nodes || !Array.isArray(dw.trace.nodes)) {
      logger.debug(`Skipping workflow ${dw.workflowId}: missing or invalid nodes array`);
      continue;
    }

    manager.register(dw.workflowId, dw.trace, {
      yOffset: dw.yOffset,
      opacity: dw.opacity,
      relationship: dw.relationship === 'ancestor' ? 'ancestor' : 'child',
      branchPointNodeId: dw.branchPointNodeId,
      parentWorkflowId: dw.parentWorkflowId,
    });
  }
};
