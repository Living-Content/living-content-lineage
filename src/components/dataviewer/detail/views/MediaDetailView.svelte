<script lang="ts">
  /**
   * Detail view for Media assets.
   * Displays media format, dimensions, and content metadata.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import { extractAssertionData } from '../../../../services/dataviewer/parsing/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import PropertyRow from '../../PropertyRow.svelte';
  import ActionsList from '../ActionsList.svelte';

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
    <PropertyRow label="Format" value={format} />
    <PropertyRow label="Type" value={mediaType} />
    <PropertyRow label="Dimensions" value={dimensions} />
    {#if content?.mime_type}
      <PropertyRow label="MIME Type" value={content.mime_type} />
    {/if}
    {#if content?.size}
      <PropertyRow label="File Size" value={fileSize} />
    {/if}
    {#if content?.duration}
      <PropertyRow label="Duration" value={`${content.duration}s`} />
    {/if}
  </PropertyGroup>

  {#if c2paActions?.actions}
    <ActionsList actions={c2paActions.actions} />
  {/if}
</div>

<style>
  .media-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }
</style>
