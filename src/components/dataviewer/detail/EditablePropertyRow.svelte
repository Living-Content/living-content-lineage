<script lang="ts">
  /**
   * Property row with editing capability for replay modifications.
   * For non-editable fields, renders as standard PropertyRow.
   * For editable fields, uses EditableValue with proper styling.
   */
  import PropertyRow from '../PropertyRow.svelte';
  import EditableValue from './EditableValue.svelte';
  import type { EditType } from '../../../config/displayConfig.js';

  interface Props {
    nodeId: string;
    step: string;
    fieldPath: string;
    label: string;
    value: unknown;
    isEditable?: boolean;
    editType?: EditType;
  }

  let { nodeId, step, fieldPath, label, value, isEditable = false, editType = 'text' }: Props = $props();
</script>

{#if isEditable && editType}
  <div class="editable-row">
    <div class="row-label">{label}</div>
    <EditableValue
      {nodeId}
      {step}
      {fieldPath}
      currentValue={value}
      {editType}
      showLabel={false}
    />
  </div>
{:else}
  <PropertyRow {label} {value} />
{/if}

<style>
  .editable-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .row-label {
    font-size: 12px;
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-light);
  }
</style>
