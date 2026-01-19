<script lang="ts">
  /**
   * Detail view for Code assets.
   * Displays function info, duration, source code, and execution flow.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import {
    extractAssertionData,
    formatDuration,
  } from '../../../../services/dataviewer/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import MetaRow from '../../MetaRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: assertions = extractAssertionData(assetManifest?.assertions);
  $: code = assertions.code;
  $: execution = assertions.execution;
  $: sourceCode = assetManifest?.sourceCode;

  $: durationDisplay = node.duration ?? formatDuration(execution?.executionDurationMs);
  $: functionDisplay = code?.function ?? '-';
  $: moduleDisplay = code?.module ?? '-';
  $: computationDisplay = code?.computation ?? '-';

  let sourceCollapsed = true;
</script>

<div class="code-detail-view">
  <PropertyGroup title="Code Info" collapsible={false}>
    <MetaRow label="Function" value={functionDisplay} />
    <MetaRow label="Module" value={moduleDisplay} />
    <MetaRow label="Computation" value={computationDisplay} />
    {#if durationDisplay && durationDisplay !== '-'}
      <MetaRow label="Duration" value={durationDisplay} />
    {/if}
    {#if code?.hash}
      <MetaRow label="Hash" value={code.hash} />
    {/if}
  </PropertyGroup>

  {#if execution}
    <PropertyGroup title="Execution Flow" collapsed>
      {#if execution.previousFunction}
        <MetaRow label="Previous" value={execution.previousFunction} />
      {/if}
      {#if execution.nextFunction}
        <MetaRow label="Next" value={execution.nextFunction} />
      {/if}
    </PropertyGroup>
  {/if}

  {#if sourceCode}
    <PropertyGroup title="Source Code" bind:collapsed={sourceCollapsed}>
      <pre class="source-code"><code>{sourceCode}</code></pre>
    </PropertyGroup>
  {/if}
</div>

<style>
  .code-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }

  .source-code {
    margin: 0;
    padding: var(--space-md, 12px);
    background: var(--code-block-bg, rgba(0, 0, 0, 0.04));
    border: 1px solid var(--code-block-border, rgba(0, 0, 0, 0.04));
    border-radius: var(--radius-md, 8px);
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-small, 12px);
    line-height: var(--line-height-relaxed, 1.6);
    color: var(--code-text-color, var(--color-text-secondary));
    white-space: pre-wrap;
    word-break: break-word;
  }

  .source-code code {
    font-family: inherit;
  }
</style>
