<script lang="ts">
  /**
   * Summary view for a selected node.
   * Displays card-designated fields using hybrid layout (metrics + properties).
   * Uses display config to determine which fields to show.
   */
  import type { TraceNodeData } from '../../../config/types.js';
  import { getDisplayConfig, classifyCardFields, getValueByPath } from '../../../config/display.js';
  import { extractAssertionData, formatDuration } from '../../../services/inspector/assertions.js';
  import { buildDataSource } from '../../../services/inspector/dataSource.js';
  import CardSection from '../cards/CardSection.svelte';
  import ImpactSection from '../sections/ImpactSection.svelte';
  import PropertyRow from '../fields/PropertyRow.svelte';

  let { node }: { node: TraceNodeData } = $props();

  let assetType = $derived(node.assetType);
  let phase = $derived(node.phase);
  let displayConfig = $derived(getDisplayConfig(assetType));
  let data = $derived(node.assetManifest?.data ?? {});
  let assertions = $derived(extractAssertionData(node.assetManifest?.assertions));

  // Build merged dataSource for consistent field access
  let dataSource = $derived(buildDataSource(node));

  // Classify card fields into metrics and properties
  let cardClassification = $derived(classifyCardFields(displayConfig));

  // Build metrics array with values
  let metricsWithValues = $derived(cardClassification.metrics
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== ''));

  // Build properties array with values
  let propertiesWithValues = $derived(cardClassification.properties
    .map(([key, config]) => ({
      key,
      value: getValueByPath(dataSource as Record<string, unknown>, key),
      config,
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== ''));

  let hasData = $derived(metricsWithValues.length > 0 || propertiesWithValues.length > 0);

  // Fallback for unspecified asset types - show duration and basic content
  let fallbackEntries = $derived(!hasData ? getFallbackEntries() : []);

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
