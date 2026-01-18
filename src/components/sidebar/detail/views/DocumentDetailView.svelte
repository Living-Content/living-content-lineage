<script lang="ts">
  /**
   * Detail view for Document assets.
   * Displays content preview, message count, and content metadata.
   */
  import type { LineageNodeData } from '../../../../types.js';
  import { extractAssertionData } from '../../../../services/sidebar/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import MetaRow from '../../MetaRow.svelte';
  import MarkdownValue from '../MarkdownValue.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: assertions = extractAssertionData(assetManifest?.assertions);
  $: lcoContent = assertions.content;
  $: content = assetManifest?.content as DocumentContent | undefined;

  interface DocumentContent {
    query?: string;
    response?: string;
    message_count?: number;
    client_date_time?: {
      iso?: string;
      local?: string;
      timezone?: string;
    };
  }

  $: queryText = content?.query;
  $: responseText = content?.response;
  $: messageCount = content?.message_count ?? 0;
  $: charCount = (queryText?.length ?? 0) + (responseText?.length ?? 0);
  $: dateTime = content?.client_date_time;

  let contentCollapsed = false;
</script>

<div class="document-detail-view">
  <PropertyGroup title="Document Stats" collapsible={false}>
    <MetaRow label="Messages" value={String(messageCount)} />
    <MetaRow label="Characters" value={charCount.toLocaleString()} />
  </PropertyGroup>

  {#if queryText}
    <PropertyGroup title="Query" bind:collapsed={contentCollapsed}>
      <p class="content-preview">{queryText}</p>
    </PropertyGroup>
  {/if}

  {#if responseText}
    <PropertyGroup title="Response" collapsed>
      <div class="response-content">
        <MarkdownValue value={responseText} />
      </div>
    </PropertyGroup>
  {/if}

  {#if lcoContent?.contentHash}
    <PropertyGroup title="Content Info" collapsed>
      {#if lcoContent.type}
        <MetaRow label="Type" value={lcoContent.type} />
      {/if}
      <MetaRow label="Hash" value={lcoContent.contentHash} />
    </PropertyGroup>
  {/if}

  {#if dateTime}
    <PropertyGroup title="Timestamp" collapsed>
      {#if dateTime.local}
        <MetaRow label="Local" value={dateTime.local} />
      {/if}
      {#if dateTime.timezone}
        <MetaRow label="Timezone" value={dateTime.timezone} />
      {/if}
      {#if dateTime.iso}
        <MetaRow label="ISO" value={dateTime.iso} />
      {/if}
    </PropertyGroup>
  {/if}
</div>

<style>
  .document-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }

  .content-preview {
    margin: 0;
    font-size: var(--font-size-body, 14px);
    color: var(--color-text-primary);
    line-height: var(--line-height-relaxed, 1.6);
  }

  .response-content {
    font-size: var(--font-size-body, 14px);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed, 1.6);
  }
</style>
