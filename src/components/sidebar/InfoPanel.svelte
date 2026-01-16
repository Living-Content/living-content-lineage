<script lang="ts">
  // Sidebar panel with liquid blob background.
  import { onMount, tick } from 'svelte';
  import gsap from 'gsap';
  import { clearSelection, selectedNode, selectedStage } from '../../stores/lineageState.js';
  import { isDetailOpen, loadError, setDetailOpen, closeDetailPanel } from '../../stores/uiState.js';
  import { hasDetailContent } from '../../services/sidebar/detailContent.js';
  import { createBlobManager, type BlobManager } from '../../services/liquidBlobs.js';
  import { expandTo, contractTo } from '../../services/panelExpand.js';
  import SummaryView from './SummaryView.svelte';
  import StageOverview from './StageOverview.svelte';
  import DetailView from './DetailView.svelte';

  let wrapperElement: HTMLElement;
  let contentLayer: HTMLElement;
  let scrollArea: HTMLElement;
  let blobContainer: HTMLElement;
  let blobManager: BlobManager | null = null;
  let isAnimating = false;
  let showDetailContent = false;
  let wasHidden = true;
  let baseWidth = 0;
  let baseHeight = 0;

  $: panelTitle = $selectedNode?.label ?? $selectedStage?.label ?? 'CONTEXT';
  $: detailAvailable = $selectedNode ? hasDetailContent($selectedNode) : false;
  $: panelHidden = !$selectedNode && !$selectedStage && !$loadError;
  $: showCloseButton = $selectedNode || $selectedStage;

  $: if (!panelHidden && wasHidden && wrapperElement) {
    animateEntrance();
  }

  $: if (panelHidden) {
    wasHidden = true;
  }

  async function animateEntrance(): Promise<void> {
    wasHidden = false;
    await tick();

    if (!blobManager && blobContainer) {
      blobManager = createBlobManager(blobContainer);
    }

    gsap.set(contentLayer, { opacity: 0 });

    baseWidth = wrapperElement.offsetWidth;
    baseHeight = wrapperElement.offsetHeight;

    const timeline = blobManager?.fill(baseWidth, baseHeight, 'elastic.out(1, 0.6)');
    timeline?.then(() => {
      gsap.to(contentLayer, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    });
  }

  async function openDetails(): Promise<void> {
    if (isAnimating) return;
    isAnimating = true;
    setDetailOpen(true);

    // Fade out scroll content, keep header visible
    await gsap.to(scrollArea, { opacity: 0, duration: 0.12, ease: 'power2.in' });

    // Now change content and wait for render
    showDetailContent = true;
    await tick();

    // Get target dimensions from expanded CSS
    wrapperElement.classList.add('expanded');
    const targetWidth = wrapperElement.offsetWidth;
    const targetHeight = wrapperElement.offsetHeight;
    wrapperElement.classList.remove('expanded');

    // Animate to expanded size, then fade in
    await expandTo(wrapperElement, targetWidth, targetHeight);
    wrapperElement.classList.add('expanded');
    await gsap.to(scrollArea, { opacity: 1, duration: 0.2, ease: 'power2.out' });
    isAnimating = false;
  }

  async function closeDetails(): Promise<void> {
    if (isAnimating) return;
    isAnimating = true;

    // Fade out scroll content, keep header visible
    await gsap.to(scrollArea, { opacity: 0, duration: 0.12, ease: 'power2.in' });

    // Change content back to summary
    showDetailContent = false;
    await tick();

    // Animate back to base size
    await contractTo(wrapperElement, baseWidth, baseHeight);
    wrapperElement.classList.remove('expanded');
    closeDetailPanel();

    // Clear inline styles from animation
    wrapperElement.style.width = '';
    wrapperElement.style.height = '';

    await gsap.to(scrollArea, { opacity: 1, duration: 0.2, ease: 'power2.out' });
    isAnimating = false;
  }

  function handleClose(): void {
    if ($isDetailOpen) {
      closeDetails();
    } else {
      clearSelection();
    }
  }

  onMount(() => {
    return () => {
      gsap.killTweensOf(contentLayer);
      gsap.killTweensOf(scrollArea);
      gsap.killTweensOf(wrapperElement);
      blobManager?.kill();
    };
  });
</script>

<div
  bind:this={wrapperElement}
  class={`liquid-wrapper${panelHidden ? ' hidden' : ''}`}
>
  <div class="shape-layer">
    <div class="blob-container liquid" bind:this={blobContainer}></div>
  </div>

  <aside class="panel-content-layer" bind:this={contentLayer}>
    <div class="panel-header">
      <span class="panel-title">{panelTitle}</span>
      {#if showCloseButton}
        <button class="panel-close-btn" title="Close" on:click={handleClose}>
          ×
        </button>
      {/if}
    </div>

    <div class="panel-scroll-area" bind:this={scrollArea}>
      <div class="panel-content">
        {#if showDetailContent && detailAvailable && $selectedNode}
          <DetailView node={$selectedNode} />
        {:else if $loadError}
          <p class="panel-placeholder">{$loadError}</p>
        {:else if $selectedNode}
          <SummaryView node={$selectedNode} />
          {#if detailAvailable}
            <button
              class="view-details-link"
              disabled={isAnimating}
              on:click={openDetails}
            >
              Details
            </button>
          {/if}
        {:else if $selectedStage}
          <StageOverview nodes={$selectedStage.nodes} edges={$selectedStage.edges} />
        {:else}
          <p class="panel-placeholder">Select a node to view details</p>
        {/if}
      </div>
    </div>
  </aside>
</div>
