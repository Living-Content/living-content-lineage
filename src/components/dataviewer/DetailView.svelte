<script lang="ts">
  /**
   * Detail view - renders asset details with special handling for known field types.
   * Uses merged dataSource pattern for consistent field access.
   * Supports editing for replay when fields are marked as editable.
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
  import EditablePropertyRow from './detail/EditablePropertyRow.svelte';
  import EditableValue from './detail/EditableValue.svelte';
  import CodeBlock from './detail/CodeBlock.svelte';
  import MarkdownValue from './detail/MarkdownValue.svelte';
  import AdditionalData from './detail/AdditionalData.svelte';

  let { node }: { node: TraceNodeData } = $props();

  let nodeId = $derived(node.id);

  let assetType = $derived(node.assetType);
  let phase = $derived(node.phase);
  let displayConfig = $derived(getDisplayConfig(assetType));
  let data = $derived(node.assetManifest?.data ?? {});

  // Build merged dataSource for consistent field access
  let dataSource = $derived(buildDataSource(node));

  // Classify card fields into metrics and properties
  let cardClassification = $derived(classifyCardFields(displayConfig));

  // Metrics with values using getValueByPath
  let metricsWithValues = $derived(cardClassification.metrics
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== ''));

  // Properties with values using getValueByPath
  let propertiesWithValues = $derived(cardClassification.properties
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== ''));

  // Detail-only fields (not shown in cards) using getValueByPath
  let detailOnlyFields = $derived(getDetailOnlyFields(displayConfig));
  let detailOnlyWithValues = $derived(detailOnlyFields
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '' && value !== '-'));

  // Separate special field types for custom rendering
  let markdownFields = $derived(detailOnlyWithValues.filter(({ config }) => config.type === 'markdown'));
  let codeFields = $derived(detailOnlyWithValues.filter(({ config }) => config.type === 'code'));
  let keyValueFields = $derived(detailOnlyWithValues.filter(({ config }) => config.type === 'key-value'));
  let regularDetailFields = $derived(detailOnlyWithValues.filter(({ config }) =>
    config.type !== 'markdown' && config.type !== 'code' && config.type !== 'key-value'
  ));

  // Configured field keys to exclude from fallback/additional data
  let configuredKeys = $derived(new Set(Object.keys(displayConfig.fields)));

  // Fallback: unconfigured simple fields from content (shown as PropertyRows)
  let unconfiguredSimpleFields = $derived(Object.entries(data as Record<string, unknown>)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (['id', 'type', 'nodeType', 'shape', 'x', 'y', 'functionName'].includes(key)) return false;
      if (configuredKeys.has(key)) return false;
      if (typeof value === 'object') return false;
      return true;
    })
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key)));

  // Additional data: only complex objects (arrays, nested objects) from content
  let additionalData = $derived(Object.entries(data as Record<string, unknown>)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (['id', 'type', 'nodeType', 'shape', 'x', 'y', 'functionName'].includes(key)) return false;
      if (configuredKeys.has(key)) return false;
      if (typeof value !== 'object') return false;
      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b)));

  let hasCardData = $derived(metricsWithValues.length > 0 || propertiesWithValues.length > 0);
  let hasDetailData = $derived(regularDetailFields.length > 0);
  let hasUnconfiguredFields = $derived(unconfiguredSimpleFields.length > 0);

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
      {nodeId}
    />
  {/if}

  {#if hasDetailData}
    <PropertyGroup title="Details" collapsible={false}>
      {#each regularDetailFields as { key, value, config } (key)}
        <EditablePropertyRow
          {nodeId}
          fieldPath={config.source ?? `data.${key}`}
          label={config.label ?? key}
          {value}
          isEditable={config.isEditable}
          editType={config.editType}
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
      {#if config.isEditable}
        <EditableValue
          {nodeId}
          fieldPath={config.source ?? `data.${key}`}
          currentValue={value}
          editType={config.editType ?? 'json'}
          showLabel={true}
          label={config.label ?? key}
        />
      {:else}
        <PropertyGroup title={config.label ?? key} collapsible={false}>
          {#each Object.entries(value) as [k, v] (k)}
            <PropertyRow label={k} value={formatKeyValueItem(v)} />
          {/each}
        </PropertyGroup>
      {/if}
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
