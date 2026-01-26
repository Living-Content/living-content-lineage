<script lang="ts">
  /**
   * Flexible grid container for MetricCards.
   * Default is 4 columns; cards use `span` prop to control width.
   */
  export let columns: 1 | 2 | 3 | 4 = 4;
</script>

<div class="card-grid columns-{columns}">
  <slot />
</div>

<style>
  .card-grid {
    display: grid;
    gap: var(--space-md);
  }

  .columns-1 {
    grid-template-columns: 1fr;
  }

  .columns-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .columns-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .columns-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 500px) {
    .columns-3,
    .columns-4 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
