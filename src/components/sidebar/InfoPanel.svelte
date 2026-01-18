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

  // Drag state
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let panelX: number | null = null;
  let panelY: number | null = null;

  // Position before expanding (to restore on contract)
  let preExpandX: number | null = null;
  let preExpandY: number | null = null;

  // Panel margin and minimum expanded dimensions
  const PANEL_MARGIN = 25;
  const MIN_EXPANDED_WIDTH = 500;
  const MIN_EXPANDED_HEIGHT = 300;

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

    // Store position on first load
    const rect = wrapperElement.getBoundingClientRect();
    panelX = rect.left;
    panelY = rect.top;

    const timeline = blobManager?.fill(baseWidth, baseHeight, 'elastic.out(1, 0.6)');
    timeline?.to(contentLayer, { opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.5');
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

    // Save position before expanding
    preExpandX = panelX;
    preExpandY = panelY;

    // Lock to pixel position for animation
    wrapperElement.style.left = `${panelX}px`;
    wrapperElement.style.top = `${panelY}px`;
    wrapperElement.style.transform = 'none';

    // Fixed target: full screen with margins
    const targetX = PANEL_MARGIN;
    const targetY = PANEL_MARGIN;
    const targetWidth = window.innerWidth - PANEL_MARGIN * 2;
    const targetHeight = window.innerHeight - PANEL_MARGIN * 2;

    // Animate position AND size to target
    await gsap.to(wrapperElement, {
      left: targetX,
      top: targetY,
      width: targetWidth,
      height: targetHeight,
      duration: 0.2,
      ease: 'back.out(1)'
    });
    panelX = targetX;
    panelY = targetY;
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

    // Animate back to pre-expand position and size
    await gsap.to(wrapperElement, {
      left: preExpandX,
      top: preExpandY,
      width: baseWidth,
      height: baseHeight,
      duration: 0.2,
      ease: 'back.out(1)'
    });
    closeDetailPanel();

    // Restore position state
    panelX = preExpandX;
    panelY = preExpandY;
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

  function isMobile(): boolean {
    return window.innerWidth <= 900;
  }

  function startDrag(e: MouseEvent): void {
    if (isAnimating || $isDetailOpen || isMobile()) return;
    isDragging = true;

    const rect = wrapperElement.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    // Initialize position from current visual position
    panelX = rect.left;
    panelY = rect.top;
    wrapperElement.style.left = `${rect.left}px`;
    wrapperElement.style.top = `${rect.top}px`;
    wrapperElement.style.transform = 'none';

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  }

  function onDrag(e: MouseEvent): void {
    if (!isDragging || !wrapperElement) return;

    // Constrain so expanded panel has minimum usable size
    const minX = PANEL_MARGIN;
    const maxX = window.innerWidth - MIN_EXPANDED_WIDTH - PANEL_MARGIN;
    const minY = PANEL_MARGIN;
    const maxY = window.innerHeight - MIN_EXPANDED_HEIGHT - PANEL_MARGIN;

    const newX = Math.max(minX, Math.min(maxX, e.clientX - dragOffsetX));
    const newY = Math.max(minY, Math.min(maxY, e.clientY - dragOffsetY));

    // Directly set styles during drag for immediate feedback
    wrapperElement.style.left = `${newX}px`;
    wrapperElement.style.top = `${newY}px`;
    wrapperElement.style.transform = 'none';

    panelX = newX;
    panelY = newY;
  }

  function stopDrag(): void {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  onMount(() => {
    return () => {
      gsap.killTweensOf(contentLayer);
      gsap.killTweensOf(scrollArea);
      gsap.killTweensOf(wrapperElement);
      blobManager?.kill();
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
    };
  });
</script>

<div
  bind:this={wrapperElement}
  class={`liquid-wrapper${panelHidden ? ' hidden' : ''}${isDragging ? ' dragging' : ''}${panelX !== null ? ' dragged' : ''}${$isDetailOpen ? ' detail-open' : ''}`}
>
  <div class="shape-layer">
    <div class="blob-container" bind:this={blobContainer}></div>
  </div>

  <aside class="panel-content-layer" bind:this={contentLayer}>
    <div class="panel-header" on:mousedown={startDrag} role="presentation">
      <span class="panel-title">{panelTitle}</span>
      {#if showCloseButton}
        <button class="panel-close-btn" title="Close" on:click|stopPropagation={handleClose} on:mousedown|stopPropagation>
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
