<script lang="ts">
  /**
   * Collapsible property section with title header.
   * Contains child content (typically MetaRow elements).
   */
  import Expandable from '../Expandable.svelte';

  export let title: string;
  export let collapsed: boolean = false;
  export let collapsible: boolean = true;

  $: expanded = !collapsed;

  function handleExpandedChange(value: boolean) {
    collapsed = !value;
  }

  $: if (collapsible) {
    // Sync collapsed prop with expanded state
    handleExpandedChange(expanded);
  }
</script>

<div class="property-group">
  {#if collapsible}
    <Expandable bind:expanded>
      <svelte:fragment slot="header">
        <span class="group-title">{title}</span>
      </svelte:fragment>
      <div class="group-content">
        <slot />
      </div>
    </Expandable>
  {:else}
    <div class="group-header">
      <span class="group-title">{title}</span>
    </div>
    <div class="group-content">
      <slot />
    </div>
  {/if}
</div>

<style>
  .property-group {
    border-top: 1px solid var(--section-border-color, rgba(0, 0, 0, 0.06));
    padding-top: var(--space-md, 12px);
    margin-top: var(--space-md, 12px);
  }

  .property-group:first-child {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
  }

  .group-header {
    margin-bottom: var(--space-sm, 8px);
  }

  .group-title {
    font-size: var(--font-size-small, 12px);
    font-weight: var(--font-weight-semibold, 600);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider, 0.05em);
    color: var(--section-header-color, var(--color-text-secondary));
  }

  .group-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
  }
</style>
