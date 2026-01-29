<script lang="ts">
  /**
   * Displays hierarchical context breadcrumbs: Type > Step > Phase.
   * Clean text style matching node visual language.
   */
  import type { Phase, AssetType, Step } from '../../../config/types.js';
  import { getAssetTypeLabel } from '../../../config/types.js';

  let {
    phase = undefined,
    step = undefined,
    assetType = undefined,
    workflowId = undefined
  }: {
    phase?: Phase;
    step?: Step | string;
    assetType?: AssetType;
    workflowId?: string;
  } = $props();

  let phaseClass = $derived(phase ? `phase-${phase.toLowerCase()}` : '');
  let typeLabel = $derived(assetType ? getAssetTypeLabel(assetType) : undefined);

  // Build hierarchy array for rendering with separators (most specific first)
  let items = $derived(
    [
      typeLabel ? { label: typeLabel, type: 'type' } : null,
      step ? { label: step, type: 'step' } : null,
      workflowId ? { label: workflowId, type: 'workflow' } : null,
      phase ? { label: phase, type: 'phase' } : null,
    ].filter(Boolean) as Array<{ label: string; type: string }>
  );
</script>

<div class="context-breadcrumbs {phaseClass}">
  {#each items as item, i (item.type)}
    {#if i > 0}
      <span class="separator">></span>
    {/if}
    <span class="breadcrumb breadcrumb-{item.type}">{item.label}</span>
  {/each}
</div>

<style>
  .context-breadcrumbs {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--space-xs);
    white-space: nowrap;
  }

  .separator {
    font-size: var(--font-size-small);
    color: var(--color-text-faint);
    margin: 0 2px;
  }

  .breadcrumb {
    font-size: var(--font-size-tiny);
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
