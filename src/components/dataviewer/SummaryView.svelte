<script lang="ts">
  /**
   * Summary view for a selected node.
   * Displays card-designated fields using hybrid layout (metrics + properties).
   * Uses display config to determine which fields to show.
   */
  import type { LineageNodeData } from '../../config/types.js';
  import { getDisplayConfig, classifyCardFields, getValueByPath } from '../../config/displayConfig.js';
  import { extractAssertionData, formatDuration } from '../../services/dataviewer/parsing/assertionParsers.js';
  import CardSection from './cards/CardSection.svelte';
  import ImpactSection from './ImpactSection.svelte';
  import PropertyRow from './PropertyRow.svelte';

  export let node: LineageNodeData;

  $: assetType = node.assetType;
  $: phase = node.phase;
  $: displayConfig = getDisplayConfig(assetType);
  $: content = node.assetManifest?.content ?? {};
  $: assertions = extractAssertionData(node.assetManifest?.assertions);

  // Build data source combining node, content, and assertions
  // Duration: prefer lco.action (Actions), fall back to lco.execution (Code)
  $: durationMs = assertions.action?.durationMs ?? assertions.execution?.executionDurationMs;

  $: dataSource = {
    ...content,
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
    // Document fields
    query: (content as Record<string, unknown>).query,
    response: (content as Record<string, unknown>).response,
    messageCount: (content as Record<string, unknown>).messageCount,
    // Dataset fields
    chunksRetrieved: (content as { execution_result?: { chunks_retrieved?: number } }).execution_result?.chunks_retrieved,
    confidence: (content as { execution_result?: { confidence?: number } }).execution_result?.confidence,
    // Media fields
    format: node.assetManifest?.format,
    dimensions: formatDimensions(content as Record<string, unknown>),
    fileSize: (content as Record<string, unknown>).size,
    // Token fields (from content for Result/Action types - already camelCase after normalization)
    inputTokens: (content as Record<string, unknown>).inputTokens,
    outputTokens: (content as Record<string, unknown>).outputTokens,
    totalTokens: (content as Record<string, unknown>).totalTokens,
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

  function getFallbackEntries(): Array<{ key: string; value: string }> {
    const entries: Array<{ key: string; value: string }> = [];
    // Show action duration if available
    const actionDuration = formatDuration(assertions.action?.durationMs);
    if (actionDuration && actionDuration !== '-') {
      entries.push({ key: 'duration', value: actionDuration });
    }
    if (content && typeof content === 'object') {
      for (const [key, value] of Object.entries(content)) {
        if (value !== undefined && value !== null && typeof value !== 'object') {
          const strValue = String(value);
          if (strValue.length <= 100) {
            entries.push({ key, value: strValue });
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
