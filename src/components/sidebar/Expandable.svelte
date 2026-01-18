<script lang="ts">
  /**
   * Reusable expandable/collapsible section.
   * Provides toggle header with chevron and animated content reveal.
   */
  import { slide } from 'svelte/transition';

  export let expanded: boolean = false;
  export let disabled: boolean = false;

  function toggle() {
    if (!disabled) {
      expanded = !expanded;
    }
  }
</script>

<div class="expandable" class:expanded class:disabled>
  <button
    class="expandable-toggle"
    type="button"
    aria-expanded={expanded}
    on:click={toggle}
    {disabled}
  >
    <span class="expandable-header">
      <slot name="header" />
    </span>
    <span class="expandable-chevron" class:expanded>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  </button>
  {#if expanded}
    <div class="expandable-content" transition:slide={{ duration: 200 }}>
      <slot />
    </div>
  {/if}
</div>

<style>
  .expandable-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
  }

  .expandable-toggle:disabled {
    cursor: default;
  }

  .expandable-header {
    flex: 1;
    min-width: 0;
  }

  .expandable-chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-light);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .expandable-chevron.expanded {
    transform: rotate(180deg);
  }

  .expandable-content {
    padding-top: var(--space-sm, 8px);
  }
</style>
