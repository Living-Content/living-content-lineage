<script lang="ts">
  /**
   * Reusable component for displaying source code with syntax highlighting.
   * Wraps HighlightedCode in a collapsible PropertyGroup.
   */
  import PropertyGroup from './PropertyGroup.svelte';
  import HighlightedCode from './HighlightedCode.svelte';

  export let code: string;
  export let title: string = 'Source Code';
  export let collapsed: boolean = true;
  export let language: string = 'python';
</script>

<PropertyGroup {title} {collapsed}>
  <HighlightedCode {code} {language} />
</PropertyGroup>
