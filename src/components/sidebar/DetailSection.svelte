<script lang="ts">
  // Wrapper for a titled detail section.
  export let title: string;
</script>

<div class="sidebar-content-section">
  <div class="content-header">{title}</div>
  <slot />
</div>

<style>
  .sidebar-content-section {
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
