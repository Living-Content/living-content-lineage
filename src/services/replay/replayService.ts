/**
 * Replay API client.
 * Submits replay requests to create workflow branches.
 */

import { logger } from '../../lib/logger.js';
import { api } from '../../lib/api.js';
import { configStore } from '../../stores/configStore.svelte.js';
import { type Result, ok, err } from '../../lib/types/result.js';
import type { NodeModification } from '../../stores/replayState.svelte.js';

/**
 * Response from submitting a replay request.
 */
export interface ReplayResponse {
  workflowId: string;
  parentWorkflowId: string;
  branchPointNodeId: string;
  requestId: string;
  status: string;
}

/**
 * Submit a replay request to create a workflow branch.
 */
export async function submitReplay(
  branchPointNodeId: string,
  modifications: NodeModification[],
): Promise<Result<ReplayResponse>> {
  const { apiUrl, workflowId } = configStore.current;

  if (!apiUrl || !workflowId) {
    return err('Configuration not loaded');
  }

  if (!branchPointNodeId) {
    return err('No branch point selected');
  }

  if (modifications.length === 0) {
    return err('No modifications to replay');
  }

  try {
    const response = await api.fetch(`${apiUrl}/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceWorkflowId: workflowId,
        branchPointNodeId,
        modifications: modifications.map(m => ({
          nodeId: m.nodeId,
          fieldPath: m.fieldPath,
          originalValue: m.originalValue,
          newValue: m.newValue,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn('Replay: Submit failed', response.status, errorText);
      return err(`Failed to submit replay: ${response.status}`);
    }

    const data: ReplayResponse = await response.json();
    logger.info('Replay: Submitted successfully', data.workflowId);
    return ok(data);
  } catch (error) {
    logger.error('Replay: Error submitting', error);
    return err(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Navigate to a new workflow after replay completes.
 */
export function navigateToReplay(workflowId: string): void {
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('workflowId', workflowId);
  window.location.href = newUrl.toString();
}
