<script lang="ts">
  // Sidebar panel with liquid blob background.
  import { onMount, tick } from 'svelte';
  import gsap from 'gsap';
  import { clearSelection, selectedNode, selectedStage } from '../../stores/lineageState.js';
  import { isDetailOpen, loadError, setDetailOpen, closeDetailPanel } from '../../stores/uiState.js';
  import { hasDetailContent } from '../../services/sidebar/detailContent.js';
  import { createBlobManager, type BlobManager } from '../../services/liquidBlobs.js';
  import {
    PANEL_MARGIN,
    PANEL_MIN_EXPANDED_WIDTH,
    PANEL_MIN_EXPANDED_HEIGHT,
    MOBILE_BREAKPOINT,
  } from '../../config/constants.js';
  import ContextBadges from './detail/ContextBadges.svelte';
  import MetricCard from './detail/MetricCard.svelte';
  import CardGrid from './detail/CardGrid.svelte';
  import SummaryView from './SummaryView.svelte';
  import StageOverview from './StageOverview.svelte';
  import DetailView from './DetailView.svelte';
  import SignaturePanel from './SignaturePanel.svelte';

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
  let signatureExpanded = false;

  // Drag state
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let panelX: number | null = null;
  let panelY: number | null = null;


  $: detailAvailable = $selectedNode ? hasDetailContent($selectedNode) : false;

  // Badge data for header
  $: nodePhase = $selectedNode?.phase;
  $: nodeStage = $selectedNode?.stage;
  $: nodeAssetType = $selectedNode?.assetType;
  $: stageLabel = $selectedStage?.label;
  $: panelHidden = !$selectedNode && !$selectedStage && !$loadError;
  $: showCloseButton = $selectedNode || $selectedStage;

  // Shared header card data
  $: titleDisplay = $selectedNode?.title ?? $selectedNode?.label ?? '';
  $: descriptionDisplay = $selectedNode?.description ?? $selectedNode?.assetManifest?.content?.description ?? '';
  $: tokens = $selectedNode?.tokens;
  $: tokensDisplay = tokens ? (tokens.input + tokens.output).toLocaleString() : null;
  $: durationDisplay = $selectedNode?.duration ?? null;
  $: hasSecondaryMetric = (nodeAssetType === 'Model' && tokensDisplay) ||
                          ((nodeAssetType === 'Code' || nodeAssetType === 'Action') && durationDisplay);

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
    timeline?.to(contentLayer, { opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.5');
  }

  async function openDetails(): Promise<void> {
    if (isAnimating) return;
    isAnimating = true;

    // Fade out scroll content
    await gsap.to(scrollArea, { opacity: 0, duration: 0.12, ease: 'power2.in' });

    // Change content and set detail open (CSS handles sizing)
    showDetailContent = true;
    setDetailOpen(true);

    // Clear inline styles so CSS takes over
    wrapperElement.style.left = '';
    wrapperElement.style.top = '';
    wrapperElement.style.transform = '';
    panelX = null;
    panelY = null;

    await tick();
    await gsap.to(scrollArea, { opacity: 1, duration: 0.2, ease: 'power2.out' });
    isAnimating = false;
  }

  async function closeDetails(): Promise<void> {
    if (isAnimating) return;
    isAnimating = true;

    // Fade out scroll content
    await gsap.to(scrollArea, { opacity: 0, duration: 0.12, ease: 'power2.in' });

    // Change content back to summary and close detail (CSS handles sizing/centering)
    showDetailContent = false;
    closeDetailPanel();

    // Clear any inline styles - let CSS handle positioning
    wrapperElement.style.left = '';
    wrapperElement.style.top = '';
    wrapperElement.style.transform = '';
    panelX = null;
    panelY = null;

    await tick();
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
    return window.innerWidth <= MOBILE_BREAKPOINT;
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
    const maxX = window.innerWidth - PANEL_MIN_EXPANDED_WIDTH - PANEL_MARGIN;
    const minY = PANEL_MARGIN;
    const maxY = window.innerHeight - PANEL_MIN_EXPANDED_HEIGHT - PANEL_MARGIN;

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
      <div class="panel-header-content">
        {#if $selectedNode}
          <ContextBadges phase={nodePhase} stage={nodeStage} assetType={nodeAssetType} />
        {:else if $selectedStage}
          <span class="panel-title">{stageLabel}</span>
        {:else}
          <span class="panel-title">CONTEXT</span>
        {/if}
      </div>
      {#if showCloseButton}
        <button class="panel-close-btn" title="Close" on:click|stopPropagation={handleClose} on:mousedown|stopPropagation>
          ×
        </button>
      {/if}
    </div>

    <div class="panel-scroll-area" bind:this={scrollArea}>
      <div class="panel-content">
        {#if $loadError}
          <p class="panel-placeholder">{$loadError}</p>
        {:else if $selectedNode}
          <!-- Shared header for all node views -->
          <div class="node-header">
            <h2 class="node-title">{titleDisplay}</h2>
            {#if descriptionDisplay}
              <p class="node-description">{descriptionDisplay}</p>
            {/if}
          </div>

          <!-- Metric cards grid -->
          {#if hasSecondaryMetric}
            <CardGrid>
              {#if nodeAssetType === 'Model' && tokensDisplay}
                <MetricCard
                  value={tokensDisplay}
                  label="Tokens"
                  span={2}
                />
              {:else if (nodeAssetType === 'Code' || nodeAssetType === 'Action') && durationDisplay}
                <MetricCard
                  value={durationDisplay}
                  label="Duration"
                  span={2}
                />
              {/if}
            </CardGrid>
          {/if}

          {#if showDetailContent && detailAvailable}
            <DetailView node={$selectedNode} />
          {:else}
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
          {/if}
        {:else if $selectedStage}
          <StageOverview nodes={$selectedStage.nodes} edges={$selectedStage.edges} />
        {:else}
          <p class="panel-placeholder">Select a node to view details</p>
        {/if}
      </div>
    </div>

    {#if $selectedNode?.assetManifest?.signatureInfo}
      <div class="panel-footer" class:expanded={signatureExpanded}>
        <SignaturePanel
          signatureInfo={$selectedNode.assetManifest.signatureInfo}
          bind:expanded={signatureExpanded}
        />
      </div>
    {/if}
  </aside>
</div>

<style>
  .liquid-wrapper {
    position: fixed;
    top: 50%;
    left: var(--panel-margin);
    transform: translateY(-50%);
    z-index: 10;
    width: max-content;
    min-width: 320px;
  }

  .liquid-wrapper.dragged {
    /* Position is set via inline styles */
  }

  .liquid-wrapper.detail-open {
    z-index: 100;
    left: var(--panel-margin);
    top: var(--header-height);
    transform: none;
    width: calc(50vw - var(--panel-margin) * 2);
    max-width: var(--panel-max-width);
    height: calc(100vh - var(--header-height) - var(--panel-margin));
  }

  .liquid-wrapper.detail-open .panel-header {
    cursor: default;
  }

  .liquid-wrapper.hidden {
    display: none;
  }

  .shape-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: 12px;
  }

  :global(.blob-container) {
    position: absolute;
    inset: -20px;
  }

  :global(.liquid-blob) {
    position: absolute;
    background: rgba(255, 255, 255, 0.75);
    border-radius: 50%;
  }

  .panel-content-layer {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100px;
    max-height: calc(100vh - var(--header-height) - var(--panel-margin));
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 16px 12px 16px;
    flex-shrink: 0;
    cursor: grab;
    user-select: none;
    gap: 12px;
  }

  .panel-header-content {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .liquid-wrapper.dragging .panel-header {
    cursor: grabbing;
  }

  .liquid-wrapper.dragging {
    user-select: none;
  }

  .panel-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 60px 20px;
    width: 0;
    min-width: 100%;
  }

  .panel-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--space-md) var(--space-xl) var(--space-lg) var(--space-xl);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border-soft);
    border-radius: 0 0 12px 12px;
  }

  .panel-footer.expanded {
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  }

  .panel-title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
  }

  .panel-close-btn {
    background: none;
    border: none;
    color: var(--color-text-light);
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: var(--radius-full, 9999px);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease, opacity 0.15s ease;
    opacity: 0.5;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .panel-close-btn:hover,
  .panel-close-btn:focus,
  .panel-close-btn:active {
    background: none;
    color: var(--color-text-primary);
    opacity: 1;
    outline: none;
    box-shadow: none;
  }

  .panel-content {
    font-size: 13px;
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 12px);
  }

  .node-header {
    margin-bottom: var(--space-xs, 4px);
  }

  .node-title {
    font-size: var(--font-size-heading, 18px);
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: var(--letter-spacing-tight, -0.02em);
    color: var(--color-text-primary);
    margin: 0;
    line-height: var(--line-height-snug, 1.3);
  }

  .node-description {
    font-size: var(--font-size-small, 12px);
    color: var(--color-text-secondary);
    margin: var(--space-xs, 4px) 0 0 0;
    line-height: 1.4;
  }

  .panel-placeholder {
    color: var(--color-text-faint);
    font-style: italic;
  }

  .view-details-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 20px;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .view-details-link:hover {
    color: var(--color-text-primary);
  }

  .view-details-link::after {
    content: '\2194';
    font-size: 14px;
    transition: transform 0.15s ease;
    display: inline-block;
    transform: rotate(-45deg);
  }

  .view-details-link:hover::after {
    transform: rotate(-45deg) scale(1.05);
  }

  @media (max-width: 900px) {
    .liquid-wrapper {
      left: var(--panel-margin-mobile);
      bottom: var(--panel-margin-mobile);
      top: auto;
      transform: none;
      width: calc(100% - var(--panel-margin-mobile) * 2);
    }

    .liquid-wrapper.detail-open {
      top: auto;
      left: var(--panel-margin-mobile);
      width: calc(100% - var(--panel-margin-mobile) * 2);
      max-width: none;
      height: calc(100vh - var(--header-height) - var(--panel-margin-mobile));
    }

    .panel-content-layer {
      max-height: 40vh;
    }

    .liquid-wrapper.detail-open .panel-content-layer {
      max-height: calc(100vh - var(--header-height) - var(--panel-margin-mobile));
    }

    .panel-header {
      cursor: default;
    }
  }
</style>
