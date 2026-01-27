<script lang="ts">
  /**
   * Header with menu toggle, title, branch history, and LOD indicator.
   */
  import { uiState } from '../stores/uiState.svelte.js';
  import { menuStore } from '../stores/menuStore.svelte.js';
  import { traceState } from '../stores/traceState.svelte.js';
  import BranchHistory from './branches/BranchHistory.svelte';

  let isMenuOpen = $derived(menuStore.isOpen);
  let isSubPanel = $derived(menuStore.isSubPanel);
  let panelTitle = $derived(menuStore.panelTitle);
  let title = $derived(traceState.trace?.title ?? 'Trace');

  function handleMenuToggle() {
    menuStore.handleToggle();
  }
</script>

<header class="header">
  <button
    class="menu-toggle"
    class:open={isMenuOpen}
    class:sub-panel={isSubPanel}
    onclick={handleMenuToggle}
    aria-label={isSubPanel ? 'Go back' : isMenuOpen ? 'Close menu' : 'Open menu'}
  >
    <span class="line"></span>
    <span class="line"></span>
    <span class="line"></span>
    <span class="back-arrow"></span>
  </button>

  {#if isSubPanel}
    <span class="title-text">{panelTitle}</span>
  {:else if !uiState.isSimpleView}
    <span class="title-text">{title}</span>
  {/if}

  <BranchHistory />

  <div class="spacer"></div>

  <img
    src={uiState.isSimpleView ? '/icons/simple.svg' : '/icons/detail.svg'}
    alt={uiState.isSimpleView ? 'Simple view' : 'Detailed view'}
    id="lod-icon"
    class="lod-indicator"
  />
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
    gap: var(--space-sm);
    padding: 0 var(--panel-margin);
    z-index: var(--z-menu-toggle);
  }

  /* Menu toggle button */
  .menu-toggle {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
  }

  .menu-toggle:focus {
    outline: none;
  }

  .line {
    display: block;
    width: 18px;
    height: 3px;
    background: rgb(var(--color-foreground));
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .back-arrow {
    position: absolute;
    width: 14px;
    height: 14px;
    border-left: 3px solid rgb(var(--color-foreground));
    border-bottom: 3px solid rgb(var(--color-foreground));
    transform: rotate(45deg);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .menu-toggle.open .line:nth-child(1) {
    transform: translateY(8px);
    opacity: 0;
  }

  .menu-toggle.open .line:nth-child(3) {
    transform: translateY(-8px);
    opacity: 0;
  }

  .menu-toggle.sub-panel .line {
    opacity: 0;
  }

  .menu-toggle.sub-panel .back-arrow {
    opacity: 1;
  }

  .title-text {
    font-family: var(--font-sans);
    font-size: 28px;
    font-weight: 600;
    color: rgb(var(--color-foreground));
  }

  .spacer {
    flex: 1;
  }

  .lod-indicator {
    width: 28px;
    height: 28px;
    filter: invert(1);
    mix-blend-mode: difference;
    transition: opacity 0.2s ease;
  }
</style>
