<script lang="ts">
  /**
   * Header with logo and detail level indicator.
   */
  import { isSimpleView } from '../stores/uiState.js';
</script>

<header class="header">
  <div class="header-left">
    <svg class="logo" viewBox="0 0 199.86 76.59" aria-label="LCO">
      <polygon fill="currentColor" points="49.24 66.25 49.24 75.79 0 75.79 0 .81 10.44 .81 10.44 66.25 49.24 66.25"/>
      <path fill="currentColor" d="M117.09,46.99h-10.45c-.68,10.42-8.6,19.83-21.21,20.53-16.11.89-24.45-12.07-24.45-29.23s9.08-28.88,24.62-28.88c8.11,0,13.75,2.38,18.15,9.71,1.23,2.05,2.12,5.13,2.47,7.33h10.43v-9.88h-2.42v-4.14h-3.89v-4.14h-3.89v-4.14h-7.79V0h-26.13v4.14h-7.78v4.14h-3.89v4.14h-3.89v4.14h-3.89v8.29h-3.89v26.85h3.89v8.29h3.89v4.14h3.89v4.14h3.89v4.14h7.78v4.14h26.13v-4.14h7.79v-3.17h4.22v-4.04c.07-.09.13-.17.2-.26h4.11v-6.5h2.1v-11.2l-.05.1c0-.2,0-.3,0-.3l.05.07v-.14Z"/>
      <path fill="currentColor" d="M195.78,24.52v-8.17h-4.09v-4.08h-4.09v-4.09h-4.09v-4.09h-8.17V0h-28.74v4.09h-8.17v4.09h-4.09v4.09h-4.09v4.08h-4.09v8.17h-4.08v27.48h4.08v8.17h4.09v4.09h4.09v4.09h4.09v4.09h8.17v4.08h28.74v-4.08h8.17v-4.09h4.09v-4.09h4.09v-4.09h4.09v-8.17h4.08v-27.48h-4.08ZM188.93,38.25c0,16.62-11.76,28.68-27.96,28.68s-27.95-12.06-27.95-28.68,11.76-28.69,27.95-28.69,27.96,12.07,27.96,28.69Z"/>
      <polygon fill="currentColor" points="174.85 35.22 174.85 41.33 164.06 41.33 164.06 52.12 157.95 52.12 157.95 41.33 147.11 41.33 147.11 35.22 157.95 35.22 157.95 24.38 164.06 24.38 164.06 35.22 174.85 35.22"/>
    </svg>
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

<style>
  .header {
    position: fixed;
    top: var(--panel-margin);
    left: 0;
    right: 0;
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--panel-margin);
    z-index: 20;
  }

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo {
    height: var(--header-height);
    width: 126px;
    color: white;
    mix-blend-mode: difference;
  }

  .lod-indicator {
    width: 28px;
    height: 28px;
    filter: invert(1);
    mix-blend-mode: difference;
    transition: opacity 0.2s ease;
  }
</style>
