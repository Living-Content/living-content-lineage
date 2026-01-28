<script lang="ts">
  // Wrapper for a titled detail section.
  import type { Snippet } from 'svelte';

  let {
    title,
    children
  }: {
    title: string;
    children: Snippet;
  } = $props();
</script>

<div class="detail-section">
  <div class="content-header">{title}</div>
  {@render children()}
</div>

<style>
  .detail-section {
    margin-bottom: 16px;
  }

  .content-header {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--color-text-light);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
</style>
