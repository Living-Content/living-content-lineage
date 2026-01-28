<script lang="ts">
  /**
   * Footer bar for the inspector panel.
   * Contains DETAILS and COMMENTS action links.
   */
  import { fade } from 'svelte/transition';

  let {
    showDetailsLink = false,
    commentCount = 0,
    commentsOpen = false,
    onOpenDetails,
    onToggleComments,
  }: {
    showDetailsLink?: boolean;
    commentCount?: number;
    commentsOpen?: boolean;
    onOpenDetails?: () => void;
    onToggleComments?: () => void;
  } = $props();
</script>

<div class="action-footer">
  {#if showDetailsLink}
    <button class="action-link" onclick={onOpenDetails}>
      DETAILS
    </button>
  {/if}
  <button class="action-link comments-link" class:open={commentsOpen} onclick={onToggleComments}>
    {#if commentCount > 0}
      <span class="count-badge" transition:fade={{ duration: 150 }}>
        {commentCount > 99 ? '99+' : commentCount}
      </span>
    {/if}
    COMMENTS
  </button>
</div>

<style>
  .action-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) var(--space-xl);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border-soft);
    flex-shrink: 0;
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
