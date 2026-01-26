<script lang="ts">
  /**
   * Summary view for a selected node.
   * Displays card-designated fields using hybrid layout (metrics + properties).
   * Uses display config to determine which fields to show.
   */
  import type { TraceNodeData } from '../../config/types.js';
  import { getDisplayConfig, classifyCardFields, getValueByPath } from '../../config/displayConfig.js';
  import { extractAssertionData, formatDuration } from '../../services/dataviewer/parsing/assertionParsers.js';
  import CardSection from './cards/CardSection.svelte';
  import ImpactSection from './ImpactSection.svelte';
  import PropertyRow from './PropertyRow.svelte';

  export let node: TraceNodeData;

  $: assetType = node.assetType;
  $: phase = node.phase;
  $: displayConfig = getDisplayConfig(assetType);
  $: data = node.assetManifest?.data ?? {};
  $: assertions = extractAssertionData(node.assetManifest?.assertions);

  // Build data source combining node, data, and assertions
  // Duration: prefer lco.action (Actions), fall back to lco.execution (Code)
  $: durationMs = assertions.action?.durationMs ?? assertions.execution?.executionDurationMs;

  // Type-safe data access
  type DataWithNested = Record<string, unknown> & {
    executionResult?: Record<string, unknown>;
    executionPlan?: Record<string, unknown>;
  };
  $: typedData = data as DataWithNested;

  $: dataSource = {
    // Spread data first
    ...data,
    // Flatten nested objects from result data
    ...(typedData.executionResult ?? {}),
    ...(typedData.executionPlan ?? {}),
    // Node-level fields
    ...node,
    // Model-specific fields (tokens from lco.usage assertion)
    modelId: assertions.model?.modelId,
    provider: assertions.model?.provider,
    'tokens.input': assertions.usage?.inputTokens,
    'tokens.output': assertions.usage?.outputTokens,
    // Code-specific fields
    function: assertions.code?.function,
    module: assertions.code?.module,
    // Duration: unified for both Action and Code
    duration: formatDuration(durationMs),
    // Action-specific fields
    actionType: assertions.c2paActions?.actions?.[0]?.action?.replace('c2pa.', ''),
    agent: assertions.c2paActions?.actions?.[0]?.softwareAgent?.name,
    // Attestation/Credential fields
    status: node.assetManifest?.attestation ? 'Verified' : undefined,
    algorithm: node.assetManifest?.attestation?.alg,
    issuer: node.assetManifest?.attestation?.issuer,
    // Media fields
    format: node.assetManifest?.format,
    dimensions: formatDimensions(data as Record<string, unknown>),
    fileSize: (data as Record<string, unknown>).size,
  };

  function formatDimensions(c: Record<string, unknown>): string | undefined {
    const width = c.width as number | undefined;
    const height = c.height as number | undefined;
    if (width && height) return `${width}×${height}`;
    return undefined;
  }

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
    gap: var(--space-md, 12px);
  }

  .property-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }
</style>
