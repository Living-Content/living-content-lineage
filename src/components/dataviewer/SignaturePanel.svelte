<script lang="ts">
  /**
   * Expandable signature panel for the panel footer.
   * Shows type/provider badges and timestamp, expands to show full details.
   */
  import type { ManifestSignatureInfo } from '../../config/types.js';
  import { formatTimestamp } from '../../services/dataviewer/parsing/dateFormat.js';
  import Expandable from './Expandable.svelte';

  export let signatureInfo: ManifestSignatureInfo | undefined;
  export let expanded = false;

  $: timeDisplay = signatureInfo?.time ? formatTimestamp(signatureInfo.time) : '';
  $: signatureType = signatureInfo?.type ?? 'certificate';
  $: provider = signatureInfo?.provider;

  const typeLabels: Record<string, string> = {
    merkle: 'Merkle',
    certificate: 'Certificate',
    tee: 'TEE'
  };
</script>

{#if signatureInfo}
  <div class="signature-panel">
    <Expandable bind:expanded>
      <svelte:fragment slot="header">
        <span class="signature-header">
          <span class="signature-label">signed</span>
          {#if provider}
          <span class="signature-badge">{provider}</span>
        {/if}
          <span class="signature-time">{timeDisplay}</span>
        </span>
      </svelte:fragment>

      <div class="signature-details">
        <div class="signature-row">
          <span class="detail-label">Provider</span>
          <span class="detail-value">{provider ?? 'Unknown'}</span>
        </div>
        <div class="signature-row">
          <span class="detail-label">Type</span>
          <span class="detail-value">{typeLabels[signatureType] ?? signatureType}</span>
        </div>
        <div class="signature-row">
          <span class="detail-label">Algorithm</span>
          <span class="detail-value">{signatureInfo.alg}</span>
        </div>
        <div class="signature-row">
          <span class="detail-label">Issuer</span>
          <span class="detail-value">{signatureInfo.issuer}</span>
        </div>
      </div>
    </Expandable>
  </div>
{/if}

<style>
  .signature-header {
    display: flex;
    align-items: center;
    gap: var(--space-md, 12px);
    font-size: var(--font-size-small, 12px);
  }

  .signature-label {
    color: var(--color-text-light);
  }

  .signature-badge {
    padding: 2px 6px;
    font-size: var(--font-size-tiny, 10px);
    font-weight: var(--font-weight-medium, 500);
    background: var(--color-surface-subtle, rgba(0, 0, 0, 0.05));
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text-secondary);
  }

  .signature-time {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .signature-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
  }

  .signature-row {
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
