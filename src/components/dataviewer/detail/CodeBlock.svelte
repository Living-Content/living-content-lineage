<script lang="ts">
  /**
   * Reusable component for displaying source code with syntax highlighting.
   * Wraps HighlightedCode in a collapsible PropertyGroup.
   */
  import PropertyGroup from './PropertyGroup.svelte';
  import HighlightedCode from './HighlightedCode.svelte';

  let {
    code,
    title = 'Source Code',
    collapsed = true,
    language = 'python'
  }: {
    code: string;
    title?: string;
    collapsed?: boolean;
    language?: string;
  } = $props();
</script>

<PropertyGroup {title} {collapsed}>
  <HighlightedCode {code} {language} />
</PropertyGroup>
