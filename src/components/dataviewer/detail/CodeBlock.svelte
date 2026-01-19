<script lang="ts">
  /**
   * Reusable component for displaying source code.
   * Used by GenericDetailView and CodeDetailView.
   */
  import PropertyGroup from './PropertyGroup.svelte';

  export let code: string;
  export let title: string = 'Source Code';
  export let collapsed: boolean = true;
</script>

<PropertyGroup {title} {collapsed}>
  <pre class="code-block"><code>{code}</code></pre>
</PropertyGroup>

<style>
  .code-block {
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

  .code-block code {
    font-family: inherit;
  }
</style>
