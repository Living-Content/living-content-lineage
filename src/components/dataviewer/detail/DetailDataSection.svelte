<script lang="ts">
  /**
   * Full detail layout container.
   * Displays data in a hierarchical structure:
   * 1. Card data at top (hybrid layout with metrics + properties)
   * 2. Non-card detail data in middle (detail-only fields)
   * 3. Collapsible "Additional Data" section at bottom (unspecified key-value pairs)
   */
  import type { Phase, AssetType, LineageNodeData } from '../../../config/types.js';
  import type { FieldDisplayConfig, AssetDisplayConfig } from '../../../config/displayConfig.js';
  import { getDisplayConfig, classifyCardFields, getDetailOnlyFields, getValueByPath, isConfiguredField } from '../../../config/displayConfig.js';
  import CardSection from '../cards/CardSection.svelte';
  import AdditionalData from './AdditionalData.svelte';
  import PropertyGroup from './PropertyGroup.svelte';
  import PropertyRow from '../PropertyRow.svelte';

  export let node: LineageNodeData;

  $: assetType = node.assetType;
  $: phase = node.phase;
  $: content = node.assetManifest?.content ?? {};
  $: displayConfig = getDisplayConfig(assetType);

  // Classify card fields into metrics and properties
  $: cardClassification = classifyCardFields(displayConfig);

  // Build metrics array with values
  $: metricsWithValues = cardClassification.metrics
    .map(([key, config]) => ({
      key,
      value: getValueByPath(content as Record<string, unknown>, key) ?? getValueByPath(node as unknown as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null);

  // Build properties array with values
  $: propertiesWithValues = cardClassification.properties
    .map(([key, config]) => ({
      key,
      value: getValueByPath(content as Record<string, unknown>, key) ?? getValueByPath(node as unknown as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null);

  // Detail-only fields (shown in middle section)
  $: detailOnlyFields = getDetailOnlyFields(displayConfig);
  $: detailOnlyWithValues = detailOnlyFields
    .map(([key, config]) => ({
      key,
      value: getValueByPath(content as Record<string, unknown>, key) ?? getValueByPath(node as unknown as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null);

  // Additional data: fields in content that aren't in the display config
  $: additionalData = Object.entries(content as Record<string, unknown>)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (isConfiguredField(displayConfig, key)) return false;
      // Skip internal keys
      if (['id', 'type', 'nodeType', 'shape', 'x', 'y'].includes(key)) return false;
      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b));

  $: hasCardData = metricsWithValues.length > 0 || propertiesWithValues.length > 0;
  $: hasDetailData = detailOnlyWithValues.length > 0;
  $: hasAdditionalData = additionalData.length > 0;
</script>

<div class="detail-data-section">
  {#if hasCardData}
    <CardSection
      metrics={metricsWithValues}
      properties={propertiesWithValues}
      {phase}
      columns={displayConfig.cardColumns ?? 2}
    />
  {/if}

  {#if hasDetailData}
    <PropertyGroup title="Details" collapsible={false}>
      {#each detailOnlyWithValues as { key, value, config } (key)}
        <PropertyRow
          label={config.label ?? key}
          value={String(value ?? '-')}
        />
      {/each}
    </PropertyGroup>
  {/if}

  {#if hasAdditionalData}
    <AdditionalData data={additionalData} />
  {/if}

  <slot />
</div>

<style>
  .detail-data-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }
</style>
