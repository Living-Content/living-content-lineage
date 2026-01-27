<script lang="ts">
  /**
   * Reusable component for displaying C2PA actions.
   * Used by ActionDetailView, MediaDetailView, and ModelDetailView.
   */
  import type { C2paAction } from '../../../services/dataviewer/parsing/assertionParsers.js';
  import PropertyGroup from './PropertyGroup.svelte';
  import PropertyRow from '../PropertyRow.svelte';

  let { actions, title = 'Actions', collapsed = true }: {
    actions: C2paAction[];
    title?: string;
    collapsed?: boolean;
  } = $props();
</script>

{#if actions.length > 0}
  <PropertyGroup {title} {collapsed}>
    {#each actions as action (action.action)}
      <div class="action-item">
        <PropertyRow label="Action" value={action.action ?? '-'} />
        {#if action.softwareAgent}
          <PropertyRow
            label="Agent"
            value={`${action.softwareAgent.name ?? ''} ${action.softwareAgent.version ?? ''}`.trim() || '-'}
          />
        {/if}
        {#if action.when}
          <PropertyRow label="When" value={action.when} />
        {/if}
      </div>
    {/each}
  </PropertyGroup>
{/if}

<style>
  .action-item {
    padding: var(--space-sm) 0;
    border-top: 1px solid var(--color-border-light, rgba(0, 0, 0, 0.04));
  }

  .action-item:first-child {
    border-top: none;
    padding-top: 0;
  }
</style>
