<script lang="ts">
  /**
   * Displays hierarchical context badges: Phase > Step > Asset Type.
   * Each badge is color-coded based on the phase.
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

<div class="context-badges {phaseClass}">
  {#each items as item, i (item.type)}
    {#if i > 0}
      <span class="separator">‹</span>
    {/if}
    <span class="badge badge-{item.type}">{item.label}</span>
  {/each}
</div>

<style>
  .context-badges {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--space-xs, 4px);
    white-space: nowrap;
  }

  .separator {
    font-size: var(--font-size-small, 12px);
    color: var(--color-text-light, #999);
    margin: 0 2px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: var(--font-size-tiny, 10px);
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide, 0.03em);
    border-radius: var(--radius-full, 9999px);
    background: var(--color-surface-subtle, rgba(0, 0, 0, 0.05));
    color: var(--color-text-secondary);
  }

  /* Hierarchy opacity: Phase (0.5) > Step (0.7) > Type (1.0) - most specific is most prominent */
  .badge-phase {
    opacity: 0.5;
  }

  .badge-step {
    opacity: 0.7;
  }

  .badge-type {
    opacity: 1;
  }

  /* Phase-based background colors */
  .phase-acquisition .badge {
    background: var(--phase-acquisition, rgb(239, 45, 45));
    color: white;
  }
  .phase-acquisition .separator {
    color: var(--phase-acquisition, rgb(239, 45, 45));
  }

  .phase-preparation .badge {
    background: var(--phase-preparation, rgb(255, 89, 94));
    color: white;
  }
  .phase-preparation .separator {
    color: var(--phase-preparation, rgb(255, 89, 94));
  }

  .phase-retrieval .badge {
    background: var(--phase-retrieval, rgb(255, 202, 58));
    color: var(--color-text-primary, #1a1a1a);
  }
  .phase-retrieval .separator {
    color: var(--phase-retrieval, rgb(255, 202, 58));
  }

  .phase-reasoning .badge {
    background: var(--phase-reasoning, rgb(138, 201, 38));
    color: var(--color-text-primary, #1a1a1a);
  }
  .phase-reasoning .separator {
    color: var(--phase-reasoning, rgb(138, 201, 38));
  }

  .phase-generation .badge {
    background: var(--phase-generation, rgb(25, 130, 196));
    color: white;
  }
  .phase-generation .separator {
    color: var(--phase-generation, rgb(25, 130, 196));
  }

  .phase-persistence .badge {
    background: var(--phase-persistence, rgb(0, 84, 175));
    color: white;
  }
  .phase-persistence .separator {
    color: var(--phase-persistence, rgb(0, 84, 175));
  }
</style>
