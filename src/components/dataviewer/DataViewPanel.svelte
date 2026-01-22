<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { clearSelection, selectedNode, selectedStep } from '../../stores/traceState.js';
  import { isDetailOpen, loadError, setDetailOpen, closeDetailPanel } from '../../stores/uiState.js';
  import { hasDetailContent } from '../../services/dataviewer/parsing/detailContent.js';
  import { createDragHandler } from '../../services/dataviewer/interaction/dragHandler.js';
  import { createAnimationOrchestrator } from '../../services/dataviewer/animation/animationOrchestrator.js';
  import PanelHeader from './panel/PanelHeader.svelte';
  import NodeContent from './panel/NodeContent.svelte';
  import StepOverview from './StepOverview.svelte';
  import AttestationPanel from './AttestationPanel.svelte';

  let wrapperElement: HTMLElement;
  let contentLayer: HTMLElement;
  let scrollArea: HTMLElement;
  let blobContainer: HTMLElement;
  let showDetailContent = false;
  let wasHidden = true;
  let signatureExpanded = false;

  let isDragging = false;
  let panelX: number | null = null;
  let panelY: number | null = null;

  const dragHandler = createDragHandler({
    onPositionChange: (x, y) => {
      panelX = x;
      panelY = y;
    },
    onDragStart: () => { isDragging = true; },
    onDragEnd: () => { isDragging = false; },
  });

  const animationOrchestrator = createAnimationOrchestrator(() => {
    if (!wrapperElement || !contentLayer || !scrollArea || !blobContainer) return null;
    return { wrapper: wrapperElement, contentLayer, scrollArea, blobContainer };
  });

  $: detailAvailable = $selectedNode ? hasDetailContent($selectedNode) : false;
  $: panelHidden = !$selectedNode && !$selectedStep && !$loadError;
  $: showCloseButton = !!$selectedNode || !!$selectedStep;

  $: if (!panelHidden && wasHidden && wrapperElement) {
    handleEntrance();
  }

  $: if (panelHidden) {
    wasHidden = true;
  }

  async function handleEntrance(): Promise<void> {
    wasHidden = false;
    await tick();
    animationOrchestrator.animateEntrance();
  }

  function resetPosition(): void {
    if (!wrapperElement) return;
    wrapperElement.style.left = '';
    wrapperElement.style.top = '';
    wrapperElement.style.transform = '';
    panelX = null;
    panelY = null;
  }

  async function openDetails(): Promise<void> {
    if (animationOrchestrator.isAnimating()) return;

    await animationOrchestrator.openDetails(() => {
      showDetailContent = true;
      setDetailOpen(true);
    }, resetPosition);
  }

  async function closeDetails(): Promise<void> {
    if (animationOrchestrator.isAnimating()) return;

    await animationOrchestrator.closeDetails(() => {
      showDetailContent = false;
      closeDetailPanel();
    }, resetPosition);
  }

  function handleClose(): void {
    if ($isDetailOpen) {
      closeDetails();
    } else {
      clearSelection();
    }
  }

  function handleStartDrag(e: MouseEvent): void {
    if (animationOrchestrator.isAnimating() || $isDetailOpen || dragHandler.isMobile()) return;
    dragHandler.startDrag(e, wrapperElement);
  }

  onMount(() => {
    return () => {
      animationOrchestrator.killAll();
      dragHandler.destroy();
    };
  });
</script>

<div
  bind:this={wrapperElement}
  class="liquid-wrapper"
  class:hidden={panelHidden}
  class:dragging={isDragging}
  class:dragged={panelX !== null || panelY !== null}
  class:detail-open={$isDetailOpen}
>
  <div class="shape-layer">
    <div class="blob-container" bind:this={blobContainer}></div>
  </div>

  <aside class="panel-content-layer" bind:this={contentLayer}>
    <PanelHeader
      phase={$selectedNode?.phase ?? $selectedStep?.phase}
      step={$selectedNode?.step ?? $selectedStep?.stepId}
      assetType={$selectedNode?.assetType}
      {showCloseButton}
      isNodeSelected={!!$selectedNode}
      isStepSelected={!!$selectedStep}
      {isDragging}
      onClose={handleClose}
      onStartDrag={handleStartDrag}
    />

    <div class="panel-scroll-area" class:has-footer={$selectedNode?.assetManifest?.attestation} bind:this={scrollArea}>
      <div class="panel-content">
        {#if $loadError}
          <p class="panel-placeholder">{$loadError}</p>
        {:else if $selectedNode}
          <NodeContent
            node={$selectedNode}
            {showDetailContent}
            {detailAvailable}
            onOpenDetails={openDetails}
          />
        {:else if $selectedStep}
          <StepOverview nodes={$selectedStep.nodes} edges={$selectedStep.edges} />
        {:else}
          <p class="panel-placeholder">Select a node to view details</p>
        {/if}
      </div>
    </div>

    {#if $selectedNode?.assetManifest?.attestation}
      <div class="panel-footer" class:expanded={signatureExpanded}>
        <AttestationPanel
          attestation={$selectedNode.assetManifest.attestation}
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

  .liquid-wrapper.detail-open {
    z-index: 100;
    left: var(--panel-margin);
    top: calc(var(--header-height) + var(--panel-margin) * 2);
    transform: none;
    width: calc(50vw - var(--panel-margin) * 2);
    max-width: var(--panel-max-width);
    height: calc(100vh - var(--header-height) - var(--panel-margin) * 3);
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

  .liquid-wrapper:global(.solid) {
    background: rgb(255, 255, 255);
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

  .liquid-wrapper.detail-open :global(.panel-header) {
    cursor: default;
  }

  .liquid-wrapper.dragging {
    user-select: none;
  }

  .panel-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 20px 20px;
    width: 0;
    min-width: 100%;
  }

  .panel-scroll-area.has-footer {
    padding-bottom: 60px;
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

  .panel-content {
    font-size: 13px;
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 12px);
  }

  .panel-placeholder {
    color: var(--color-text-faint);
    font-style: italic;
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

    .liquid-wrapper :global(.panel-header) {
      cursor: default;
    }
  }
</style>
