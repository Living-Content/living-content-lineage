<script lang="ts">
  import type { TraceNodeData } from '../../../config/types.js';
  import SummaryView from '../SummaryView.svelte';
  import DetailView from '../DetailView.svelte';

  let {
    node,
    showDetailContent = false,
    detailAvailable = false,
  }: {
    node: TraceNodeData;
    showDetailContent?: boolean;
    detailAvailable?: boolean;
  } = $props();

  let titleDisplay = $derived(node.title ?? node.label ?? '');
  let descriptionDisplay = $derived(node.description ?? node.assetManifest?.data?.description ?? '');
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
</style>
