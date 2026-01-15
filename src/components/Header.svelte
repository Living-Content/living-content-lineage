<script lang="ts">
  // Header with logo and detail level indicator.
  import { isSimpleView } from '../stores/uiState.js';
</script>

<header class="header">
  <div class="header-left">
    <img src="/assets/logo.svg" alt="LCO" class="logo" />
  </div>
  <div class="header-right">
    <img
      src={$isSimpleView ? '/icons/simple.svg' : '/icons/detail.svg'}
      alt={$isSimpleView ? 'Simple view' : 'Detailed view'}
      id="lod-icon"
      class="lod-indicator"
    />
  </div>
</header>
