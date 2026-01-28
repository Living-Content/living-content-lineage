<script lang="ts">
  /**
   * Body content area for the inspector panel.
   * Renders node content or error/placeholder states.
   */
  import type { TraceNodeData } from '../../config/types.js';
  import ContentRouter from './views/ContentRouter.svelte';

  let {
    loadError = null,
    currentNode = null,
    showDetailContent = false,
    detailAvailable = false,
  }: {
    loadError?: string | null;
    currentNode?: TraceNodeData | null;
    showDetailContent?: boolean;
    detailAvailable?: boolean;
  } = $props();
</script>

<div class="panel-content">
  {#if loadError}
    <p class="panel-placeholder">{loadError}</p>
  {:else if currentNode}
    <ContentRouter
      node={currentNode}
      {showDetailContent}
      {detailAvailable}
    />
  {:else}
    <p class="panel-placeholder">Select a node to view details</p>
  {/if}
</div>

<style>
  .panel-content {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .panel-placeholder {
    color: var(--color-text-faint);
    font-style: italic;
  }
</style>
