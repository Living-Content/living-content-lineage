<script lang="ts">
  /**
   * Action bar for submitting or resetting replay modifications.
   * Appears when modifications exist, provides replay submission controls.
   * Uses toastStore for feedback notifications.
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
      onReplayComplete?.(result.value.workflowId);
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
        <span class="count">{modificationCount}</span>
        <span class="label">
          {modificationCount === 1 ? 'modification' : 'modifications'}
        </span>
      </div>

      <div class="actions">
        <button
          class="button button--secondary"
          onclick={handleReset}
          disabled={isSubmitting}
        >
          Reset
        </button>
        <button
          class="button button--primary"
          onclick={handleSubmit}
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <span class="spinner"></span>
            Submitting...
          {:else}
            Replay from here
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
    z-index: var(--z-modal, 1000);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  }

  .bar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-lg);
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-md) var(--space-xl);
  }

  .info {
    display: flex;
    align-items: baseline;
    gap: var(--space-xs);
  }

  .count {
    font-size: var(--font-size-large);
    font-weight: 600;
    color: var(--color-primary);
  }

  .label {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  .actions {
    display: flex;
    gap: var(--space-sm);
  }

  /* Button overrides for replay bar context */
  .actions .button {
    padding: var(--space-sm) var(--space-lg);
    font-size: var(--font-size-small);
  }

  .spinner {
    width: 14px;
    height: 14px;
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
    }

    .btn {
      flex: 1;
      justify-content: center;
    }
  }
</style>
