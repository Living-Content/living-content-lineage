<script lang="ts">
  /**
   * Recursive renderer for detail values.
   * Handles arrays, objects, JSON strings, markdown, URLs, and plain text.
   */
  import {
    isHttpUrl,
    looksLikeMarkdown,
    parseJson,
    parseLooseJson,
    tryParseJsonFragment,
  } from '../../../services/inspector/format.js';
  import { isRecord } from '../../../config/utils.js';
  import MarkdownValue from '../renderers/MarkdownValue.svelte';
  import ConversationHistory from '../renderers/ConversationHistory.svelte';
  import HighlightedCode from '../renderers/HighlightedCode.svelte';
  import DetailValue from './DetailValue.svelte';

  let { value }: {
    value: unknown;
  } = $props();

  let parsedJson = $derived(
    typeof value === 'string' ? parseJson(value) : null);
  let parsedLoose = $derived(
    typeof value === 'string' && parsedJson === null
      ? parseLooseJson(value)
      : null);
  let fragment = $derived(
    typeof value === 'string' && parsedJson === null && parsedLoose === null
      ? tryParseJsonFragment(value)
      : null);

  // Detect if array looks like conversation messages (has role/content structure)
  function isConversationArray(arr: unknown[]): boolean {
    if (arr.length === 0) return false;
    return arr.every(item =>
      typeof item === 'object' && item !== null &&
      ('role' in item || 'content' in item)
    );
  }
</script>

{#if Array.isArray(value)}
  {#if isConversationArray(value)}
    <ConversationHistory messages={value} />
  {:else}
    <ul class="detail-field-value detail-value-list">
      {#each value as item, index (index)}
        <li>
          <DetailValue value={item} />
        </li>
      {/each}
    </ul>
  {/if}
{:else if isRecord(value)}
  <HighlightedCode code={JSON.stringify(value, null, 2)} language="json" />
{:else if typeof value === 'string'}
  {#if parsedJson !== null}
    <HighlightedCode code={JSON.stringify(parsedJson, null, 2)} language="json" />
  {:else if parsedLoose !== null}
    <HighlightedCode code={JSON.stringify(parsedLoose, null, 2)} language="json" />
  {:else if fragment}
    <div class="detail-value-fragment">
      {#if fragment?.prefix?.trim().length}
        <div class="detail-fragment-context">{fragment.prefix.trim()}</div>
      {/if}
      <HighlightedCode code={JSON.stringify(fragment?.parsed, null, 2)} language="json" />
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
</style>
