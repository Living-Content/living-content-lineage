<script lang="ts">
  /**
   * Flexible metric display card.
   * Shows a value with label, optional description, unit, and phase-based color accent.
   * Supports column spanning and size variants for grid layouts.
   */
  import type { Phase } from '../../../config/types.js';

  let {
    value,
    label,
    description = '',
    unit = '',
    phase = undefined,
    span = 1,
    size = 'default'
  }: {
    value: string | number;
    label: string;
    description?: string;
    unit?: string;
    phase?: Phase | undefined;
    /** Number of grid columns to span (1-4) */
    span?: 1 | 2 | 3 | 4;
    /** Size variant: compact for dense layouts, default for standard */
    size?: 'compact' | 'default';
  } = $props();

  let phaseClass = $derived(phase ? `phase-${phase.toLowerCase()}` : '');
  let spanClass = $derived(`span-${span}`);
  let sizeClass = $derived(size === 'compact' ? 'size-compact' : '');
</script>

<div class="metric-card {phaseClass} {spanClass} {sizeClass}">
  <div class="metric-label">{label}</div>
  <div class="metric-value">
    <span class="value">{value}</span>
    {#if unit}
      <span class="unit">{unit}</span>
    {/if}
  </div>
  {#if description}
    <div class="metric-description">{description}</div>
  {/if}
</div>

<style>
  .metric-card {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--space-xl);
    background: var(--metric-card-bg, rgba(0, 0, 0, 0.03));
    border: 1px solid var(--metric-card-border, rgba(0, 0, 0, 0.06));
    border-radius: var(--radius-md);
    min-width: 0;
    min-height: 80px;
  }

  /* Column spanning */
  .span-1 { grid-column: span 1; }
  .span-2 { grid-column: span 2; }
  .span-3 { grid-column: span 3; }
  .span-4 { grid-column: span 4; }

  /* Compact size variant */
  .size-compact {
    padding: var(--space-md);
    min-height: 56px;
  }

  .size-compact .value {
    font-size: var(--font-size-body);
  }

  .metric-value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--metric-value-color, var(--color-text-primary));
  }

  .value {
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: var(--letter-spacing-tight, -0.02em);
    line-height: var(--line-height-snug, 1.2);
    word-break: break-word;
  }

  .unit {
    font-size: var(--font-size-small);
    color: var(--metric-unit-color, var(--color-text-muted));
    font-weight: var(--font-weight-normal, 400);
  }

  .metric-description {
    margin-top: var(--space-xs);
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .metric-label {
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider, 0.05em);
    color: var(--metric-label-color, var(--color-text-light));
  }
</style>
