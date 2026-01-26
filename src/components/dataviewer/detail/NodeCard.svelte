<script lang="ts">
  /**
   * Displays a node in card form matching the graph node visual style.
   * Pill-shaped container with phase-colored accent, icon, and labels.
   */
  import type { AssetType, Phase } from '../../../config/types.js';
  import { getAssetIconPath } from '../../../config/icons.js';
  import { formatAssetTypeLabel } from '../../../config/labels.js';

  export let title: string;
  export let assetType: AssetType | undefined = undefined;
  export let phase: Phase | undefined = undefined;

  $: iconPath = assetType ? getAssetIconPath(assetType) : null;
  $: typeLabel = assetType ? formatAssetTypeLabel(assetType) : '';
  $: phaseClass = phase ? `phase-${phase.toLowerCase()}` : '';
</script>

<div class="node-card {phaseClass}">
  {#if iconPath}
    <div class="icon-circle">
      <img src={iconPath} alt="" class="icon" />
    </div>
  {/if}
  <div class="labels">
    {#if typeLabel}
      <span class="type-label">{typeLabel}</span>
    {/if}
    <span class="title-label">{title}</span>
  </div>
</div>

<style>
  .node-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--metric-card-bg, rgba(0, 0, 0, 0.03));
    border: 1px solid var(--metric-card-border, rgba(0, 0, 0, 0.06));
    border-radius: var(--radius-full);
    min-height: 40px;
  }

  .icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-surface-elevated, rgba(255, 255, 255, 0.8));
    flex-shrink: 0;
  }

  .icon {
    width: 14px;
    height: 14px;
    opacity: 0.7;
  }

  .labels {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .type-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    line-height: 1;
  }

  .title-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Phase accent colors - left border */
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
