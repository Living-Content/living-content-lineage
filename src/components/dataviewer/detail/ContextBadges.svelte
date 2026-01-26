<script lang="ts">
  /**
   * Displays hierarchical context breadcrumbs: Type › Step › Phase.
   * Clean text style matching node visual language.
   */
  import type { Phase, AssetType, Step } from '../../../config/types.ts';
  import { formatAssetTypeLabel } from '../../../config/labels.js';

  export let phase: Phase | undefined = undefined;
  export let step: Step | string | undefined = undefined;
  export let assetType: AssetType | undefined = undefined;
  export let workflowId: string | undefined = undefined;

  $: phaseClass = phase ? `phase-${phase.toLowerCase()}` : '';
  $: typeLabel = assetType ? formatAssetTypeLabel(assetType) : undefined;

  // Build hierarchy array for rendering with separators (most specific first)
  $: items = [
    typeLabel ? { label: typeLabel, type: 'type' } : null,
    step ? { label: step, type: 'step' } : null,
    workflowId ? { label: workflowId, type: 'workflow' } : null,
    phase ? { label: phase, type: 'phase' } : null,
  ].filter(Boolean) as Array<{ label: string; type: string }>;
</script>

<div class="context-breadcrumbs {phaseClass}">
  {#each items as item, i (item.type)}
    {#if i > 0}
      <span class="separator">›</span>
    {/if}
    <span class="breadcrumb breadcrumb-{item.type}">{item.label}</span>
  {/each}
</div>

<style>
  .context-breadcrumbs {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--space-xs, 4px);
    white-space: nowrap;
  }

  .separator {
    font-size: var(--font-size-small, 12px);
    color: var(--color-text-faint);
    margin: 0 2px;
  }

  .breadcrumb {
    font-size: var(--font-size-tiny, 10px);
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide, 0.03em);
    color: var(--color-text-secondary);
  }

  /* Type label uses monospace font */
  .breadcrumb-type {
    font-family: var(--font-mono);
    color: var(--color-text-primary);
  }

  /* Phase-colored separators for visual continuity */
  .phase-acquisition .separator { color: var(--phase-acquisition); }
  .phase-preparation .separator { color: var(--phase-preparation); }
  .phase-retrieval .separator { color: var(--phase-retrieval); }
  .phase-reasoning .separator { color: var(--phase-reasoning); }
  .phase-generation .separator { color: var(--phase-generation); }
  .phase-persistence .separator { color: var(--phase-persistence); }
</style>
