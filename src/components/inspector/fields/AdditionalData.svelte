<script lang="ts">
  /**
   * Collapsible section for unspecified key-value data.
   * Renders fields that aren't in the display config.
   * Collapsed by default, titled "Additional Data".
   * Fields are alphabetically sorted.
   */
  import Expandable from '../shared/Expandable.svelte';
  import DetailValue from './DetailValue.svelte';
  import { formatKeyLabel } from '../../../services/inspector/format.js';

  /** Array of [key, value] pairs to display */
  let { data = [] }: {
    data?: Array<[string, unknown]>;
  } = $props();

  let expanded = $state(false);

  let sortedData = $derived([...data].sort(([a], [b]) => a.localeCompare(b)));
</script>

{#if data.length > 0}
  <div class="additional-data">
    <Expandable bind:expanded>
      {#snippet header()}
        <span class="section-title">Additional Data ({data.length})</span>
      {/snippet}
      <div class="data-list">
        {#each sortedData as [key, value] (key)}
          <div class="data-item">
            <span class="data-key">{formatKeyLabel(key)}</span>
            <div class="data-value">
              <DetailValue {value} />
            </div>
          </div>
        {/each}
      </div>
    </Expandable>
  </div>
{/if}

<style>
  .additional-data {
    border-top: 1px solid var(--section-border-color, rgba(0, 0, 0, 0.06));
    padding-top: var(--space-md);
    margin-top: var(--space-md);
  }

  .section-title {
    font-size: 14px;
    font-weight: var(--font-weight-semibold, 600);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider, 0.05em);
    color: var(--section-header-color, var(--color-text-secondary));
  }

  .data-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin-top: var(--space-sm);
  }

  .data-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .data-key {
    font-size: 13px;
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-text-light);
  }

  .data-value {
    font-size: 14px;
    color: var(--color-text-secondary);
    word-break: break-word;
  }
</style>
