<script lang="ts">
  import type { TraceNodeData } from '../../../config/types.js';
  import SummaryView from '../SummaryView.svelte';
  import DetailView from '../DetailView.svelte';

  export let node: TraceNodeData;
  export let showDetailContent = false;
  export let detailAvailable = false;
  export let onOpenDetails: () => void = () => {};

  $: titleDisplay = node.title ?? node.label ?? '';
  $: descriptionDisplay = node.description ?? node.assetManifest?.data?.description ?? '';
</script>

<div class="node-header">
  <h2 class="node-title">{titleDisplay}</h2>
  {#if descriptionDisplay}
    <p class="node-description">{descriptionDisplay}</p>
  {/if}
</div>

{#if showDetailContent && detailAvailable}
  <DetailView {node} />
{:else}
  <SummaryView {node} />
  {#if detailAvailable}
    <button
      class="view-details-link"
      on:click={onOpenDetails}
    >
      Details
    </button>
  {/if}
{/if}

<style>
  .node-header {
    margin-bottom: var(--space-xs);
  }

  .node-title {
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: var(--letter-spacing-tight, -0.02em);
    color: var(--color-text-primary);
    margin: 0;
    line-height: var(--line-height-snug, 1.3);
  }

  .node-description {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    margin: var(--space-xs) 0 0 0;
    line-height: 1.4;
  }

  .view-details-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 20px;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .view-details-link:hover {
    color: var(--color-text-primary);
  }

  .view-details-link::after {
    content: '\2194';
    font-size: 14px;
    transition: transform 0.15s ease;
    display: inline-block;
    transform: rotate(-45deg);
  }

  .view-details-link:hover::after {
    transform: rotate(-45deg) scale(1.05);
  }
</style>
