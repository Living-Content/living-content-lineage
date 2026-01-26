<script lang="ts">
  /**
   * Single comment display.
   */
  import type { Comment } from '../../config/commentTypes.js';
  import { formatRelativeTime } from '../../services/comments/formatters.js';
  import { authStore } from '../../stores/authStore.svelte.js';

  let {
    comment,
    onDelete,
  }: {
    comment: Comment;
    onDelete?: (commentId: string) => void;
  } = $props();

  let canDelete = $derived(
    authStore.isAuthenticated &&
      (authStore.userId === comment.user_id || authStore.claims?.isAdmin)
  );

  let relativeTime = $derived(formatRelativeTime(comment.created_at));

  function handleDelete() {
    if (onDelete && canDelete) {
      onDelete(comment.id);
    }
  }
</script>

<div class="comment-item">
  <div class="avatar">
    {#if comment.user_picture}
      <img src={comment.user_picture} alt="" class="avatar-img" />
    {:else}
      <div class="avatar-placeholder">
        {comment.user_name.charAt(0).toUpperCase()}
      </div>
    {/if}
  </div>
  <div class="content">
    <div class="header">
      <span class="author">{comment.user_name}</span>
      <span class="time">{relativeTime}</span>
      {#if canDelete}
        <button class="delete-btn" onclick={handleDelete} title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      {/if}
    </div>
    <p class="text">{comment.content}</p>
  </div>
</div>

<style>
  .comment-item {
    display: flex;
    gap: var(--space-md);
    padding: var(--space-md) 0;
  }

  .comment-item:not(:last-child) {
    border-bottom: 1px solid var(--color-border-soft);
  }

  .avatar {
    flex-shrink: 0;
  }

  .avatar-img,
  .avatar-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .avatar-img {
    object-fit: cover;
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-hover);
    color: var(--color-text-secondary);
    font-size: var(--font-size-small);
    font-weight: 500;
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-xs);
  }

  .author {
    font-size: var(--font-size-small);
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .time {
    font-size: var(--font-size-tiny);
    color: var(--color-text-faint);
  }

  .delete-btn {
    margin-left: auto;
    padding: var(--space-xs);
    background: none;
    border: none;
    color: var(--color-text-faint);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease, color 0.15s ease;
  }

  .comment-item:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: var(--color-error);
  }

  .delete-btn svg {
    width: 14px;
    height: 14px;
  }

  .text {
    margin: 0;
    font-size: var(--font-size-small);
    line-height: 1.5;
    color: var(--color-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
