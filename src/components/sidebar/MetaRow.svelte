<script lang="ts">
  // Simple key-value row used in sidebar metadata blocks.
  export let label: string;
  export let value: string;
</script>

<div class="meta-row">
  <span class="meta-label">{label}</span>
  <span class="meta-value">{value}</span>
</div>
