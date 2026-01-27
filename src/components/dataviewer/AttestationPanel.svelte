<script lang="ts">
  /**
   * Expandable attestation panel for the panel footer.
   * Shows type/provider badges and timestamp, expands to show full details.
   */
  import type { Attestation } from '../../config/types.js';
  import { formatTimestamp } from '../../services/dataviewer/parsing/dateFormat.js';
  import Expandable from './Expandable.svelte';

  let {
    attestation,
    expanded = $bindable(false)
  }: {
    attestation: Attestation | undefined;
    expanded?: boolean;
  } = $props();

  let timeDisplay = $derived(attestation?.time ? formatTimestamp(attestation.time) : '');
  let attestationType = $derived(attestation?.type ?? 'certificate');
  let provider = $derived(attestation?.provider);

  const typeLabels: Record<string, string> = {
    merkle: 'Merkle',
    certificate: 'Certificate',
    tee: 'TEE'
  };
</script>

{#if attestation}
  <div class="attestation-panel">
    <Expandable bind:expanded>
      {#snippet header()}
        <span class="attestation-header">
          <span class="attestation-label">signed</span>
          {#if provider}
          <span class="attestation-badge">{provider}</span>
        {/if}
          <span class="attestation-time">{timeDisplay}</span>
        </span>
      {/snippet}

      <div class="attestation-details">
        <div class="attestation-row">
          <span class="detail-label">Provider</span>
          <span class="detail-value">{provider ?? 'Unknown'}</span>
        </div>
        <div class="attestation-row">
          <span class="detail-label">Type</span>
          <span class="detail-value">{typeLabels[attestationType] ?? attestationType}</span>
        </div>
        <div class="attestation-row">
          <span class="detail-label">Algorithm</span>
          <span class="detail-value">{attestation.alg}</span>
        </div>
        <div class="attestation-row">
          <span class="detail-label">Issuer</span>
          <span class="detail-value">{attestation.issuer}</span>
        </div>
      </div>
    </Expandable>
  </div>
{/if}

<style>
  .attestation-header {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    font-size: var(--font-size-small);
  }

  .attestation-label {
    color: var(--color-text-light);
  }

  .attestation-badge {
    padding: 2px 6px;
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-medium, 500);
    background: var(--color-surface-subtle, rgba(0, 0, 0, 0.05));
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
  }

  .attestation-time {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .attestation-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .attestation-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-md);
    font-size: var(--font-size-small);
  }

  .detail-label {
    color: var(--color-text-light);
    min-width: 60px;
  }

  .detail-value {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
    word-break: break-all;
  }
</style>
