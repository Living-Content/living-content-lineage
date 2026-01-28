/**
 * Replay state store using Svelte 5 runes.
 * Manages modifications for workflow replay and tracks submission state.
 */

import { logger } from '../lib/logger.js';
import { api } from '../lib/api.js';
import { configStore } from './configStore.svelte.js';
import { type Result, ok, err } from '../lib/result.js';
import { toastStore } from './toastStore.svelte.js';

/**
 * A modification to a node field for replay.
 *
 * Note: `step` is required for backend processing - the backend uses step-based
 * targeting to match modifications with workflow nodes. `nodeId` is kept for
 * UI tracking and de-duplication.
 */
export interface NodeModification {
  step: string;           // Required for backend - the workflow step (e.g., "generate", "reflect")
  nodeId: string;         // For UI tracking/de-duplication
  fieldPath: string;
  originalValue: unknown;
  newValue: unknown;
}

/**
 * Response from replay submission.
 */
export interface ReplayResponse {
  workflowId: string;
  parentWorkflowId: string;
  branchPointNodeId: string;
  requestId: string;
  status: string;
}

let modifications = $state<NodeModification[]>([]);
let branchPointNodeId = $state<string | null>(null);
let isSubmitting = $state(false);
let submitError = $state<string | null>(null);
let completedWorkflowId = $state<string | null>(null);

const hasModifications = $derived(modifications.length > 0);
const modificationCount = $derived(modifications.length);

export const replayState = {
  get modifications() { return modifications; },
  get branchPointNodeId() { return branchPointNodeId; },
  get isSubmitting() { return isSubmitting; },
  get submitError() { return submitError; },
  get hasModifications() { return hasModifications; },
  get modificationCount() { return modificationCount; },
  get completedWorkflowId() { return completedWorkflowId; },

  /**
   * Add or update a modification for a node field.
   * Validates that `step` is provided (required for backend).
   */
  addModification(mod: NodeModification): void {
    // Validate step is provided (required for backend)
    if (!mod.step) {
      logger.error('Replay: Modification missing required step field', mod);
      return;
    }

    const existingIndex = modifications.findIndex(
      m => m.nodeId === mod.nodeId && m.fieldPath === mod.fieldPath
    );

    if (existingIndex >= 0) {
      modifications[existingIndex] = mod;
    } else {
      modifications = [...modifications, mod];
    }

    if (!branchPointNodeId) {
      branchPointNodeId = mod.nodeId;
    }

    logger.debug('Replay: Added modification', mod);
  },

  /**
   * Remove a modification by node ID and field path.
   */
  removeModification(nodeId: string, fieldPath: string): void {
    modifications = modifications.filter(
      m => !(m.nodeId === nodeId && m.fieldPath === fieldPath)
    );

    if (modifications.length === 0) {
      branchPointNodeId = null;
    }

    logger.debug('Replay: Removed modification', { nodeId, fieldPath });
  },

  /**
   * Get modifications for a specific node.
   */
  getNodeModifications(nodeId: string): NodeModification[] {
    return modifications.filter(m => m.nodeId === nodeId);
  },

  /**
   * Check if a specific field has been modified.
   */
  isFieldModified(nodeId: string, fieldPath: string): boolean {
    return modifications.some(
      m => m.nodeId === nodeId && m.fieldPath === fieldPath
    );
  },

  /**
   * Get the modified value for a field, or undefined if not modified.
   */
  getModifiedValue(nodeId: string, fieldPath: string): unknown {
    const mod = modifications.find(
      m => m.nodeId === nodeId && m.fieldPath === fieldPath
    );
    return mod?.newValue;
  },

  /**
   * Clear all modifications and reset state.
   */
  clearModifications(): void {
    modifications = [];
    branchPointNodeId = null;
    submitError = null;
    logger.debug('Replay: Cleared all modifications');
  },

  /**
   * Set the branch point node ID explicitly.
   */
  setBranchPointNodeId(nodeId: string): void {
    branchPointNodeId = nodeId;
  },

  /**
   * Compute the branch point as the earliest modified node in execution order.
   * Returns null if no modifications exist.
   */
  computeBranchPoint(nodeOrder: string[]): string | null {
    if (modifications.length === 0) return null;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local lookup variable, not reactive state
    const modifiedNodeIds: Set<string> = new Set(modifications.map(m => m.nodeId));

    for (const nodeId of nodeOrder) {
      if (modifiedNodeIds.has(nodeId)) {
        return nodeId;
      }
    }
    // Fallback to first modification if node not in order list
    return modifications[0].nodeId;
  },

  /**
   * Set the completed workflow ID (called when replay completes via WebSocket).
   */
  setCompletedWorkflowId(workflowId: string | null): void {
    completedWorkflowId = workflowId;
  },

  /**
   * Submit the replay request to the API.
   */
  async submitReplay(): Promise<Result<ReplayResponse>> {
    const { apiUrl, workflowId } = configStore.current;

    if (!apiUrl || !workflowId) {
      toastStore.error('Configuration not loaded');
      return err('Configuration not loaded');
    }

    if (!branchPointNodeId) {
      toastStore.error('No branch point selected');
      return err('No branch point selected');
    }

    if (modifications.length === 0) {
      toastStore.error('No modifications to replay');
      return err('No modifications to replay');
    }

    isSubmitting = true;
    submitError = null;
    toastStore.info('Submitting replay...');

    try {
      const response = await api.fetch(`${apiUrl}/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWorkflowId: workflowId,
          branchPointNodeId,
          // Send step (required for backend) and normalize fieldPath by stripping "data." prefix
          modifications: modifications.map(m => ({
            step: m.step,
            fieldPath: m.fieldPath.replace(/^data\./, ''),  // Normalize: strip "data." prefix
            originalValue: m.originalValue,
            newValue: m.newValue,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn('Replay: Submit failed', response.status, errorText);
        submitError = `Failed to submit replay: ${response.status}`;
        toastStore.error(submitError);
        return err(submitError);
      }

      const data: ReplayResponse = await response.json();
      logger.info('Replay: Submitted successfully', data.workflowId);
      toastStore.success('Replay submitted - executing...');

      return ok(data);
    } catch (error) {
      logger.error('Replay: Error submitting', error);
      submitError = error instanceof Error ? error.message : 'Unknown error';
      toastStore.error(submitError);
      return err(submitError);
    } finally {
      isSubmitting = false;
    }
  },
};
