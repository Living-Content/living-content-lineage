<script lang="ts">
  // Simple key-value row used in sidebar metadata blocks.
  export let label: string;
  export let value: string;
</script>

<div class="meta-row">
  <span class="meta-label">{label}</span>
  <span class="meta-value">{value}</span>
</div>

<style>
  .meta-row {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    column-gap: 12px;
    align-items: start;
    font-size: 12px;
  }

  .meta-label {
    color: var(--color-text-light);
    font-weight: 400;
  }

  .meta-value {
    color: var(--color-text-secondary);
    font-weight: 500;
    font-family: var(--font-mono);
    font-size: 11px;
    word-break: break-word;
  }
</style>
