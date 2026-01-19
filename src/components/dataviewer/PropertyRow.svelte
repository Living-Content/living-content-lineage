<script lang="ts">
  /**
   * Vertical key-value display.
   * LABEL on top, value below.
   */
  export let label: string;
  export let value: string;

  // Convert camelCase to spaced words: "inputTokens" → "Input Tokens"
  function formatLabel(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/^./, (c) => c.toUpperCase());
  }

  $: displayLabel = formatLabel(label);
</script>

<div class="property-row">
  <div class="property-label">{displayLabel}</div>
  <div class="property-value">{value}</div>
</div>

<style>
  .property-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .property-label {
    font-size: 12px;
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-light);
  }

  .property-value {
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    word-break: break-word;
  }
</style>
