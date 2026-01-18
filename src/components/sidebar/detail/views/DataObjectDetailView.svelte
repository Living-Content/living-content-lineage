<script lang="ts">
  /**
   * Detail view for DataObject assets.
   * Displays generic data object content and metadata.
   */
  import type { LineageNodeData } from '../../../../types.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import MetaRow from '../../MetaRow.svelte';
  import DetailValue from '../DetailValue.svelte';
  import {
    shouldDisplayKey,
    formatKeyLabel,
    isSummaryValue,
  } from '../../../../services/sidebar/contentKeys.js';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: content = assetManifest?.content;
  $: format = assetManifest?.format ?? 'unknown';

  $: contentEntries = content
    ? Object.entries(content).filter(
        ([key, value]) =>
          shouldDisplayKey(key) && !isSummaryValue(value) && value !== undefined && value !== null
      )
    : [];

  $: fieldCount = contentEntries.length;
</script>

<div class="data-object-detail-view">
  <PropertyGroup title="Data Info" collapsible={false}>
    <MetaRow label="Format" value={format.split('/').pop() ?? format} />
    <MetaRow label="Fields" value={String(fieldCount)} />
  </PropertyGroup>

  {#if contentEntries.length > 0}
    <PropertyGroup title="Content" collapsible={false}>
      <div class="content-fields">
        {#each contentEntries as [key, value] (key)}
          <div class="content-field">
            <span class="field-key">{formatKeyLabel(key)}</span>
            <div class="field-value">
              <DetailValue {value} />
            </div>
          </div>
        {/each}
      </div>
    </PropertyGroup>
  {/if}
</div>

<style>
  .data-object-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }

  .content-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  .content-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
  }

  .field-key {
    font-size: var(--font-size-small, 12px);
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-text-light);
  }

  .field-value {
    font-size: var(--font-size-body, 14px);
    color: var(--color-text-secondary);
  }
</style>
