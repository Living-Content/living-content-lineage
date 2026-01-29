<script lang="ts">
  /**
   * Header with menu toggle, title, and view level selector.
   */
  import { uiState } from '../stores/uiState.svelte.js';
  import { menuStore } from '../stores/menuStore.svelte.js';
  import { traceState } from '../stores/traceState.svelte.js';
  import { viewLevel, type ViewLevel } from '../stores/viewLevel.svelte.js';
  import HeaderFilter from './HeaderFilter.svelte';

  let isMenuOpen = $derived(menuStore.isOpen);
  let isSubPanel = $derived(menuStore.isSubPanel);
  let panelTitle = $derived(menuStore.panelTitle);
  let title = $derived(traceState.trace?.title ?? 'Trace');
  let currentLevel = $derived(viewLevel.current);

  const levels: { id: ViewLevel; icon: string; label: string }[] = [
    { id: 'content-session', icon: '/icons/content-session.svg', label: 'Content Session' },
    { id: 'workflow-overview', icon: '/icons/workflow-overview.svg', label: 'Workflow Overview' },
    { id: 'workflow-detail', icon: '/icons/workflow-detail.svg', label: 'Workflow Detail' },
  ];

  function handleMenuToggle() {
    menuStore.handleToggle();
  }

  function handleLevelSelect(level: ViewLevel) {
    // Close detail panel when switching levels
    if (level !== currentLevel) {
      uiState.closeDetailPanel();
      // Clear selection when leaving detail view
      if (level !== 'workflow-detail') {
        traceState.clearSelection();
      }
    }
    // Always set level (triggers zoom to bounds even for same level)
    viewLevel.setLevel(level);
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

  <div class="spacer"></div>

  <HeaderFilter />

  <div class="view-level-selector">
    {#each levels as level}
      <button
        class="view-level-button"
        class:selected={currentLevel === level.id}
        onclick={() => handleLevelSelect(level.id)}
        aria-label={level.label}
        title={level.label}
      >
        <img
          src={level.icon}
          alt={level.label}
          class="view-level-icon"
        />
      </button>
    {/each}
  </div>
</header>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--header-height);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 0 var(--panel-margin);
    z-index: var(--z-menu-toggle);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
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

  .view-level-selector {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .view-level-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .view-level-button:focus {
    outline: none;
  }

  .view-level-icon {
    width: 24px;
    height: 24px;
    filter: invert(1);
    opacity: 0.4;
    transition: opacity 0.15s ease;
  }

  .view-level-button:hover .view-level-icon {
    opacity: 1;
  }

  .view-level-button.selected .view-level-icon {
    opacity: 1;
  }
</style>
