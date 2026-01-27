<script lang="ts">
  /**
   * Collapsible property section with title header.
   * Contains child content (typically PropertyRow elements).
   */
  import type { Snippet } from 'svelte';
  import Expandable from '../Expandable.svelte';

  let {
    title,
    collapsed = false,
    collapsible = true,
    children
  }: {
    title: string;
    collapsed?: boolean;
    collapsible?: boolean;
    children: Snippet;
  } = $props();

  let expanded = $state(!collapsed);
</script>

<div class="property-group">
  {#if collapsible}
    <Expandable bind:expanded>
      {#snippet header()}
        <span class="group-title">{title}</span>
      {/snippet}
      <div class="group-content">
        {@render children()}
      </div>
    </Expandable>
  {:else}
    <div class="group-header">
      <span class="group-title">{title}</span>
    </div>
    <div class="group-content">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .property-group {
    border-top: 1px solid var(--section-border-color, rgba(0, 0, 0, 0.06));
    padding-top: var(--space-md);
    margin-top: var(--space-md);
  }

  .property-group:first-child {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
  }

  .group-header {
    margin-bottom: var(--space-sm);
  }

  .group-title {
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-semibold, 600);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider, 0.05em);
    color: var(--section-header-color, var(--color-text-secondary));
  }

  .group-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
</style>
