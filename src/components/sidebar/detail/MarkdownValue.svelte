<script lang="ts">
  // Renders Markdown with a toggle for raw display.
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';

  export let value: string;

  let showRaw = false;
  let rendered = '';

  async function updateRendered(input: string): Promise<void> {
    try {
      const parsed = marked.parse(input);
      const html = typeof parsed === 'string' ? parsed : await parsed;
      rendered = DOMPurify.sanitize(html);
    } catch {
      rendered = '';
    }
  }

  $: updateRendered(value);
</script>

<div class={`detail-field-value detail-value-markdown${showRaw ? ' show-raw' : ''}`}>
  <button
    type="button"
    class="markdown-toggle"
    on:click={() => (showRaw = !showRaw)}
  >
    {showRaw ? 'View rendered' : 'View raw'}
  </button>
  <div class="markdown-rendered">
    {#if rendered}
      {@html rendered}
    {:else}
      {value}
    {/if}
  </div>
  <pre class="markdown-raw">{value}</pre>
</div>
