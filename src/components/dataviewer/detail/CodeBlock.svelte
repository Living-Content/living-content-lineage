<script lang="ts">
  /**
   * Reusable component for displaying source code with syntax highlighting.
   */
  import PropertyGroup from './PropertyGroup.svelte';
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
  export let title: string = 'Source Code';
  export let collapsed: boolean = true;
  export let language: string = 'python';

  $: highlighted = hljs.highlight(code, { language, ignoreIllegals: true }).value;
</script>

<PropertyGroup {title} {collapsed}>
  <pre class="code-block"><code class="hljs">{@html highlighted}</code></pre>
</PropertyGroup>

<style>
  .code-block {
    margin: 0;
    padding: var(--space-md);
    border-radius: var(--radius-md);
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-relaxed);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .code-block code {
    font-family: inherit;
  }

  .code-block :global(.hljs) {
    border-radius: var(--radius-md);
  }
</style>
