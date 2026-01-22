<script lang="ts">
  /**
   * Detail view - renders asset details with special handling for known field types.
   * Uses merged dataSource pattern for consistent field access.
   */
  import type { LineageNodeData } from '../../config/types.js';
  import {
    getDisplayConfig,
    classifyCardFields,
    getDetailOnlyFields,
    getValueByPath,
  } from '../../config/displayConfig.js';
  import {
    extractAssertionData,
    formatDuration,
    type ParsedAssertionData,
  } from '../../services/dataviewer/parsing/assertionParsers.js';
  import CardSection from './cards/CardSection.svelte';
  import PropertyGroup from './detail/PropertyGroup.svelte';
  import PropertyRow from './PropertyRow.svelte';
  import CodeBlock from './detail/CodeBlock.svelte';
  import MarkdownValue from './detail/MarkdownValue.svelte';
  import AdditionalData from './detail/AdditionalData.svelte';

  export let node: LineageNodeData;

  let assertions: ParsedAssertionData;

  $: assetType = node.assetType;
  $: assetManifest = node.assetManifest;
  $: phase = node.phase;
  $: displayConfig = getDisplayConfig(assetType);
  $: assertions = extractAssertionData(assetManifest?.assertions);
  $: content = assetManifest?.content ?? {};

  // Computed values that require transformation
  $: durationMs = assertions.action?.durationMs ?? assertions.execution?.executionDurationMs;

  function formatDimensions(c: Record<string, unknown>): string | undefined {
    const width = c.width as number | undefined;
    const height = c.height as number | undefined;
    if (width && height) return `${width}×${height}`;
    return undefined;
  }

  // Type-safe content access
  type ContentWithNested = Record<string, unknown> & {
    executionResult?: Record<string, unknown>;
    executionPlan?: Record<string, unknown>;
  };
  $: typedContent = content as ContentWithNested;

  // Build merged dataSource for consistent field access
  // This allows getValueByPath to find both configured AND content fields
  $: dataSource = {
    // Spread content first so explicit fields can override
    ...content,
    // Flatten nested objects from result data
    ...(typedContent.executionResult ?? {}),
    ...(typedContent.executionPlan ?? {}),
    // Node-level fields
    ...node,
    // Model-specific fields (tokens from lco.usage assertion)
    modelId: assertions.model?.modelId,
    provider: assertions.model?.provider,
    'tokens.input': assertions.usage?.inputTokens,
    'tokens.output': assertions.usage?.outputTokens,
    // Code-specific fields
    function: assertions.code?.function ?? assertions.action?.function,
    module: assertions.code?.module,
    hash: assertions.code?.hash,
    // Duration: unified for both Action and Code
    duration: formatDuration(durationMs),
    // Action-specific fields
    actionType: assertions.c2paActions?.actions?.[0]?.action?.replace('c2pa.', ''),
    agent: assertions.c2paActions?.actions?.[0]?.softwareAgent?.name,
    agentVersion: assertions.c2paActions?.actions?.[0]?.softwareAgent?.version,
    startTime: assertions.action?.startTime ?? assertions.execution?.executionStartTime,
    endTime: assertions.action?.endTime ?? assertions.execution?.executionEndTime,
    // Attestation/Credential fields
    status: assetManifest?.attestation ? 'Verified' : undefined,
    algorithm: assetManifest?.attestation?.alg,
    issuer: assetManifest?.attestation?.issuer,
    // Media fields
    format: assetManifest?.format,
    dimensions: formatDimensions(content as Record<string, unknown>),
    fileSize: (content as Record<string, unknown>).size,
    // Source code
    sourceCode: assetManifest?.sourceCode,
  };

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
  $: unconfiguredSimpleFields = Object.entries(content as Record<string, unknown>)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (['id', 'type', 'nodeType', 'shape', 'x', 'y'].includes(key)) return false;
      if (configuredKeys.has(key)) return false;
      if (typeof value === 'object') return false;
      return true;
    })
    .map(([key, value]) => ({ key, value: String(value) }))
    .sort((a, b) => a.key.localeCompare(b.key));

  // Additional data: only complex objects (arrays, nested objects) from content
  $: additionalData = Object.entries(content as Record<string, unknown>)
    .filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (['id', 'type', 'nodeType', 'shape', 'x', 'y'].includes(key)) return false;
      if (configuredKeys.has(key)) return false;
      if (typeof value !== 'object') return false;
      return true;
    })
    .sort(([a], [b]) => a.localeCompare(b));

  $: hasCardData = metricsWithValues.length > 0 || propertiesWithValues.length > 0;
  $: hasDetailData = regularDetailFields.length > 0;
  $: hasUnconfiguredFields = unconfiguredSimpleFields.length > 0;
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
          value={String(value ?? '-')}
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
          <PropertyRow label={k} value={typeof v === 'object' ? JSON.stringify(v) : String(v ?? '-')} />
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
    gap: var(--space-lg, 16px);
  }
</style>
