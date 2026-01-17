<script lang="ts">
  // Global SVG filter for liquid effects.
  // Apply with CSS: filter: url(#liquid)
</script>

<svg class="liquid-filter-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="liquid">
      <!-- Higher blur = more fluid merging between blobs -->
      <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
      <!-- Alpha contrast: lower values = softer, more fluid edges -->
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -6" />
    </filter>
  </defs>
</svg>

<style>
  .liquid-filter-svg {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
  }
</style>
