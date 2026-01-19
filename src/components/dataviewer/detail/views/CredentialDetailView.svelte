<script lang="ts">
  /**
   * Detail view for Credential assets.
   * Displays credential issuer, validity, and claims.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import PropertyRow from '../../PropertyRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: signatureInfo = assetManifest?.signatureInfo;
  $: content = assetManifest?.content as CredentialContent | undefined;

  interface CredentialContent {
    issuer?: string;
    subject?: string;
    valid_from?: string;
    valid_until?: string;
    claims?: Record<string, unknown>;
  }

  $: issuer = signatureInfo?.issuer ?? content?.issuer ?? '-';
  $: claims = content?.claims ? Object.entries(content.claims) : [];

  $: validityStatus = (() => {
    if (!content?.valid_from && !content?.valid_until) return 'Unknown';
    const now = new Date();
    if (content.valid_from) {
      const from = new Date(content.valid_from);
      if (from > now) return 'Not Yet Valid';
    }
    if (content.valid_until) {
      const until = new Date(content.valid_until);
      if (until < now) return 'Expired';
    }
    return 'Valid';
  })();
</script>

<div class="credential-detail-view">
  <PropertyGroup title="Credential Info" collapsible={false}>
    <PropertyRow label="Status" value={validityStatus} />
    <PropertyRow label="Issuer" value={issuer} />
    {#if signatureInfo}
      <PropertyRow label="Algorithm" value={signatureInfo.alg} />
      <PropertyRow label="Issued" value={signatureInfo.time} />
    {/if}
    {#if content?.subject}
      <PropertyRow label="Subject" value={content.subject} />
    {/if}
  </PropertyGroup>

  {#if content?.valid_from || content?.valid_until}
    <PropertyGroup title="Validity Period" collapsed>
      {#if content.valid_from}
        <PropertyRow label="Valid From" value={content.valid_from} />
      {/if}
      {#if content.valid_until}
        <PropertyRow label="Valid Until" value={content.valid_until} />
      {/if}
    </PropertyGroup>
  {/if}

  {#if claims.length > 0}
    <PropertyGroup title="Claims ({claims.length})" collapsed>
      {#each claims as [key, value] (key)}
        <PropertyRow label={key} value={String(value)} />
      {/each}
    </PropertyGroup>
  {/if}
</div>

<style>
  .credential-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }
</style>
