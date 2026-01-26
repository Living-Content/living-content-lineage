<script lang="ts">
  /**
   * Comment section content - list, input, and auth prompt.
   * Used inside CommentDrawer.
   */
  import { authStore } from '../../stores/authStore.svelte.js';
  import { commentState } from '../../stores/commentState.svelte.js';
  import CommentList from './CommentList.svelte';
  import CommentInput from './CommentInput.svelte';
  import AuthPrompt from './AuthPrompt.svelte';

  let { nodeId }: { nodeId: string } = $props();

  let comments = $derived(commentState.getComments(nodeId));
  let isLoading = $derived(commentState.isLoading(nodeId));
  let isSubmitting = $derived(commentState.isSubmitting);

  let canComment = $derived(
    authStore.isAuthenticated && authStore.claims?.isGaimMember &&
    (authStore.claims?.gaimRole === 'admin' || authStore.claims?.gaimRole === 'editor')
  );

  // Load comments when component mounts or nodeId changes
  $effect(() => {
    if (nodeId) {
      commentState.loadComments(nodeId);
    }
  });

  async function handleSubmit(content: string) {
    await commentState.submitComment(nodeId, content);
  }

  async function handleDelete(commentId: string) {
    await commentState.removeComment(nodeId, commentId);
  }
</script>

<div class="comment-section">
  <CommentList
    {comments}
    loading={isLoading}
    onDelete={handleDelete}
  />

  {#if authStore.isAuthenticated}
    {#if canComment}
      <CommentInput
        onSubmit={handleSubmit}
        disabled={isSubmitting}
      />
    {:else}
      <div class="viewer-notice">
        <p>Editors can leave comments</p>
      </div>
    {/if}
  {:else}
    <AuthPrompt />
  {/if}
</div>

<style>
  .comment-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .viewer-notice {
    padding: var(--space-md) var(--space-lg);
    border-top: 1px solid var(--color-border-soft);
    text-align: center;
  }

  .viewer-notice p {
    margin: 0;
    font-size: var(--font-size-small);
    color: var(--color-text-faint);
  }
</style>
