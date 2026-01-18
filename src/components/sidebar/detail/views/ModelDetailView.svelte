<script lang="ts">
  /**
   * Detail view for Model assets.
   * Displays model info, parameters, and signature.
   */
  import type { LineageNodeData } from '../../../../types.js';
  import { extractAssertionData } from '../../../../services/sidebar/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import MetaRow from '../../MetaRow.svelte';

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
    <MetaRow label="Model ID" value={modelIdDisplay} />
    <MetaRow label="Provider" value={providerDisplay} />
    <MetaRow label="Computation" value={computationDisplay} />
    {#if tokensDisplay}
      <MetaRow label="Tokens" value={tokensDisplay} />
    {/if}
    {#if model?.parameters}
      {#if model.parameters.maxTokens}
        <MetaRow label="Max Tokens" value={String(model.parameters.maxTokens)} />
      {/if}
      {#if model.parameters.temperature !== undefined}
        <MetaRow label="Temperature" value={String(model.parameters.temperature)} />
      {/if}
    {/if}
  </PropertyGroup>

  {#if c2paActions?.actions?.length}
    <PropertyGroup title="Actions" collapsed>
      {#each c2paActions.actions as action}
        <MetaRow label="Action" value={action.action ?? '-'} />
        {#if action.softwareAgent}
          <MetaRow
            label="Agent"
            value={`${action.softwareAgent.name ?? ''} ${action.softwareAgent.version ?? ''}`}
          />
        {/if}
        {#if action.when}
          <MetaRow label="When" value={action.when} />
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
