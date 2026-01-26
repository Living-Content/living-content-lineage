<script lang="ts">
  /**
   * Detail view - renders asset details with special handling for known field types.
   * Uses merged dataSource pattern for consistent field access.
   */
  import type { TraceNodeData } from '../../config/types.js';
  import {
    getDisplayConfig,
    classifyCardFields,
    getDetailOnlyFields,
    getValueByPath,
  } from '../../config/displayConfig.js';
  import { buildDataSource } from '../../services/dataviewer/parsing/dataSourceBuilder.js';
  import CardSection from './cards/CardSection.svelte';
  import PropertyGroup from './detail/PropertyGroup.svelte';
  import PropertyRow from './PropertyRow.svelte';
  import CodeBlock from './detail/CodeBlock.svelte';
  import MarkdownValue from './detail/MarkdownValue.svelte';
  import AdditionalData from './detail/AdditionalData.svelte';

  export let node: TraceNodeData;

  $: assetType = node.assetType;
  $: phase = node.phase;
  $: displayConfig = getDisplayConfig(assetType);
  $: data = node.assetManifest?.data ?? {};

  // Build merged dataSource for consistent field access
  $: dataSource = buildDataSource(node);

  // Classify card fields into metrics and properties
  $: cardClassification = classifyCardFields(displayConfig);

  // Metrics with values using getValueByPath
  $: metricsWithValues = cardClassification.metrics
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');

  // Properties with values using getValueByPath
  $: propertiesWithValues = cardClassification.properties
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');

  // Detail-only fields (not shown in cards) using getValueByPath
  $: detailOnlyFields = getDetailOnlyFields(displayConfig);
  $: detailOnlyWithValues = detailOnlyFields
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '' && value !== '-');

  // Separate special field types for custom rendering
  $: markdownFields = detailOnlyWithValues.filter(({ config }) => config.type === 'markdown');
  $: codeFields = detailOnlyWithValues.filter(({ config }) => config.type === 'code');
  $: keyValueFields = detailOnlyWithValues.filter(({ config }) => config.type === 'key-value');
  $: regularDetailFields = detailOnlyWithValues.filter(({ config }) =>
    config.type !== 'markdown' && config.type !== 'code' && config.type !== 'key-value'
  );

  // Configured field keys to exclude from fallback/additional data
  $: configuredKeys = new Set(Object.keys(displayConfig.fields));

  // Fallback: unconfigured simple fields from content (shown as PropertyRows)
  $: unconfiguredSimpleFields = Object.entries(data as Record<string, unknown>)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (['id', 'type', 'nodeType', 'shape', 'x', 'y', 'functionName'].includes(key)) return false;
      if (configuredKeys.has(key)) return false;
      if (typeof value === 'object') return false;
      return true;
    })
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));

  // Additional data: only complex objects (arrays, nested objects) from content
  $: additionalData = Object.entries(data as Record<string, unknown>)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (['id', 'type', 'nodeType', 'shape', 'x', 'y', 'functionName'].includes(key)) return false;
      if (configuredKeys.has(key)) return false;
      if (typeof value !== 'object') return false;
      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b));

  $: hasCardData = metricsWithValues.length > 0 || propertiesWithValues.length > 0;
  $: hasDetailData = regularDetailFields.length > 0;
  $: hasUnconfiguredFields = unconfiguredSimpleFields.length > 0;

  /**
   * Format a key-value item for display.
   * Handles nested objects by converting to JSON with truncation.
   */
  const formatKeyValueItem = (v: unknown): string => {
    if (v === null || v === undefined) return '-';
    if (typeof v !== 'object') return String(v);
    const str = JSON.stringify(v);
    // Truncate long JSON to prevent UI overflow
    if (str.length > 100) {
      return str.slice(0, 100) + '...';
    }
    return str;
  };
</script>

<div class="detail-view">
  {#if hasCardData}
    <CardSection
      metrics={metricsWithValues}
      properties={propertiesWithValues}
      {phase}
      columns={displayConfig.cardColumns ?? 4}
      viewMode="detail"
    />
  {/if}

  {#if hasDetailData}
    <PropertyGroup title="Details" collapsible={false}>
      {#each regularDetailFields as { key, value, config } (key)}
        <PropertyRow
          label={config.label ?? key}
          {value}
        />
      {/each}
    </PropertyGroup>
  {/if}

  {#if hasUnconfiguredFields}
    <PropertyGroup title="Properties" collapsible={false}>
      {#each unconfiguredSimpleFields as { key, value } (key)}
        <PropertyRow label={key} {value} />
      {/each}
    </PropertyGroup>
  {/if}

  {#each keyValueFields as { key, value, config } (key)}
    {#if value && typeof value === 'object'}
      <PropertyGroup title={config.label ?? key} collapsible={false}>
        {#each Object.entries(value) as [k, v] (k)}
          <PropertyRow label={k} value={formatKeyValueItem(v)} />
        {/each}
      </PropertyGroup>
    {/if}
  {/each}

  {#each codeFields as { key, value, config } (key)}
    <CodeBlock code={String(value ?? '')} title={config.label ?? key} />
  {/each}

  {#each markdownFields as { key, value, config } (key)}
    <PropertyGroup title={config.label ?? key} collapsed={true}>
      <MarkdownValue value={String(value ?? '')} />
    </PropertyGroup>
  {/each}

  {#if additionalData.length > 0}
    <AdditionalData data={additionalData} />
  {/if}
</div>

<style>
  .detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
</style>
