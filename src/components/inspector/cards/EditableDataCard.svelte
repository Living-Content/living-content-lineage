<script lang="ts">
  /**
   * Data card with editing capability for replay modifications.
   * Uses in-place editing pattern matching hub's EntryBody.
   */
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
  let contentEl: HTMLSpanElement | undefined = $state();
  let originalContent = $state('');

  let isModified = $derived(isEditable && nodeId ? replayState.isFieldModified(nodeId, fieldPath) : false);
  let displayValue = $derived(() => isModified ? replayState.getModifiedValue(nodeId, fieldPath) : value);

  let phaseClass = $derived(phase ? `phase-${phase.toLowerCase()}` : '');
  let spanClass = $derived(`span-${span}`);
  let sizeClass = $derived(size === 'compact' ? 'size-compact' : '');
  let formatter = $derived(getFormatter(type));
  let formattedValue = $derived(formatter(displayValue()));
  let fontSize = $derived(calculateFontSize(String(formattedValue).length));

  function calculateFontSize(length: number): string {
    if (length <= 4) return 'var(--font-size-large)';
    if (length <= 6) return 'var(--font-size-title)';
    if (length <= 10) return 'var(--font-size-lg)';
    if (length <= 15) return 'var(--font-size-md)';
    return 'var(--font-size-body)';
  }

  $effect(() => {
    if (isEditing && contentEl) {
      originalContent = String(displayValue() ?? '');
      contentEl.textContent = originalContent;
      contentEl.focus();
    }
  });

  function startEditing(): void {
    isEditing = true;
  }

  function cancelEditing(): void {
    if (contentEl) {
      contentEl.textContent = originalContent;
    }
    isEditing = false;
  }

  function saveEdit(): void {
    const text = contentEl?.textContent ?? '';
    let newValue: unknown;

    if (editType === 'number') {
      const parsed = parseFloat(text);
      if (isNaN(parsed)) {
        return;
      }
      newValue = parsed;
    } else {
      newValue = text;
    }

    replayState.addModification({
      step,
      nodeId,
      fieldPath,
      originalValue: displayValue(),
      newValue,
    });

    isEditing = false;
  }

  function revertEdit(): void {
    replayState.removeModification(nodeId, fieldPath);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Enter') {
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
>
  <div class="card-label">{label}</div>
  <div class="card-value">
    {#if isEditing}
      <span
        class="value editable-value"
        style="font-size: {fontSize}"
        bind:this={contentEl}
        contenteditable={true}
        onkeydown={handleKeydown}
        tabindex={0}
        role="textbox"
      >{formattedValue}</span>
    {:else}
      <span class="value" style="font-size: {fontSize}">{formattedValue}</span>
    {/if}
    {#if unit}
      <span class="unit">{unit}</span>
    {/if}
  </div>
  {#if isEditable}
    <div class="edit-actions">
      {#if isEditing}
        <button class="action-btn" onclick={cancelEditing}>CANCEL</button>
        <button class="action-btn primary" onclick={saveEdit}>SAVE</button>
      {:else}
        <button class="action-btn primary" onclick={startEditing}>EDIT</button>
        {#if isModified}
          <span class="modified-indicator"></span>
          <button class="action-btn" onclick={revertEdit}>REVERT</button>
        {/if}
      {/if}
    </div>
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
    font-size: var(--font-size-tiny);
  }

  .span-1 .value {
    font-size: var(--font-size-lg);
  }

  .size-compact {
    padding: var(--space-sm) var(--space-md);
    min-height: auto;
    gap: var(--space-xs);
  }

  .size-compact .card-label {
    font-size: var(--font-size-tiny);
    min-height: auto;
  }

  .size-compact .value {
    font-size: var(--font-size-heading);
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

  .editable-value {
    padding: var(--space-xs);
    background: var(--color-surface-hover);
    border: 1px solid var(--color-border);
    min-width: 60px;
  }

  .editable-value:focus {
    outline: none;
    background: var(--color-surface);
  }

  .unit {
    font-size: var(--font-size-body);
    color: var(--metric-unit-color, var(--color-text-muted));
    font-weight: var(--font-weight-normal, 400);
  }

  .card-label {
    font-size: var(--font-size-small);
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

  /* Edit actions */
  .edit-actions {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
    margin-top: var(--space-xs);
  }

  .action-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-tiny);
    font-weight: 600;
    font-family: inherit;
    border: none;
    border-radius: 0;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: opacity 0.15s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .action-btn:hover {
    color: var(--color-text-primary);
  }

  .action-btn.primary {
    color: var(--color-text-primary);
  }

  .modified-indicator {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: var(--color-warning, #f59e0b);
    border-radius: 50%;
  }
</style>
