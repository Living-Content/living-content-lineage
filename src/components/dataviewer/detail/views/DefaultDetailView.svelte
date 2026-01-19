<script lang="ts">
  /**
   * Default detail view for DataObject and unspecified asset types.
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
  import PropertyRow from '../../PropertyRow.svelte';
  import CodeBlock from '../CodeBlock.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: format = assetManifest?.format ?? 'unknown';
  $: isDataObject = node.assetType === 'DataObject';
  $: contentEntries = assetManifest?.content
    ? Object.entries(assetManifest.content).filter(
        ([key, value]) =>
          shouldDisplayKey(key) && !isSummaryValue(value) && value !== undefined && value !== null
      )
    : [];
  $: fieldCount = contentEntries.length;
</script>

<div class="default-detail-view">
  {#if isDataObject}
    <PropertyGroup title="Data Info" collapsible={false}>
      <PropertyRow label="Format" value={format.split('/').pop() ?? format} />
      <PropertyRow label="Fields" value={String(fieldCount)} />
    </PropertyGroup>
  {/if}

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
    <CodeBlock code={assetManifest.sourceCode} />
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
        <PropertyRow label="Format" value={assetManifest.format} />
      {/if}
      {#if assetManifest.instanceId}
        <PropertyRow label="Instance ID" value={assetManifest.instanceId} />
      {/if}
      {#if assetManifest.claimGenerator}
        <PropertyRow label="Generator" value={assetManifest.claimGenerator} />
      {/if}
    </PropertyGroup>
  {/if}
</div>

<style>
  .default-detail-view {
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
