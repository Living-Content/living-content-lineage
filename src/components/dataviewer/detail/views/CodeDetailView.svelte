<script lang="ts">
  /**
   * Detail view for Code assets.
   * Displays function info, duration, source code, and execution flow.
   */
  import type { LineageNodeData } from '../../../../config/types.js';
  import {
    extractAssertionData,
    formatDuration,
  } from '../../../../services/dataviewer/parsing/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import PropertyRow from '../../PropertyRow.svelte';
  import CodeBlock from '../CodeBlock.svelte';

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
</script>

<div class="code-detail-view">
  <PropertyGroup title="Code Info" collapsible={false}>
    <PropertyRow label="Function" value={functionDisplay} />
    <PropertyRow label="Module" value={moduleDisplay} />
    <PropertyRow label="Computation" value={computationDisplay} />
    {#if durationDisplay && durationDisplay !== '-'}
      <PropertyRow label="Duration" value={durationDisplay} />
    {/if}
    {#if code?.hash}
      <PropertyRow label="Hash" value={code.hash} />
    {/if}
  </PropertyGroup>

  {#if execution}
    <PropertyGroup title="Execution Flow" collapsed>
      {#if execution.previousFunction}
        <PropertyRow label="Previous" value={execution.previousFunction} />
      {/if}
      {#if execution.nextFunction}
        <PropertyRow label="Next" value={execution.nextFunction} />
      {/if}
    </PropertyGroup>
  {/if}

  {#if sourceCode}
    <CodeBlock code={sourceCode} />
  {/if}
</div>

<style>
  .code-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }
</style>
