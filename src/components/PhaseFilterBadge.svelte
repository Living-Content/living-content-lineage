<script lang="ts">
  /**
   * Displays a badge overlay when a phase filter is active.
   * Shows the phase name with a close button to clear the filter.
   */
  import { uiState } from '../stores/uiState.svelte.js';

  let phase = $derived(uiState.phaseFilter);
  let phaseClass = $derived(phase ? `phase-${phase.toLowerCase()}` : '');
</script>

{#if phase}
  <div class="phase-filter-badge {phaseClass}">
    <span class="phase-name">{phase} STEPS</span>
    <button class="close-button" onclick={() => uiState.clearPhaseFilter()} aria-label="Clear phase filter">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
{/if}

<style>
  .phase-filter-badge {
    position: fixed;
    top: var(--phase-badge-top, 160px);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    padding: var(--space-md, 12px) var(--space-lg, 16px);
    border-radius: var(--radius-full, 9999px);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    z-index: var(--z-overlay, 300);
    pointer-events: auto;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
  }

  .phase-name {
    user-select: none;
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.2);
    color: inherit;
    cursor: pointer;
    transition: background var(--duration-fast, 0.1s) ease;
  }

  .close-button:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  .close-button:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }

  /* Phase-based colors */
  .phase-acquisition {
    background: var(--phase-acquisition, rgb(239, 45, 45));
    color: white;
  }

  .phase-preparation {
    background: var(--phase-preparation, rgb(255, 89, 94));
    color: white;
  }

  .phase-retrieval {
    background: var(--phase-retrieval, rgb(255, 202, 58));
    color: var(--color-text-primary, #1a1a1a);
  }

  .phase-reasoning {
    background: var(--phase-reasoning, rgb(138, 201, 38));
    color: var(--color-text-primary, #1a1a1a);
  }

  .phase-generation {
    background: var(--phase-generation, rgb(25, 130, 196));
    color: white;
  }

  .phase-persistence {
    background: var(--phase-persistence, rgb(0, 84, 175));
    color: white;
  }
</style>
