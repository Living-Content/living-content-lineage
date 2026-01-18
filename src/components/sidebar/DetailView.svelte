<script lang="ts">
  /**
   * Detail view router.
   * Routes to asset-specific detail views. Header is provided by InfoPanel.
   */
  import type { LineageNodeData } from '../../types.js';
  import ModelDetailView from './detail/views/ModelDetailView.svelte';
  import CodeDetailView from './detail/views/CodeDetailView.svelte';
  import DatasetDetailView from './detail/views/DatasetDetailView.svelte';
  import DocumentDetailView from './detail/views/DocumentDetailView.svelte';
  import DataObjectDetailView from './detail/views/DataObjectDetailView.svelte';
  import ActionDetailView from './detail/views/ActionDetailView.svelte';
  import MediaDetailView from './detail/views/MediaDetailView.svelte';
  import AttestationDetailView from './detail/views/AttestationDetailView.svelte';
  import CredentialDetailView from './detail/views/CredentialDetailView.svelte';
  import GenericDetailView from './detail/views/GenericDetailView.svelte';

  export let node: LineageNodeData;

  $: assetType = node.assetType;
</script>

<div class="detail-view">
  <!-- Asset-specific content -->
  {#if assetType === 'Model'}
    <ModelDetailView {node} />
  {:else if assetType === 'Code'}
    <CodeDetailView {node} />
  {:else if assetType === 'Dataset'}
    <DatasetDetailView {node} />
  {:else if assetType === 'Document'}
    <DocumentDetailView {node} />
  {:else if assetType === 'DataObject'}
    <DataObjectDetailView {node} />
  {:else if assetType === 'Action'}
    <ActionDetailView {node} />
  {:else if assetType === 'Media'}
    <MediaDetailView {node} />
  {:else if assetType === 'Attestation'}
    <AttestationDetailView {node} />
  {:else if assetType === 'Credential'}
    <CredentialDetailView {node} />
  {:else}
    <GenericDetailView {node} />
  {/if}
</div>

<style>
  .detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 12px);
  }
</style>
