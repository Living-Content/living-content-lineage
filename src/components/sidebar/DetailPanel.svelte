<script lang="ts">
  // Detail panel for expanded node metadata.
  import { selectedNode } from '../../stores/lineageState.js';
  import { closeDetailPanel, isDetailOpen } from '../../stores/uiState.js';
  import { hasDetailContent } from '../../services/sidebar/detailContent.js';
  import DetailView from './DetailView.svelte';

  $: detailAvailable = $selectedNode ? hasDetailContent($selectedNode) : false;
  $: showPanel = detailAvailable && $isDetailOpen;
  $: panelTitle = $selectedNode?.label ?? 'DETAILS';
</script>

<div class={`detail-panel${showPanel ? ' visible' : ''}`} id="detail-panel">
  <div class="detail-panel-header">
    <span class="detail-panel-title">{panelTitle}</span>
    <button class="detail-panel-close" id="detail-panel-close" on:click={closeDetailPanel}>
      ×
    </button>
  </div>
  <div class="detail-panel-content" id="detail-panel-content">
    {#if detailAvailable && $selectedNode}
      <DetailView node={$selectedNode} />
    {/if}
  </div>
</div>
