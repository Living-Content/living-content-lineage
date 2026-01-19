<script lang="ts">
  /**
   * Detail view for Model assets.
   * Displays model info, parameters, and signature.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import { extractAssertionData } from '../../../../services/dataviewer/parsing/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import PropertyRow from '../../PropertyRow.svelte';
  import ActionsList from '../ActionsList.svelte';

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

  {#if c2paActions?.actions}
    <ActionsList actions={c2paActions.actions} />
  {/if}
</div>

<style>
  .model-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }
</style>
