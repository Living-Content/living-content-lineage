<script lang="ts">
  /**
   * Summary view for a selected node.
   * Displays card-designated fields using hybrid layout (metrics + properties).
   * Uses display config to determine which fields to show.
   */
  import type { TraceNodeData } from '../../config/types.js';
  import { getDisplayConfig, classifyCardFields, getValueByPath } from '../../config/displayConfig.js';
  import { extractAssertionData, formatDuration } from '../../services/dataviewer/parsing/assertionParsers.js';
  import { buildDataSource } from '../../services/dataviewer/parsing/dataSourceBuilder.js';
  import CardSection from './cards/CardSection.svelte';
  import ImpactSection from './ImpactSection.svelte';
  import PropertyRow from './PropertyRow.svelte';

  export let node: TraceNodeData;

  $: assetType = node.assetType;
  $: phase = node.phase;
  $: displayConfig = getDisplayConfig(assetType);
  $: data = node.assetManifest?.data ?? {};
  $: assertions = extractAssertionData(node.assetManifest?.assertions);

  // Build merged dataSource for consistent field access
  $: dataSource = buildDataSource(node);

  // Classify card fields into metrics and properties
  $: cardClassification = classifyCardFields(displayConfig);

  // Build metrics array with values
  $: metricsWithValues = cardClassification.metrics
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');

  // Build properties array with values
  $: propertiesWithValues = cardClassification.properties
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');

  $: hasData = metricsWithValues.length > 0 || propertiesWithValues.length > 0;

  // Fallback for unspecified asset types - show duration and basic content
  $: fallbackEntries = !hasData ? getFallbackEntries() : [];

  function getFallbackEntries(): Array<{ key: string; value: unknown }> {
    const entries: Array<{ key: string; value: unknown }> = [];
    // Show action duration if available
    const actionDuration = formatDuration(assertions.action?.durationMs);
    if (actionDuration && actionDuration !== '-') {
      entries.push({ key: 'duration', value: actionDuration });
    }
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null && typeof value !== 'object') {
          // Keep simple values as-is (PropertyRow handles formatting)
          const strValue = String(value);
          if (strValue.length <= 100) {
            entries.push({ key, value });
          }
        }
      }
    }
    return entries.slice(0, 5);
  }
</script>

<div class="summary-view">
  {#if hasData}
    <CardSection
      metrics={metricsWithValues}
      properties={propertiesWithValues}
      {phase}
      columns={displayConfig.cardColumns ?? 4}
      viewMode="summary"
    />
  {:else if fallbackEntries.length > 0}
    <div class="property-list">
      {#each fallbackEntries as { key, value } (key)}
        <PropertyRow label={key} {value} />
      {/each}
    </div>
  {/if}

  <ImpactSection {node} />
</div>

<style>
  .summary-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .property-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
</style>
