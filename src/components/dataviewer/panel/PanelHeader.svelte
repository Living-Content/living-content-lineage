<script lang="ts">
  import type { Phase, AssetType, Step } from '../../../config/types.ts';
  import ContextBadges from '../detail/ContextBadges.svelte';

  interface PanelHeaderContext {
    phase?: Phase;
    step?: Step | string;
    assetType?: AssetType;
    selectionType: 'node' | 'step' | null;
  }

  let {
    context = null,
    showCloseButton = false,
    isDragging = false,
    onClose = () => {},
    onStartDrag = () => {}
  }: {
    context?: PanelHeaderContext | null;
    showCloseButton?: boolean;
    isDragging?: boolean;
    onClose?: () => void;
    onStartDrag?: (e: MouseEvent) => void;
  } = $props();

  // Derive values from context
  let phase = $derived(context?.phase);
  let step = $derived(context?.step);
  let assetType = $derived(context?.assetType);
  let hasSelection = $derived(context?.selectionType !== null);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="panel-header" class:dragging={isDragging} onmousedown={onStartDrag}>
  <div class="panel-header-content">
    {#if hasSelection}
      <ContextBadges {phase} {step} {assetType} />
    {:else}
      <span class="panel-title">CONTEXT</span>
    {/if}
  </div>
  {#if showCloseButton}
    <button
      class="panel-close-btn"
      title="Close"
      onclick={(e) => { e.stopPropagation(); onClose(); }}
      onmousedown={(e) => e.stopPropagation()}
    >
      &times;
    </button>
  {/if}
</div>

<style>
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 16px 12px 16px;
    flex-shrink: 0;
    cursor: grab;
    user-select: none;
    gap: 12px;
  }

  .panel-header.dragging {
    cursor: grabbing;
  }

  .panel-header-content {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .panel-title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
  }

  .panel-close-btn {
    background: none;
    border: none;
    color: var(--color-text-light);
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: var(--radius-full);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease, opacity 0.15s ease;
    opacity: 0.5;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .panel-close-btn:hover,
  .panel-close-btn:focus,
  .panel-close-btn:active {
    background: none;
    color: var(--color-text-primary);
    opacity: 1;
    outline: none;
    box-shadow: none;
  }
</style>
