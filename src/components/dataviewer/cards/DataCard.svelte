<script lang="ts">
  /**
   * Universal data card renderer for metric display.
   * Renders numeric values with labels in card format.
   * Supports phase-based color accents, grid column spanning, and auto-scaling text.
   */
  import type { Phase } from '../../../config/types.js';
  import type { DataCardType } from '../../../config/cardTypes.js';
  import { getFormatter } from '../../../config/cardTypes.js';

  export let value: unknown;
  export let label: string;
  export let type: DataCardType = 'text';
  export let phase: Phase | undefined = undefined;
  export let span: 1 | 2 | 3 | 4 = 1;
  export let unit: string = '';
  /** Size variant: compact removes min-heights for dense layouts */
  export let size: 'default' | 'compact' = 'default';

  $: phaseClass = phase ? `phase-${phase.toLowerCase()}` : '';
  $: spanClass = `span-${span}`;
  $: sizeClass = size === 'compact' ? 'size-compact' : '';
  $: formatter = getFormatter(type);
  $: displayValue = formatter(value);

  // Scale font size based on content length
  $: fontSize = calculateFontSize(String(displayValue).length);

  function calculateFontSize(length: number): string {
    if (length <= 4) return '28px';
    if (length <= 6) return '24px';
    if (length <= 10) return '20px';
    if (length <= 15) return '16px';
    return '14px';
  }
</script>

<div class="data-card {phaseClass} {spanClass} {sizeClass}">
  <div class="card-label">{label}</div>
  <div class="card-value">
    <span class="value" style="font-size: {fontSize}">{displayValue}</span>
    {#if unit}
      <span class="unit">{unit}</span>
    {/if}
  </div>
</div>

<style>
  .data-card {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--space-xl, 20px);
    background: var(--metric-card-bg, rgba(0, 0, 0, 0.03));
    border: 1px solid var(--metric-card-border, rgba(0, 0, 0, 0.06));
    border-radius: var(--radius-md, 8px);
    min-width: 0;
    min-height: 80px;
    gap: var(--space-sm, 8px);
  }

  /* Column spanning */
  .span-1 { grid-column: span 1; }
  .span-2 { grid-column: span 2; }
  .span-3 { grid-column: span 3; }
  .span-4 { grid-column: span 4; }

  /* Compact styling for 1-span cards */
  .span-1 {
    padding: var(--space-md, 12px);
    min-height: 60px;
    gap: var(--space-xs, 4px);
  }

  .span-1 .card-label {
    font-size: 10px;
  }

  .span-1 .value {
    font-size: 20px !important;
  }

  /* Compact size variant - no min-heights */
  .size-compact {
    padding: var(--space-sm, 8px) var(--space-md, 12px);
    min-height: auto;
    gap: var(--space-xs, 4px);
  }

  .size-compact .card-label {
    font-size: 10px;
    min-height: auto;
  }

  .size-compact .value {
    font-size: 18px !important;
  }

  .card-value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--metric-value-color, var(--color-text-primary));
  }

  .value {
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: var(--letter-spacing-tight, -0.02em);
    line-height: 1.2;
  }

  .unit {
    font-size: var(--font-size-body, 14px);
    color: var(--metric-unit-color, var(--color-text-muted));
    font-weight: var(--font-weight-normal, 400);
  }

  .card-label {
    font-size: 12px;
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider, 0.05em);
    color: var(--metric-label-color, var(--color-text-light));
    min-height: 2.4em;
    line-height: 1.2;
    display: flex;
    align-items: flex-end;
  }

  /* Phase-based accent colors */
  .phase-acquisition {
    border-left: 3px solid var(--phase-acquisition, #6366f1);
  }
  .phase-preparation {
    border-left: 3px solid var(--phase-preparation, #8b5cf6);
  }
  .phase-retrieval {
    border-left: 3px solid var(--phase-retrieval, #06b6d4);
  }
  .phase-reasoning {
    border-left: 3px solid var(--phase-reasoning, #f59e0b);
  }
  .phase-generation {
    border-left: 3px solid var(--phase-generation, #10b981);
  }
  .phase-persistence {
    border-left: 3px solid var(--phase-persistence, #ec4899);
  }
</style>
