<script lang="ts">
  /**
   * Shared component for syntax-highlighted code/JSON display.
   * Used by CodeBlock, DetailValue, and anywhere else highlighting is needed.
   */
  import hljs from 'highlight.js/lib/core';
  import python from 'highlight.js/lib/languages/python';
  import javascript from 'highlight.js/lib/languages/javascript';
  import typescript from 'highlight.js/lib/languages/typescript';
  import json from 'highlight.js/lib/languages/json';
  import 'highlight.js/styles/github-dark.css';

  hljs.registerLanguage('python', python);
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('json', json);

  export let code: string;
  export let language: string = 'json';

  $: highlighted = hljs.highlight(code, { language, ignoreIllegals: true }).value;

  const setHighlightedHtml = (node: HTMLElement, html: string) => {
    node.innerHTML = html;
    return {
      update(newHtml: string) {
        node.innerHTML = newHtml;
      }
    };
  };
</script>

<pre class="highlighted-code"><code class="hljs" use:setHighlightedHtml={highlighted}></code></pre>

<style>
  .highlighted-code {
    margin: 0;
    padding: var(--space-md);
    border-radius: var(--radius-md);
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-relaxed);
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Ensure hljs respects our border-radius */
  .highlighted-code :global(.hljs) {
    border-radius: var(--radius-md);
  }

  .highlighted-code code {
    font-family: inherit;
  }
</style>
