<script lang="ts">
  import type { TraceNodeData } from '../../../config/types.js';
  import { commentState } from '../../../stores/commentState.svelte.js';
  import SummaryView from '../SummaryView.svelte';
  import DetailView from '../DetailView.svelte';

  let {
    node,
    showDetailContent = false,
    detailAvailable = false,
    commentsOpen = false,
    onOpenDetails = () => {},
    onOpenComments = () => {},
  }: {
    node: TraceNodeData;
    showDetailContent?: boolean;
    detailAvailable?: boolean;
    commentsOpen?: boolean;
    onOpenDetails?: () => void;
    onOpenComments?: () => void;
  } = $props();

  let titleDisplay = $derived(node.title ?? node.label ?? '');
  let descriptionDisplay = $derived(node.description ?? node.assetManifest?.data?.description ?? '');
  let commentCount = $derived(commentState.getCount(node.id));
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
  <div class="action-links">
    {#if detailAvailable}
      <button class="action-link" onclick={onOpenDetails}>
        DETAILS
      </button>
    {/if}
    <button class="action-link comments-link" class:open={commentsOpen} onclick={onOpenComments}>
      {#if commentCount > 0}
        <span class="count-badge">{commentCount > 99 ? '99+' : commentCount}</span>
      {/if}
      COMMENTS
    </button>
  </div>
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

  .action-links {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
  }

  .action-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .action-link:hover {
    color: var(--color-text-primary);
  }

  .action-link::after {
    font-size: 14px;
    transition: transform 0.15s ease;
    display: inline-block;
  }

  .action-link:not(.comments-link)::after {
    content: '\2194';
    transform: rotate(-45deg);
  }

  .action-link:not(.comments-link):hover::after {
    transform: rotate(-45deg) scale(1.05);
  }

  .comments-link {
    margin-left: auto;
  }

  .comments-link::after {
    content: '\2192';
  }

  .comments-link:hover:not(.open)::after {
    transform: translateX(2px);
  }

  .comments-link.open::after {
    content: '\2190';
  }

  .count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    margin-right: 4px;
    background: var(--color-text-primary);
    border-radius: 8px;
    color: var(--color-surface);
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
  }
</style>
