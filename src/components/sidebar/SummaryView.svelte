<script lang="ts">
  // Summary view for a selected node.
  import type { LineageNodeData } from '../../types.js';
  import {
    shouldDisplayKey,
    formatKeyLabel,
    formatContentValue,
    isSummaryValue
  } from '../../services/sidebar/contentKeys.js';
  import { formatTimestamp } from '../../services/sidebar/dateFormat.js';
  import ImpactSection from './ImpactSection.svelte';
  import MetaRow from './MetaRow.svelte';
  import { formatAssetTypeLabel } from '../../services/labels.js';

  export let node: LineageNodeData;

  $: content = node.assetManifest?.content;
  $: contentEntries = content
    ? Object.entries(content).filter(
        ([key, value]) =>
          shouldDisplayKey(key) && isSummaryValue(value) && value !== undefined && value !== null
      )
    : [];
  $: codeAssertion = node.assetManifest?.assertions?.find(
    (assertion) => assertion.label === 'lco.code'
  );
  $: codeData =
    codeAssertion && typeof codeAssertion.data === 'object'
      ? (codeAssertion.data as { function?: string; module?: string })
      : null;
</script>

{#if node.assetType}
  <div class="sidebar-type-badge">{formatAssetTypeLabel(node.assetType)}</div>
{/if}

{#if node.humanDescription}
  <div class="sidebar-description">{node.humanDescription}</div>
{/if}

<div class="sidebar-meta">
  {#if node.duration}
    <MetaRow label="duration" value={node.duration} />
  {/if}
  {#each contentEntries as [key, value] (key)}
    <MetaRow label={formatKeyLabel(key)} value={formatContentValue(value)} />
  {/each}
  {#if codeData?.module}
    <MetaRow label="module" value={codeData.module} />
  {/if}
  {#if codeData?.function}
    <MetaRow label="function" value={codeData.function} />
  {/if}
  {#if node.assetManifest?.signatureInfo?.time}
    <MetaRow
      label="signed"
      value={formatTimestamp(node.assetManifest.signatureInfo.time)}
    />
  {/if}
</div>

<ImpactSection node={node} />
