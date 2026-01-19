<script lang="ts">
  /**
   * Detail view for Action assets.
   * Displays action type, agent, and execution metadata.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import { extractAssertionData, formatDuration } from '../../../../services/dataviewer/parsing/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import PropertyRow from '../../PropertyRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: assertions = extractAssertionData(assetManifest?.assertions);
  $: c2paActions = assertions.c2paActions;
  $: execution = assertions.execution;

  $: primaryAction = c2paActions?.actions?.[0];
  $: actionType = primaryAction?.action ?? 'unknown';
  $: agentName = primaryAction?.softwareAgent?.name ?? '-';
  $: agentVersion = primaryAction?.softwareAgent?.version ?? '';
  $: durationDisplay = formatDuration(execution?.executionDurationMs);
</script>

<div class="action-detail-view">
  {#if primaryAction}
    <PropertyGroup title="Action Info" collapsible={false}>
      <PropertyRow label="Action Type" value={actionType.replace('c2pa.', '')} />
      <PropertyRow label="Agent" value={agentName} />
      {#if agentVersion}
        <PropertyRow label="Version" value={agentVersion} />
      {/if}
      {#if primaryAction.when}
        <PropertyRow label="When" value={primaryAction.when} />
      {/if}
      {#if primaryAction.digitalSourceType}
        <PropertyRow label="Source Type" value={primaryAction.digitalSourceType.split('/').pop() ?? ''} />
      {/if}
      {#if durationDisplay}
        <PropertyRow label="Duration" value={durationDisplay} />
      {/if}
    </PropertyGroup>
  {/if}

  {#if c2paActions?.actions && c2paActions.actions.length > 1}
    <PropertyGroup title="Additional Actions ({c2paActions.actions.length - 1})" collapsed>
      {#each c2paActions.actions.slice(1) as action (action.action)}
        <div class="additional-action">
          <PropertyRow label="Action" value={action.action ?? '-'} />
          {#if action.softwareAgent}
            <PropertyRow
              label="Agent"
              value={`${action.softwareAgent.name ?? ''} ${action.softwareAgent.version ?? ''}`}
            />
          {/if}
        </div>
      {/each}
    </PropertyGroup>
  {/if}
</div>

<style>
  .action-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }

  .additional-action {
    padding: var(--space-sm, 8px) 0;
    border-top: 1px solid var(--color-border-light, rgba(0, 0, 0, 0.04));
  }

  .additional-action:first-child {
    border-top: none;
    padding-top: 0;
  }
</style>
