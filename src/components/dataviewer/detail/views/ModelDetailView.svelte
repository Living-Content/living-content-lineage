<script lang="ts">
  /**
   * Detail view for Model assets.
   * Displays model info, parameters, and signature.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import { extractAssertionData } from '../../../../services/dataviewer/parsing/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import PropertyRow from '../../PropertyRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: assertions = extractAssertionData(assetManifest?.assertions);
  $: model = assertions.model;
  $: c2paActions = assertions.c2paActions;
  $: tokens = node.tokens;

  $: tokensDisplay = tokens
    ? `${tokens.input.toLocaleString()} in / ${tokens.output.toLocaleString()} out`
    : undefined;
  $: providerDisplay = model?.provider ?? '-';
  $: computationDisplay = model?.computation ?? '-';
  $: modelIdDisplay = model?.modelId ?? '-';
</script>

<div class="model-detail-view">
  <PropertyGroup title="Model Info" collapsible={false}>
    <PropertyRow label="Model ID" value={modelIdDisplay} />
    <PropertyRow label="Provider" value={providerDisplay} />
    <PropertyRow label="Computation" value={computationDisplay} />
    {#if tokensDisplay}
      <PropertyRow label="Tokens" value={tokensDisplay} />
    {/if}
    {#if model?.parameters}
      {#if model.parameters.maxTokens}
        <PropertyRow label="Max Tokens" value={String(model.parameters.maxTokens)} />
      {/if}
      {#if model.parameters.temperature !== undefined}
        <PropertyRow label="Temperature" value={String(model.parameters.temperature)} />
      {/if}
    {/if}
  </PropertyGroup>

  {#if c2paActions?.actions?.length}
    <PropertyGroup title="Actions" collapsed>
      {#each c2paActions.actions as action (action.action)}
        <PropertyRow label="Action" value={action.action ?? '-'} />
        {#if action.softwareAgent}
          <PropertyRow
            label="Agent"
            value={`${action.softwareAgent.name ?? ''} ${action.softwareAgent.version ?? ''}`}
          />
        {/if}
        {#if action.when}
          <PropertyRow label="When" value={action.when} />
        {/if}
      {/each}
    </PropertyGroup>
  {/if}

</div>

<style>
  .model-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }
</style>
