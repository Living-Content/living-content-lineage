<script lang="ts">
  // Sidebar panel with liquid blob background.
  // Container sizes instantly, then blobs animate outward like expanding foam.
  import { onMount, tick } from 'svelte';
  import gsap from 'gsap';
  import { clearSelection, selectedNode, selectedStage } from '../../stores/lineageState.js';
  import { isDetailOpen, loadError, setDetailOpen, closeDetailPanel } from '../../stores/uiState.js';
  import { hasDetailContent } from '../../services/sidebar/detailContent.js';
  import {
    fillWithAnimatedBlobs,
    expandBlobsToFill,
    contractBlobsToFit,
  } from '../../services/liquidBlobs.js';
  import SummaryView from './SummaryView.svelte';
  import StageOverview from './StageOverview.svelte';
  import DetailView from './DetailView.svelte';

  let wrapperElement: HTMLElement;
  let contentLayer: HTMLElement;
  let blobContainer: HTMLElement;
  let isAnimating = false;
  let showDetailContent = false;
  let wasHidden = true;
  let currentBlobTimeline: gsap.core.Timeline | null = null;

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

  function animateBlobsIn(): gsap.core.Timeline | null {
    if (!blobContainer || !wrapperElement) return null;

    // Kill any running blob animation
    if (currentBlobTimeline) {
      currentBlobTimeline.kill();
    }

    const width = wrapperElement.offsetWidth;
    const height = wrapperElement.offsetHeight;

    // Scaling is automatic based on container size
    currentBlobTimeline = fillWithAnimatedBlobs(
      blobContainer,
      width,
      height,
      {},
      { ease: 'elastic.out(1, 0.6)' }
    );

    return currentBlobTimeline;
  }

  async function animateEntrance(): Promise<void> {
    wasHidden = false;
    await tick();

    // Start with content hidden
    gsap.set(contentLayer, { opacity: 0 });

    // Animate blobs expanding outward, then fade in content
    const timeline = animateBlobsIn();
    if (timeline) {
      timeline.then(() => {
        gsap.to(contentLayer, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      });
    } else {
      gsap.to(contentLayer, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    }
  }

  function openDetails(): void {
    if (isAnimating) return;
    isAnimating = true;

    // Fade out content
    gsap.to(contentLayer, {
      opacity: 0,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => {
        showDetailContent = true;
        wrapperElement.classList.add('expanded');
        setDetailOpen(true);

        tick().then(() => {
          const newWidth = wrapperElement.offsetWidth;
          const newHeight = wrapperElement.offsetHeight;

          // Expand existing blobs to fill larger container
          currentBlobTimeline = expandBlobsToFill(
            blobContainer,
            newWidth,
            newHeight,
            { ease: 'elastic.out(1, 0.6)' }
          );

          // Fade in content after blobs finish expanding
          currentBlobTimeline.then(() => {
            gsap.to(contentLayer, {
              opacity: 1,
              duration: 0.25,
              ease: 'power2.out',
              onComplete: () => { isAnimating = false; },
            });
          });
        });
      },
    });
  }

  function closeDetails(): void {
    if (isAnimating) return;
    isAnimating = true;

    // Fade out content
    gsap.to(contentLayer, {
      opacity: 0,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => {
        showDetailContent = false;
        wrapperElement.classList.remove('expanded');
        closeDetailPanel();

        tick().then(() => {
          const newWidth = wrapperElement.offsetWidth;
          const newHeight = wrapperElement.offsetHeight;

          // Contract blobs to fit smaller container
          currentBlobTimeline = contractBlobsToFit(
            blobContainer,
            newWidth,
            newHeight
          );

          // Fade in content after blobs finish contracting
          currentBlobTimeline.then(() => {
            gsap.to(contentLayer, {
              opacity: 1,
              duration: 0.25,
              ease: 'power2.out',
              onComplete: () => { isAnimating = false; },
            });
          });
        });
      },
    });
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
      if (currentBlobTimeline) {
        currentBlobTimeline.kill();
      }
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
  </aside>
</div>
