<script lang="ts">
  /**
   * Expandable attestation panel for the panel footer.
   * Shows type/provider badges and timestamp, expands to show full details.
   */
  import type { Attestation } from '../../config/types.js';
  import { formatTimestamp } from '../../services/dataviewer/parsing/dateFormat.js';
  import Expandable from './Expandable.svelte';

  export let attestation: Attestation | undefined;
  export let expanded = false;

  $: timeDisplay = attestation?.time ? formatTimestamp(attestation.time) : '';
  $: attestationType = attestation?.type ?? 'certificate';
  $: provider = attestation?.provider;

  const typeLabels: Record<string, string> = {
    merkle: 'Merkle',
    certificate: 'Certificate',
    tee: 'TEE'
  };
</script>

{#if attestation}
  <div class="attestation-panel">
    <Expandable bind:expanded>
      <svelte:fragment slot="header">
        <span class="attestation-header">
          <span class="attestation-label">signed</span>
          {#if provider}
          <span class="attestation-badge">{provider}</span>
        {/if}
          <span class="attestation-time">{timeDisplay}</span>
        </span>
      </svelte:fragment>

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
    gap: var(--space-md, 12px);
    font-size: var(--font-size-small, 12px);
  }

  .attestation-label {
    color: var(--color-text-light);
  }

  .attestation-badge {
    padding: 2px 6px;
    font-size: var(--font-size-tiny, 10px);
    font-weight: var(--font-weight-medium, 500);
    background: var(--color-surface-subtle, rgba(0, 0, 0, 0.05));
    border-radius: var(--radius-sm, 4px);
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
    gap: var(--space-xs, 4px);
  }

  .attestation-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-md, 12px);
    font-size: var(--font-size-small, 12px);
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
