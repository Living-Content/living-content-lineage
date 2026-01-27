<script lang="ts">
  /**
   * Branch history breadcrumb navigation.
   * Shows the parent chain from root to current workflow.
   * Clicking a breadcrumb navigates to that workflow.
   */
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { logger } from '../../lib/logger.js';
  import { api } from '../../lib/api.js';
  import { configStore } from '../../stores/configStore.svelte.js';

  interface BranchHistoryItem {
    workflowId: string;
    parentWorkflowId: string | null;
    branchPointNodeId: string | null;
    branchDepth: number;
  }

  let history = $state<BranchHistoryItem[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  let hasHistory = $derived(history.length > 1);
  let currentWorkflowId = $derived(configStore.current.workflowId);

  onMount(() => {
    loadHistory();
  });

  async function loadHistory(): Promise<void> {
    const { apiUrl, workflowId } = configStore.current;
    if (!apiUrl || !workflowId) return;

    isLoading = true;
    error = null;

    try {
      const response = await api.fetch(
        `${apiUrl}/replay/trace/${workflowId}/history`
      );

      if (!response.ok) {
        error = `Failed to load history: ${response.status}`;
        return;
      }

      history = await response.json();
      logger.debug('Branch: Loaded history', history.length);
    } catch (e) {
      logger.error('Branch: Error loading history', e);
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      isLoading = false;
    }
  }

  function navigateToWorkflow(workflowId: string): void {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('workflowId', workflowId);
    window.location.href = newUrl.toString();
  }

  function formatBreadcrumb(item: BranchHistoryItem, index: number): string {
    if (item.branchDepth === 0) {
      return 'Original';
    }
    return `Branch ${item.branchDepth}`;
  }
</script>

{#if hasHistory}
  <nav class="branch-history" transition:fade={{ duration: 150 }}>
    <ol class="breadcrumbs">
      {#each history.toReversed() as item, index (item.workflowId)}
        {@const isLast = index === history.length - 1}
        <li class="breadcrumb-item" class:current={isLast}>
          {#if isLast}
            <span class="breadcrumb-label current">{formatBreadcrumb(item, index)}</span>
          {:else}
            <button
              class="breadcrumb-link"
              onclick={() => navigateToWorkflow(item.workflowId)}
              title="View workflow {item.workflowId.slice(0, 8)}"
            >
              {formatBreadcrumb(item, index)}
            </button>
            <span class="separator" aria-hidden="true">/</span>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/if}

<style>
  .branch-history {
    display: flex;
    align-items: center;
    padding: var(--space-xs) var(--space-md);
    background: var(--color-surface-secondary, #f5f5f5);
    border-radius: var(--radius-sm);
  }

  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .breadcrumb-link {
    padding: 2px 6px;
    background: none;
    border: none;
    border-radius: var(--radius-xs);
    font-size: var(--font-size-small);
    color: var(--color-primary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .breadcrumb-link:hover {
    background: var(--color-primary-soft, rgba(0, 0, 255, 0.1));
    text-decoration: underline;
  }

  .breadcrumb-label {
    font-size: var(--font-size-small);
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .separator {
    color: var(--color-text-muted);
    font-size: var(--font-size-small);
  }
</style>
