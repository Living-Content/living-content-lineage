<script lang="ts">
  /**
   * Generic fallback detail view for unknown or unspecified asset types.
   * Displays all available content, assertions, and metadata.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import {
    shouldDisplayKey,
    formatKeyLabel,
    isSummaryValue,
  } from '../../../../services/dataviewer/parsing/contentKeys.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import DetailValue from '../DetailValue.svelte';
  import MetaRow from '../../MetaRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: contentEntries = assetManifest?.content
    ? Object.entries(assetManifest.content).filter(
        ([key, value]) =>
          shouldDisplayKey(key) && !isSummaryValue(value) && value !== undefined && value !== null
      )
    : [];
</script>

<div class="generic-detail-view">
  {#if contentEntries.length > 0}
    <PropertyGroup title="Content" collapsible={false}>
      <div class="detail-fields">
        {#each contentEntries as [key, value] (key)}
          <div class="detail-field">
            <span class="detail-field-key">{formatKeyLabel(key)}</span>
            <DetailValue {value} />
          </div>
        {/each}
      </div>
    </PropertyGroup>
  {/if}

  {#if assetManifest?.sourceCode}
    <PropertyGroup title="Source Code">
      <pre class="code-block"><code>{assetManifest.sourceCode}</code></pre>
    </PropertyGroup>
  {/if}

  {#if assetManifest?.assertions?.length}
    <PropertyGroup title="Assertions">
      <div class="detail-fields">
        {#each assetManifest.assertions as assertion (assertion.label)}
          <div class="assertion-block">
            <div class="assertion-label">{assertion.label}</div>
            <div class="assertion-data">
              <DetailValue value={assertion.data} />
            </div>
          </div>
        {/each}
      </div>
    </PropertyGroup>
  {/if}

  {#if assetManifest?.ingredients?.length}
    <PropertyGroup title="Ingredients">
      <div class="ingredients-list">
        {#each assetManifest.ingredients as ingredient (ingredient.instanceId)}
          <div class="ingredient-item">
            <span class="ingredient-title">{ingredient.title}</span>
            <span class="ingredient-rel">{ingredient.relationship}</span>
          </div>
        {/each}
      </div>
    </PropertyGroup>
  {/if}

  {#if assetManifest?.format || assetManifest?.instanceId || assetManifest?.claimGenerator}
    <PropertyGroup title="Manifest">
      {#if assetManifest.format}
        <MetaRow label="Format" value={assetManifest.format} />
      {/if}
      {#if assetManifest.instanceId}
        <MetaRow label="Instance ID" value={assetManifest.instanceId} />
      {/if}
      {#if assetManifest.claimGenerator}
        <MetaRow label="Generator" value={assetManifest.claimGenerator} />
      {/if}
    </PropertyGroup>
  {/if}
</div>

<style>
  .generic-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }

  .detail-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 12px);
  }

  .detail-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
  }

  .detail-field-key {
    font-size: var(--font-size-small, 12px);
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-text-light);
  }

  .assertion-block {
    padding: var(--space-sm, 8px) 0;
    border-top: 1px solid var(--color-border-light, rgba(0, 0, 0, 0.04));
  }

  .assertion-block:first-child {
    border-top: none;
    padding-top: 0;
  }

  .assertion-label {
    font-size: var(--font-size-small, 12px);
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xs, 4px);
  }

  .assertion-data {
    font-size: var(--font-size-small, 12px);
    color: var(--color-text-muted);
  }

  .code-block {
    margin: 0;
    padding: var(--space-md, 12px);
    background: var(--code-block-bg, rgba(0, 0, 0, 0.04));
    border: 1px solid var(--code-block-border, rgba(0, 0, 0, 0.04));
    border-radius: var(--radius-md, 8px);
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-small, 12px);
    line-height: var(--line-height-relaxed, 1.6);
    color: var(--code-text-color, var(--color-text-secondary));
  }

  .code-block code {
    font-family: inherit;
  }

  .ingredients-list {
    display: grid;
    grid-template-columns: auto auto;
    justify-content: start;
    column-gap: var(--space-md, 12px);
    row-gap: var(--space-sm, 8px);
  }

  .ingredient-item {
    display: contents;
  }

  .ingredient-title {
    font-size: var(--font-size-small, 12px);
    color: var(--color-text-primary);
  }

  .ingredient-rel {
    font-size: var(--font-size-tiny, 10px);
    color: var(--color-text-light);
    text-transform: uppercase;
  }
</style>
