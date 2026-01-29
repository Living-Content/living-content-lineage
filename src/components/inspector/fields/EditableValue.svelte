<script lang="ts">
  /**
   * Editable value component for replay modifications.
   * Uses contenteditable for in-place editing like hub's EntryBody pattern.
   */
  import { replayState } from '../../../stores/replayState.svelte.js';
  import type { EditType } from '../../../config/display.js';
  import HighlightedCode from '../renderers/HighlightedCode.svelte';

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
  let contentEl: HTMLPreElement | undefined = $state();
  let originalContent = $state('');

  let isModified = $derived(replayState.isFieldModified(nodeId, fieldPath));
  let displayValue = $derived(() => isModified ? replayState.getModifiedValue(nodeId, fieldPath) : currentValue);

  let isJsonType = $derived(editType === 'json' || typeof currentValue === 'object');
  let formattedContent = $derived(() => {
    const val = displayValue();
    if (isJsonType) {
      return JSON.stringify(val, null, 2);
    }
    return String(val ?? '');
  });

  $effect(() => {
    if (isEditing && contentEl) {
      originalContent = formattedContent();
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
    } else if (isJsonType) {
      try {
        newValue = JSON.parse(text);
      } catch {
        return;
      }
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
    } else if (e.key === 'Escape') {
      cancelEditing();
    } else if (e.key === 'Enter' && editType !== 'textarea' && editType !== 'json') {
      e.preventDefault();
      saveEdit();
    }
  }
</script>

<div class="editable-wrapper">
  {#if showLabel && label}
    <div class="display-label">{label}</div>
  {/if}

  <div class="value-row">
    <div class="value-container">
      {#if isJsonType && !isEditing}
        <HighlightedCode code={formattedContent()} language="json" />
      {:else}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <pre
          class="editable-content"
          class:editing={isEditing}
          bind:this={contentEl}
          contenteditable={isEditing}
          onkeydown={isEditing ? handleKeydown : undefined}
          tabindex={isEditing ? 0 : -1}
        >{formattedContent()}</pre>
      {/if}
    </div>

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
  </div>
</div>

<style>
  .editable-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 100%;
  }

  .display-label {
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .value-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .value-container {
    flex: 1;
    min-width: 0;
  }

  .editable-content {
    margin: 0;
    padding: 0;
    font-family: var(--font-mono);
    font-size: var(--font-size-small);
    white-space: pre-wrap;
    word-break: break-word;
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    min-height: 1.4em;
    max-height: 300px;
    overflow: auto;
    color: var(--color-text-secondary);
  }

  .editable-content:focus {
    outline: none;
  }

  .editable-content.editing {
    cursor: text;
    border-bottom-color: var(--color-border);
  }

  .edit-actions {
    display: flex;
    gap: var(--space-md);
    align-items: center;
    flex-shrink: 0;
  }

  .action-btn {
    padding: 0;
    font-size: var(--font-size-tiny);
    font-weight: 500;
    font-family: inherit;
    border: none;
    background: transparent;
    color: var(--color-text-light);
    cursor: pointer;
    transition: color 0.15s ease;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .action-btn:hover {
    color: var(--color-text-primary);
  }

  .action-btn.primary {
    color: var(--color-text-muted);
  }

  .modified-indicator {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: var(--color-warning, #f59e0b);
    border-radius: 50%;
  }
</style>
