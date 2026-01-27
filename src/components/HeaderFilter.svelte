<script lang="ts">
  /**
   * Header filter indicator component.
   * Shows active phase filter in the header with an X to clear.
   */
  import { uiState } from '../stores/uiState.svelte.js';

  let phase = $derived(uiState.phaseFilter);
  let phaseClass = $derived(phase ? `phase-${phase.toLowerCase()}` : '');
</script>

{#if phase}
  <button
    class="filter-indicator {phaseClass}"
    onclick={() => uiState.clearPhaseFilter()}
    aria-label="Clear {phase} filter"
  >
    <svg class="filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4h18l-7 8.5V18l-4 2v-7.5L3 4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="phase-name">{phase}</span>
    <svg class="close-icon" width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>
{/if}

<style>
  .filter-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 4px);
    padding: 4px 8px;
    border: none;
    border-radius: var(--radius-sm, 4px);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .filter-indicator:hover {
    opacity: 0.8;
  }

  .filter-indicator:focus {
    outline: 2px solid rgba(255, 255, 255, 0.3);
    outline-offset: 2px;
  }

  .filter-icon {
    flex-shrink: 0;
  }

  .phase-name {
    user-select: none;
  }

  .close-icon {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .filter-indicator:hover .close-icon {
    opacity: 1;
  }

  /* Phase-based colors */
  .phase-acquisition {
    color: var(--phase-acquisition, rgb(239, 45, 45));
  }

  .phase-preparation {
    color: var(--phase-preparation, rgb(255, 89, 94));
  }

  .phase-retrieval {
    color: var(--phase-retrieval, rgb(255, 202, 58));
  }

  .phase-reasoning {
    color: var(--phase-reasoning, rgb(138, 201, 38));
  }

  .phase-generation {
    color: var(--phase-generation, rgb(25, 130, 196));
  }

  .phase-persistence {
    color: var(--phase-persistence, rgb(0, 84, 175));
  }
</style>
