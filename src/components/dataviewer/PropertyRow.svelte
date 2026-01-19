<script lang="ts">
  // Simple key-value row used in info panel metadata blocks.
  export let label: string;
  export let value: string;
</script>

<div class="property-row">
  <span class="property-label">{label}</span>
  <span class="property-value">{value}</span>
</div>

<style>
  .property-row {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    column-gap: 12px;
    align-items: start;
    font-size: 12px;
  }

  .property-label {
    color: var(--color-text-light);
    font-weight: 400;
  }

  .property-value {
    color: var(--color-text-secondary);
    font-weight: 500;
    font-family: var(--font-mono);
    font-size: 11px;
    word-break: break-word;
  }
</style>
