<script lang="ts">
  /**
   * Action bar for submitting or resetting replay modifications.
   * Appears when modifications exist, styled to match the header bar.
   */
  import { slide } from 'svelte/transition';
  import { replayState } from '../../stores/replayState.svelte.js';

  interface Props {
    onReplayComplete?: (workflowId: string) => void;
  }

  let { onReplayComplete }: Props = $props();

  let hasModifications = $derived(replayState.hasModifications);
  let modificationCount = $derived(replayState.modificationCount);
  let isSubmitting = $derived(replayState.isSubmitting);

  async function handleSubmit(): Promise<void> {
    const result = await replayState.submitReplay();
    if (result.ok) {
      replayState.clearModifications();
      onReplayComplete?.(result.data.workflowId);
    }
  }

  function handleReset(): void {
    replayState.clearModifications();
  }
</script>

{#if hasModifications}
  <div class="replay-bar" transition:slide={{ duration: 200 }}>
    <div class="bar-content">
      <div class="info">
        <span class="modified-indicator"></span>
        <span class="count">{modificationCount}</span>
        <span class="label">
          {modificationCount === 1 ? 'edit' : 'edits'}
        </span>
      </div>

      <div class="actions">
        <button
          class="action-btn"
          onclick={handleReset}
          disabled={isSubmitting}
        >
          RESET
        </button>
        <button
          class="action-btn primary"
          onclick={handleSubmit}
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <span class="spinner"></span>
            SUBMITTING...
          {:else}
            START REPLAY
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .replay-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-menu-toggle);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .bar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-lg);
    padding: var(--panel-margin);
  }

  .info {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .modified-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: var(--color-warning, #f59e0b);
    border-radius: 50%;
  }

  .count {
    font-size: 18px;
    font-weight: 600;
    color: rgb(var(--color-foreground));
  }

  .label {
    font-size: var(--font-size-small);
    color: rgba(var(--color-foreground), 0.6);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .actions {
    display: flex;
    gap: var(--space-md);
    align-items: center;
  }

  .action-btn {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-small);
    font-weight: 600;
    font-family: inherit;
    border: none;
    border-radius: 0;
    background: transparent;
    color: rgba(var(--color-foreground), 0.5);
    cursor: pointer;
    transition: color 0.15s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .action-btn:hover:not(:disabled) {
    color: rgb(var(--color-foreground));
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-btn.primary {
    color: rgb(var(--color-foreground));
  }

  .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 600px) {
    .bar-content {
      flex-direction: column;
      gap: var(--space-sm);
    }

    .actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
