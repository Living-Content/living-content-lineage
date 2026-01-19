<script lang="ts">
  /**
   * Detail view for Attestation assets.
   * Displays verification status, signature info, and attestation metadata.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import MetaRow from '../../MetaRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: signatureInfo = assetManifest?.signatureInfo;
  $: ingredients = assetManifest?.ingredients ?? [];

  $: verificationStatus = signatureInfo ? 'Verified' : 'Unverified';
  $: algorithm = signatureInfo?.alg ?? '-';
</script>

<div class="attestation-detail-view">
  <PropertyGroup title="Attestation Info" collapsible={false}>
    <MetaRow label="Status" value={verificationStatus} />
    <MetaRow label="Algorithm" value={algorithm} />
  </PropertyGroup>

  {#if ingredients.length > 0}
    <PropertyGroup title="Attested Assets ({ingredients.length})" collapsed>
      {#each ingredients as ingredient}
        <div class="ingredient-item">
          <MetaRow label="Title" value={ingredient.title} />
          <MetaRow label="Relationship" value={ingredient.relationship} />
          {#if ingredient.format}
            <MetaRow label="Format" value={ingredient.format} />
          {/if}
        </div>
      {/each}
    </PropertyGroup>
  {/if}
</div>

<style>
  .attestation-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }

  .ingredient-item {
    padding: var(--space-sm, 8px) 0;
    border-top: 1px solid var(--color-border-light, rgba(0, 0, 0, 0.04));
  }

  .ingredient-item:first-child {
    border-top: none;
    padding-top: 0;
  }
</style>
