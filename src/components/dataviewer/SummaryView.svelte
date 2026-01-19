<script lang="ts">
  // Summary view for a selected node.
  import type { LineageNodeData } from '../../config/types.js';
  import {
    shouldDisplayKey,
    formatKeyLabel,
    formatContentValue,
    isSummaryValue
  } from '../../services/dataviewer/contentKeys.js';
  import ImpactSection from './ImpactSection.svelte';
  import MetaRow from './MetaRow.svelte';

  export let node: LineageNodeData;

  $: content = node.assetManifest?.content;
  $: contentEntries = content
    ? Object.entries(content).filter(
        ([key, value]) =>
          shouldDisplayKey(key) && isSummaryValue(value) && value !== undefined && value !== null && key !== 'description'
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

<div class="summary-view">
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
  </div>

  <ImpactSection node={node} />
</div>

<style>
  .summary-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 12px);
  }

  .sidebar-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 4px);
  }
</style>
