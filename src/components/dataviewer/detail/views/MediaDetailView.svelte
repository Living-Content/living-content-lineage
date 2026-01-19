<script lang="ts">
  /**
   * Detail view for Media assets.
   * Displays media format, dimensions, and content metadata.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import { extractAssertionData } from '../../../../services/dataviewer/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import MetaRow from '../../MetaRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: assertions = extractAssertionData(assetManifest?.assertions);
  $: c2paActions = assertions.c2paActions;
  $: content = assetManifest?.content as MediaContent | undefined;
  $: format = assetManifest?.format ?? 'unknown';

  interface MediaContent {
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    mime_type?: string;
  }

  $: mediaType = format.split('/')[0] ?? 'media';
  $: dimensions = content?.width && content?.height
    ? `${content.width}×${content.height}`
    : '-';
  $: fileSize = content?.size
    ? formatFileSize(content.size)
    : '-';

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<div class="media-detail-view">
  <PropertyGroup title="Media Info" collapsible={false}>
    <MetaRow label="Format" value={format} />
    <MetaRow label="Type" value={mediaType} />
    <MetaRow label="Dimensions" value={dimensions} />
    {#if content?.mime_type}
      <MetaRow label="MIME Type" value={content.mime_type} />
    {/if}
    {#if content?.size}
      <MetaRow label="File Size" value={fileSize} />
    {/if}
    {#if content?.duration}
      <MetaRow label="Duration" value={`${content.duration}s`} />
    {/if}
  </PropertyGroup>

  {#if c2paActions?.actions?.length}
    <PropertyGroup title="Actions" collapsed>
      {#each c2paActions.actions as action}
        <MetaRow label="Action" value={action.action ?? '-'} />
        {#if action.softwareAgent}
          <MetaRow
            label="Agent"
            value={`${action.softwareAgent.name ?? ''} ${action.softwareAgent.version ?? ''}`}
          />
        {/if}
        {#if action.when}
          <MetaRow label="When" value={action.when} />
        {/if}
      {/each}
    </PropertyGroup>
  {/if}
</div>

<style>
  .media-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }
</style>
