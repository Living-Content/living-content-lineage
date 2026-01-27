<script lang="ts">
  /**
   * Editable value component for replay modifications.
   * Displays value with edit icon; clicking opens inline editing.
   * Uses HighlightedCode for JSON display to match existing patterns.
   */
  import { fade } from 'svelte/transition';
  import { replayState } from '../../../stores/replayState.svelte.js';
  import type { EditType } from '../../../config/displayConfig.js';
  import HighlightedCode from './HighlightedCode.svelte';

  interface Props {
    nodeId: string;
    step: string;
    fieldPath: string;
    currentValue: unknown;
    editType: EditType;
    showLabel?: boolean;
    label?: string;
  }

  let { nodeId, step, fieldPath, currentValue, editType, showLabel = false, label = '' }: Props = $props();

  let isEditing = $state(false);
  let editValue = $state('');

  let isModified = $derived(replayState.isFieldModified(nodeId, fieldPath));
  let displayValue = $derived(() => {
    if (isModified) {
      return replayState.getModifiedValue(nodeId, fieldPath);
    }
    return currentValue;
  });

  let isJsonType = $derived(editType === 'json' || typeof currentValue === 'object');
  let formattedJson = $derived(isJsonType ? JSON.stringify(displayValue(), null, 2) : '');

  function startEditing(): void {
    const value = displayValue();
    if (editType === 'json' || typeof value === 'object') {
      editValue = JSON.stringify(value, null, 2);
    } else {
      editValue = String(value ?? '');
    }
    isEditing = true;
  }

  function cancelEditing(): void {
    isEditing = false;
  }

  function saveEdit(): void {
    let newValue: unknown;

    if (editType === 'number') {
      newValue = parseFloat(editValue);
      if (isNaN(newValue)) {
        return;
      }
    } else if (editType === 'json' || typeof currentValue === 'object') {
      try {
        newValue = JSON.parse(editValue);
      } catch {
        return;
      }
    } else {
      newValue = editValue;
    }

    replayState.addModification({
      step,
      nodeId,
      fieldPath,
      originalValue: currentValue,
      newValue,
    });

    isEditing = false;
  }

  function revertEdit(): void {
    replayState.removeModification(nodeId, fieldPath);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && editType !== 'textarea' && editType !== 'json') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }

  function formatSimpleValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    return String(value);
  }
</script>

<div class="editable-wrapper" class:modified={isModified}>
  {#if isEditing}
    <div class="edit-container" transition:fade={{ duration: 100 }}>
      {#if showLabel && label}
        <div class="edit-label">{label}</div>
      {/if}
      {#if editType === 'textarea' || editType === 'json'}
        <textarea
          class="edit-input"
          bind:value={editValue}
          onkeydown={handleKeydown}
          rows={editType === 'json' ? 10 : 4}
        ></textarea>
      {:else}
        <input
          type={editType === 'number' ? 'number' : 'text'}
          class="edit-input"
          bind:value={editValue}
          onkeydown={handleKeydown}
          step={editType === 'number' ? '0.1' : undefined}
        />
      {/if}
      <div class="edit-actions">
        <button class="button button--primary" onclick={saveEdit}>Save</button>
        <button class="button button--secondary" onclick={cancelEditing}>Cancel</button>
      </div>
    </div>
  {:else}
    <div class="display-container">
      {#if showLabel && label}
        <div class="display-label">{label}</div>
      {/if}
      <div class="value-wrapper">
        {#if isJsonType}
          <HighlightedCode code={formattedJson} language="json" />
        {:else}
          <span class="simple-value" class:truncate={editType === 'textarea'}>
            {formatSimpleValue(displayValue())}
          </span>
        {/if}
        <div class="edit-buttons">
          <button
            class="icon-btn"
            onclick={startEditing}
            title="Edit for replay"
            aria-label="Edit value"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {#if isModified}
            <button
              class="icon-btn revert"
              onclick={revertEdit}
              title="Revert to original"
              aria-label="Revert value"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .editable-wrapper {
    position: relative;
    width: 100%;
  }

  .editable-wrapper.modified {
    outline: 2px solid var(--color-warning, #f59e0b);
    outline-offset: 4px;
    border-radius: var(--radius-sm);
  }

  .display-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .display-label {
    font-size: 10px;
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    padding-left: var(--space-md);
  }

  .value-wrapper {
    position: relative;
  }

  .simple-value {
    display: block;
    font-family: var(--font-mono);
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    word-break: break-word;
  }

  .simple-value.truncate {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .edit-buttons {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
    display: flex;
    gap: var(--space-xs);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .editable-wrapper:hover .edit-buttons {
    opacity: 1;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
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

  .edit-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .edit-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .edit-input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--font-size-small);
    background: var(--color-background);
    color: var(--color-text-primary);
    resize: vertical;
  }

  .edit-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .edit-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
  }

  /* Button size overrides for compact edit context */
  .edit-actions .button {
    padding: var(--space-xs) var(--space-lg);
    font-size: var(--font-size-small);
  }
</style>
