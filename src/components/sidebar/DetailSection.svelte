<script lang="ts">
  // Wrapper for a titled detail section.
  export let title: string;
</script>

<div class="sidebar-content-section">
  <div class="content-header">{title}</div>
  <slot />
</div>
