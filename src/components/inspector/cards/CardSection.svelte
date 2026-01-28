<script lang="ts">
  /**
   * Hybrid layout container for card data display.
   * Renders metric cards in a grid and text properties in key-value rows.
   * Used for both summary views and the top section of detail views.
   * Supports editing for replay when fields are marked as editable.
   */
  import type { Phase } from '../../../config/types.js';
  import type { FieldDisplayConfig } from '../../../config/display.js';
  import DataCard from './DataCard.svelte';
  import EditableDataCard from './EditableDataCard.svelte';
  import PropertyRow from '../fields/PropertyRow.svelte';

  let {
    metrics = [],
    properties = [],
    phase = undefined,
    columns = 4,
    nodeId = '',
    step = ''
  }: {
    /** Metric fields to render as cards */
    metrics?: Array<{
      key: string;
      value: unknown;
      config: FieldDisplayConfig;
    }>;
    /** Property fields to render as key-value rows */
    properties?: Array<{
      key: string;
      value: unknown;
      config: FieldDisplayConfig;
    }>;
    /** Phase for color accent */
    phase?: Phase;
    /** Number of columns for the metric grid */
    columns?: 2 | 3 | 4;
    /** Node ID for editable fields (UI tracking) */
    nodeId?: string;
    /** Step for editable fields (required for backend targeting) */
    step?: string;
  } = $props();

  /** Get span from config */
  function getSpan(config: FieldDisplayConfig): 1 | 2 | 3 | 4 {
    return config.span ?? 2;
  }

  let hasMetrics = $derived(metrics.length > 0);
  let hasProperties = $derived(properties.length > 0);
</script>

<div class="card-section">
  {#if hasMetrics}
    <div class="metrics-grid columns-{columns}">
      {#each metrics as { key, value, config } (key)}
        {#if config.isEditable && nodeId && step}
          <EditableDataCard
            {value}
            label={config.label ?? key}
            type={config.type}
            span={getSpan(config)}
            unit={config.unit}
            {phase}
            {nodeId}
            {step}
            fieldPath={config.source ?? `data.${key}`}
            isEditable={true}
            editType={config.editType ?? 'number'}
          />
        {:else}
          <DataCard
            {value}
            label={config.label ?? key}
            type={config.type}
            span={getSpan(config)}
            unit={config.unit}
            {phase}
          />
        {/if}
      {/each}
    </div>
  {/if}

  {#if hasProperties}
    <div class="properties-list">
      {#each properties as { key, value, config } (key)}
        <PropertyRow
          label={config.label ?? key}
          {value}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .card-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-flow: dense;
    gap: var(--space-md);
  }

  .columns-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .columns-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .columns-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 500px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .properties-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
</style>
