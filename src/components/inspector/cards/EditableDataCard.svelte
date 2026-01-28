<script lang="ts">
  /**
   * Data card with editing capability for replay modifications.
   * Wraps DataCard with edit controls when field is editable.
   */
  import { fade } from 'svelte/transition';
  import type { Phase } from '../../../config/types.js';
  import type { DataCardType } from '../../../config/cardTypes.js';
  import type { EditType } from '../../../config/display.js';
  import { getFormatter } from '../../../config/cardTypes.js';
  import { replayState } from '../../../stores/replayState.svelte.js';

  let {
    value,
    label,
    type = 'text',
    phase = undefined,
    span = 1,
    unit = '',
    size = 'default',
    nodeId = '',
    step = '',
    fieldPath = '',
    isEditable = false,
    editType = 'text'
  }: {
    value: unknown;
    label: string;
    type?: DataCardType;
    phase?: Phase;
    span?: 1 | 2 | 3 | 4;
    unit?: string;
    size?: 'default' | 'compact';
    nodeId?: string;
    /** Step for backend targeting (required for replay modifications) */
    step?: string;
    fieldPath?: string;
    isEditable?: boolean;
    editType?: EditType;
  } = $props();

  let isEditing = $state(false);
  let editValue = $state('');

  let isModified = $derived(isEditable && nodeId ? replayState.isFieldModified(nodeId, fieldPath) : false);
  let displayValue = $derived(() => {
    if (isModified) {
      return replayState.getModifiedValue(nodeId, fieldPath);
    }
    return value;
  });

  let phaseClass = $derived(phase ? `phase-${phase.toLowerCase()}` : '');
  let spanClass = $derived(`span-${span}`);
  let sizeClass = $derived(size === 'compact' ? 'size-compact' : '');
  let formatter = $derived(getFormatter(type));
  let formattedValue = $derived(formatter(displayValue()));

  let fontSize = $derived(calculateFontSize(String(formattedValue).length));

  function calculateFontSize(length: number): string {
    if (length <= 4) return '28px';
    if (length <= 6) return '24px';
    if (length <= 10) return '20px';
    if (length <= 15) return '16px';
    return '14px';
  }

  function startEditing(): void {
    const val = displayValue();
    editValue = String(val ?? '');
    isEditing = true;
  }

  function cancelEditing(): void {
    isEditing = false;
  }

  function saveEdit(): void {
    let newValue: unknown;

    if (editType === 'number') {
      const parsed = parseFloat(editValue);
      if (isNaN(parsed)) {
        return;
      }
      newValue = parsed;
    } else {
      newValue = editValue;
    }

    replayState.addModification({
      step,
      nodeId,
      fieldPath,
      originalValue: value,
      newValue,
    });

    isEditing = false;
  }

  function revertEdit(): void {
    replayState.removeModification(nodeId, fieldPath);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }
</script>

<div
  class="data-card {phaseClass} {spanClass} {sizeClass}"
  class:editable={isEditable}
  class:modified={isModified}
>
  {#if isEditing}
    <div class="edit-mode" transition:fade={{ duration: 100 }}>
      <div class="card-label">{label}</div>
      <input
        type={editType === 'number' ? 'number' : 'text'}
        class="edit-input"
        bind:value={editValue}
        onkeydown={handleKeydown}
        step={editType === 'number' ? '0.1' : undefined}
      />
      <div class="edit-actions">
        <button class="button button--primary" onclick={saveEdit}>Save</button>
        <button class="button button--secondary" onclick={cancelEditing}>Cancel</button>
      </div>
    </div>
  {:else}
    <div class="card-label">{label}</div>
    <div class="card-value">
      <span class="value" style="font-size: {fontSize}">{formattedValue}</span>
      {#if unit}
        <span class="unit">{unit}</span>
      {/if}
    </div>
    {#if isEditable}
      <div class="edit-buttons">
        <button
          class="icon-btn"
          onclick={startEditing}
          title="Edit for replay"
          aria-label="Edit {label}"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        {#if isModified}
          <button
            class="icon-btn revert"
            onclick={revertEdit}
            title="Revert to original"
            aria-label="Revert {label}"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .data-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--space-xl);
    background: var(--metric-card-bg, rgba(0, 0, 0, 0.03));
    border: 1px solid var(--metric-card-border, rgba(0, 0, 0, 0.06));
    border-radius: var(--radius-md);
    min-width: 0;
    min-height: 80px;
    gap: var(--space-sm);
  }

  .data-card.modified {
    outline: 2px solid var(--color-warning, #f59e0b);
    outline-offset: -2px;
  }

  /* Column spanning */
  .span-1 { grid-column: span 1; }
  .span-2 { grid-column: span 2; }
  .span-3 { grid-column: span 3; }
  .span-4 { grid-column: span 4; }

  .span-1 {
    padding: var(--space-md);
    min-height: 60px;
    gap: var(--space-xs);
  }

  .span-1 .card-label {
    font-size: 10px;
  }

  .span-1 .value {
    font-size: 20px !important;
  }

  .size-compact {
    padding: var(--space-sm) var(--space-md);
    min-height: auto;
    gap: var(--space-xs);
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
    font-size: var(--font-size-body);
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
  .phase-acquisition { border-left: 3px solid var(--phase-acquisition, #6366f1); }
  .phase-preparation { border-left: 3px solid var(--phase-preparation, #8b5cf6); }
  .phase-retrieval { border-left: 3px solid var(--phase-retrieval, #06b6d4); }
  .phase-reasoning { border-left: 3px solid var(--phase-reasoning, #f59e0b); }
  .phase-generation { border-left: 3px solid var(--phase-generation, #10b981); }
  .phase-persistence { border-left: 3px solid var(--phase-persistence, #ec4899); }

  /* Edit buttons */
  .edit-buttons {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .data-card:hover .edit-buttons {
    opacity: 1;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .icon-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .icon-btn.revert:hover {
    color: var(--color-warning);
    border-color: var(--color-warning);
  }

  /* Edit mode */
  .edit-mode {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
  }

  .edit-input {
    width: 100%;
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--font-size-small);
    background: var(--color-background);
    color: var(--color-text-primary);
  }

  .edit-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .edit-actions {
    display: flex;
    gap: var(--space-xs);
  }

  /* Button size overrides for compact card context */
  .edit-actions .button {
    flex: 1;
    padding: var(--space-xs);
    font-size: 11px;
  }
</style>
