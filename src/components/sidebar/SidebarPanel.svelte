<script lang="ts">
  // Sidebar container that renders summary or stage overview.
  import { clearSelection, selectedNode, selectedStage } from '../../stores/lineageState.js';
  import {
    isDetailOpen,
    isSidebarFloating,
    loadError,
    setDetailOpen,
    toggleSidebarFloating,
  } from '../../stores/uiState.js';
  import { hasDetailContent } from '../../services/sidebar/detailContent.js';
  import SummaryView from './SummaryView.svelte';
  import StageOverview from './StageOverview.svelte';

  $: sidebarTitle = $selectedNode?.label ?? $selectedStage?.label ?? 'CONTEXT';
  $: detailAvailable = $selectedNode ? hasDetailContent($selectedNode) : false;
  $: sidebarHidden = !$selectedNode && !$selectedStage && !$loadError;
  $: showCloseButton = $selectedNode || $selectedStage;
</script>

<aside
  class={`sidebar${$isSidebarFloating ? ' floating' : ''}${
    sidebarHidden ? ' hidden' : ''
  }${$isDetailOpen ? ' detail-open' : ''}`}
  id="sidebar"
>
  <div class="sidebar-header">
    <span class="sidebar-title" id="sidebar-title">{sidebarTitle}</span>
    <div class="sidebar-header-buttons">
      <button
        class="sidebar-expand-btn"
        id="sidebar-expand"
        title="Toggle floating"
        on:click={toggleSidebarFloating}
      >
        {$isSidebarFloating ? '↙' : '↗'}
      </button>
      {#if showCloseButton}
        <button
          class="sidebar-close-btn"
          title="Close"
          on:click={clearSelection}
        >
          ×
        </button>
      {/if}
    </div>
  </div>

  <div class="sidebar-content" id="sidebar-content">
    {#if $loadError}
      <p class="sidebar-placeholder">{$loadError}</p>
    {:else if $selectedNode}
      <SummaryView node={$selectedNode} />
      {#if detailAvailable}
        <button
          class="view-details-link"
          disabled={$isDetailOpen}
          aria-disabled={$isDetailOpen}
          on:click={() => setDetailOpen(true)}
        >
          Details
        </button>
      {/if}
    {:else if $selectedStage}
      <StageOverview nodes={$selectedStage.nodes} edges={$selectedStage.edges} />
    {:else}
      <p class="sidebar-placeholder">Select a node to view details</p>
    {/if}
  </div>
</aside>
