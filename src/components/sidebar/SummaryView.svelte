<script lang="ts">
  // Summary view for a selected node.
  import type { LineageNodeData } from '../../types.js';
  import { isPrimaryContentKey } from '../../services/sidebar/contentKeys.js';
  import { formatTimestamp } from '../../services/sidebar/dateFormat.js';
  import ImpactSection from './ImpactSection.svelte';
  import MetaRow from './MetaRow.svelte';

  export let node: LineageNodeData;

  $: content = node.assetManifest?.content;
  $: codeAssertion = node.assetManifest?.assertions?.find(
    (assertion) => assertion.label === 'lco.code'
  );
  $: codeData =
    codeAssertion && typeof codeAssertion.data === 'object'
      ? (codeAssertion.data as { function?: string; module?: string })
      : null;
</script>

{#if node.assetType}
  <div class="sidebar-type-badge">{node.assetType}</div>
{/if}

{#if node.humanDescription}
  <div class="sidebar-description">{node.humanDescription}</div>
{/if}

<div class="sidebar-meta">
  {#if node.duration}
    <MetaRow label="duration" value={node.duration} />
  {/if}
  {#if isPrimaryContentKey('model') && content?.model}
    <MetaRow label="model" value={String(content.model)} />
  {/if}
  {#if isPrimaryContentKey('inputTokens') && content?.inputTokens !== undefined}
    <MetaRow
      label="tokens"
      value={`${content.inputTokens} in / ${content.outputTokens ?? 0} out`}
    />
  {/if}
  {#if isPrimaryContentKey('temperature') && content?.temperature !== undefined}
    <MetaRow label="temp" value={String(content.temperature)} />
  {/if}
  {#if isPrimaryContentKey('responseLength') && content?.responseLength}
    <MetaRow
      label="length"
      value={`${content.responseLength.toLocaleString()} chars`}
    />
  {/if}
  {#if isPrimaryContentKey('durationMs') && content?.durationMs}
    <MetaRow
      label="api time"
      value={`${(content.durationMs / 1000).toFixed(2)}s`}
    />
  {/if}
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
