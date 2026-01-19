<script lang="ts">
  // Recursive renderer for detail values.
  import {
    isHttpUrl,
    looksLikeMarkdown,
    parseJson,
    parseLooseJson,
    tryParseJsonFragment,
  } from '../../../services/dataviewer/valueParsing.js';
  import MarkdownValue from './MarkdownValue.svelte';

  export let value: unknown;

  function isRecord(input: unknown): input is Record<string, unknown> {
    return typeof input === 'object' && input !== null && !Array.isArray(input);
  }

  $: parsedJson =
    typeof value === 'string' ? parseJson(value) : null;
  $: parsedLoose =
    typeof value === 'string' && parsedJson === null
      ? parseLooseJson(value)
      : null;
  $: fragment =
    typeof value === 'string' && parsedJson === null && parsedLoose === null
      ? tryParseJsonFragment(value)
      : null;
</script>

{#if Array.isArray(value)}
  <ul class="detail-field-value detail-value-list">
    {#each value as item, index (index)}
      <li>
        <svelte:self value={item} />
      </li>
    {/each}
  </ul>
{:else if isRecord(value)}
  <pre class="detail-field-value detail-value-pre">{JSON.stringify(value, null, 2)}</pre>
{:else if typeof value === 'string'}
  {#if parsedJson !== null}
    <pre class="detail-field-value detail-value-pre">{JSON.stringify(parsedJson, null, 2)}</pre>
  {:else if parsedLoose !== null}
    <pre class="detail-field-value detail-value-pre">{JSON.stringify(parsedLoose, null, 2)}</pre>
  {:else if fragment}
    <div class="detail-field-value detail-value-fragment">
      {#if fragment?.prefix?.trim().length}
        <div class="detail-fragment-context">{fragment.prefix.trim()}</div>
      {/if}
      <pre class="detail-value-pre detail-fragment-json">{JSON.stringify(fragment?.parsed, null, 2)}</pre>
      {#if fragment?.suffix?.trim().length}
        <div class="detail-fragment-context">{fragment.suffix.trim()}</div>
      {/if}
    </div>
  {:else if looksLikeMarkdown(value)}
    <MarkdownValue value={value} />
  {:else if isHttpUrl(value)}
    <a class="detail-field-value detail-value-link" href={value} target="_blank" rel="noreferrer">
      {value}
    </a>
  {:else if value.includes('\n') || value.length > 120}
    <pre class="detail-field-value detail-value-pre">{value}</pre>
  {:else}
    <span class="detail-field-value">{value}</span>
  {/if}
{:else}
  <span class="detail-field-value">{String(value)}</span>
{/if}

<style>
  .detail-field-value {
    font-size: 12px;
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    word-break: break-all;
    line-height: 1.4;
  }

  .detail-value-pre {
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }

  .detail-value-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .detail-value-list li {
    margin: 0;
  }

  .detail-value-link {
    color: var(--color-link);
    text-decoration: underline;
    word-break: break-word;
  }

  .detail-value-fragment {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .detail-fragment-context {
    font-size: 12px;
    color: var(--color-text-subtle);
    white-space: pre-wrap;
  }

  .detail-fragment-json {
    margin: 0;
  }
</style>
