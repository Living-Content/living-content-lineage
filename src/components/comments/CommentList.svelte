<script lang="ts">
  /**
   * Scrollable list of comments.
   */
  import type { Comment } from '../../config/commentTypes.js';
  import CommentItem from './CommentItem.svelte';

  let {
    comments,
    loading = false,
    onDelete,
  }: {
    comments: Comment[];
    loading?: boolean;
    onDelete?: (commentId: string) => void;
  } = $props();
</script>

<div class="comment-list">
  {#if loading}
    <div class="inline-loader">
      <div class="loader-bar"></div>
    </div>
  {:else if comments.length === 0}
    <div class="empty">
      <p>No comments yet</p>
      <p class="hint">Be the first to comment</p>
    </div>
  {:else}
    {#each comments as comment (comment.id)}
      <CommentItem {comment} {onDelete} />
    {/each}
  {/if}
</div>

<style>
  .comment-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--space-lg);
    position: relative;
  }

  .inline-loader {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: flex-end;
    pointer-events: none;
  }

  .loader-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    background: var(--color-text-primary);
    opacity: 0.6;
    animation: loader 1.5s ease-in-out infinite;
  }

  @keyframes loader {
    0% {
      width: 0%;
      left: 0;
    }
    50% {
      width: 100%;
      left: 0;
    }
    100% {
      width: 0%;
      left: 100%;
    }
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl) var(--space-lg);
    text-align: center;
    color: var(--color-text-faint);
  }

  .empty p {
    margin: 0;
  }

  .empty .hint {
    font-size: var(--font-size-tiny);
    margin-top: var(--space-xs);
  }
</style>
