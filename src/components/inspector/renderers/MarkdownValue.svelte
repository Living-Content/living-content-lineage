<script lang="ts">
  // Renders Markdown with a toggle for raw display.
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';

  let { value }: { value: string } = $props();

  let showRaw = $state(false);
  let rendered = $state('');

  async function updateRendered(input: string): Promise<void> {
    try {
      const parsed = marked.parse(input);
      const html = typeof parsed === 'string' ? parsed : await parsed;
      // Remove whitespace between tags to prevent rendering as text nodes
      const stripped = html.replace(/>\s+</g, '><');
      rendered = DOMPurify.sanitize(stripped);
    } catch {
      rendered = '';
    }
  }

  $effect(() => {
    updateRendered(value);
  });
</script>

<div class={`detail-field-value detail-value-markdown${showRaw ? ' show-raw' : ''}`}>
  <button
    type="button"
    class="markdown-toggle"
    onclick={() => (showRaw = !showRaw)}
  >
    {showRaw ? 'View rendered' : 'View raw'}
  </button>
  <div class="markdown-rendered">
    {#if rendered}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content is sanitized with DOMPurify -->
      {@html rendered}
    {:else}
      {value}
    {/if}
  </div>
  <pre class="markdown-raw">{value}</pre>
</div>

<style>
  .detail-value-markdown {
    font-size: 13px;
    line-height: 1.45;
    font-family: var(--font-sans);
  }

  .markdown-toggle {
    align-self: flex-start;
    background: none;
    border: none;
    color: var(--color-text-subtle);
    font-size: 11px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 8px;
  }

  .markdown-toggle:hover {
    color: var(--color-text-secondary);
  }

  .markdown-rendered {
    display: block;
  }

  .markdown-raw {
    display: none;
    background: var(--color-code-bg);
    padding: 8px 10px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-mono);
  }

  .detail-value-markdown.show-raw .markdown-rendered {
    display: none;
  }

  .detail-value-markdown.show-raw .markdown-raw {
    display: block;
  }

  .detail-value-markdown :global(p) {
    margin: 0 0 10px;
  }

  .detail-value-markdown :global(h1),
  .detail-value-markdown :global(h2),
  .detail-value-markdown :global(h3),
  .detail-value-markdown :global(h4) {
    font-size: 14px;
    font-weight: 600;
    margin: 16px 0 8px;
  }

  .detail-value-markdown :global(h1:first-child),
  .detail-value-markdown :global(h2:first-child),
  .detail-value-markdown :global(h3:first-child),
  .detail-value-markdown :global(h4:first-child) {
    margin-top: 0;
  }

  .detail-value-markdown :global(ul),
  .detail-value-markdown :global(ol) {
    margin: 10px 0 10px 18px;
    padding: 0;
  }

  .detail-value-markdown :global(li + li) {
    margin-top: 4px;
  }

  .detail-value-markdown :global(li) {
    margin: 0;
  }

  .detail-value-markdown :global(strong) {
    font-weight: 600;
  }

  .detail-value-markdown :global(code) {
    font-family: var(--font-mono);
    background: var(--color-code-inline-bg);
    padding: 2px 4px;
    border-radius: 4px;
  }

  .detail-value-markdown :global(pre) {
    background: var(--color-code-bg);
    padding: 8px 10px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0;
  }

  .detail-value-markdown :global(blockquote) {
    margin: 0;
    padding-left: 10px;
    border-left: 3px solid var(--color-border-strong);
    color: var(--color-text-muted);
  }

  .detail-value-markdown :global(hr) {
    border: 0;
    border-top: 1px solid var(--color-border-hover);
    margin: 8px 0;
  }

  .detail-value-markdown :global(a) {
    color: var(--color-link);
    text-decoration: underline;
  }
</style>
