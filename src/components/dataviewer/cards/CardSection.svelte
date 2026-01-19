<script lang="ts">
  /**
   * Hybrid layout container for card data display.
   * Renders metric cards in a grid and text properties in key-value rows.
   * Used for both summary views and the top section of detail views.
   */
  import type { Phase } from '../../../config/types.js';
  import type { FieldDisplayConfig } from '../../../config/displayConfig.js';
  import DataCard from './DataCard.svelte';
  import PropertyRow from '../PropertyRow.svelte';

  /** Metric fields to render as cards */
  export let metrics: Array<{
    key: string;
    value: unknown;
    config: FieldDisplayConfig;
  }> = [];

  /** Property fields to render as key-value rows */
  export let properties: Array<{
    key: string;
    value: unknown;
    config: FieldDisplayConfig;
  }> = [];

  /** Phase for color accent */
  export let phase: Phase | undefined = undefined;

  /** Number of columns for the metric grid */
  export let columns: 2 | 3 | 4 = 4;

  $: hasMetrics = metrics.length > 0;
  $: hasProperties = properties.length > 0;
</script>

<div class="card-section">
  {#if hasMetrics}
    <div class="metrics-grid columns-{columns}">
      {#each metrics as { key, value, config } (key)}
        <DataCard
          {value}
          label={config.label ?? key}
          type={config.type}
          span={config.span}
          unit={config.unit}
          {phase}
        />
      {/each}
    </div>
  {/if}

  {#if hasProperties}
    <div class="properties-list">
      {#each properties as { key, value, config } (key)}
        <PropertyRow
          label={config.label ?? key}
          value={String(value ?? '-')}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .card-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-flow: dense;
    gap: var(--space-md, 12px);
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
    gap: var(--space-sm, 8px);
  }
</style>
