<script lang="ts">
  /**
   * Detail panel for displaying node and step information.
   * Positioned relative to selected node using world coordinates + viewport state.
   * Position derived reactively - no cached screen coordinates.
   */
  import { fade } from 'svelte/transition';
  import gsap from 'gsap';
  import { traceState } from '../../stores/traceState.svelte.js';
  import { uiState } from '../../stores/uiState.svelte.js';
  import { hasDetailContent } from '../../services/dataviewer/parsing/detailContent.js';
  import { ANIMATION_TIMINGS, GEOMETRY } from '../../config/animationConstants.js';
  import { DETAIL_PANEL_WIDTH } from '../../config/constants.js';
  import PanelHeader from './panel/PanelHeader.svelte';
  import NodeContent from './panel/NodeContent.svelte';
  import StepOverview from './StepOverview.svelte';
  import AttestationPanel from './AttestationPanel.svelte';

  let panelElement = $state<HTMLElement | null>(null);
  let activeTween: gsap.core.Tween | null = null;

  let showDetailContent = $state(false);
  let signatureExpanded = $state(false);

  // Drag state
  let customPosition = $state<{ x: number; y: number } | null>(null);
  let isDragging = $state(false);
  let dragOffset = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mode transition state for smooth fade between compact/detail views
  let isTransitioning = $state(false);
  let visualMode = $state<'compact' | 'detail'>('compact');

  // Derived state
  let isExpanded = $derived(traceState.isExpanded);
  let currentNode = $derived(traceState.isExpanded ? traceState.expandedNode : traceState.selectedNode);
  let currentStep = $derived(traceState.selectedStep);
  let detailAvailable = $derived(currentNode ? hasDetailContent(currentNode) : false);

  // Derive position from world coordinates + viewport - no caching
  let derivedPosition = $derived.by(() => {
    const node = traceState.overlayNode;
    const vs = traceState.viewportState;
    if (!node || !vs) return null;

    // Convert world to screen
    const screenX = node.worldX * vs.scale + vs.x;
    const screenY = node.worldY * vs.scale + vs.y;
    const scaledNodeWidth = node.nodeWidth * vs.scale;

    // Position panel to the LEFT of the node
    const panelRightEdge = screenX - scaledNodeWidth / 2 - GEOMETRY.OVERLAY_GAP;
    const panelLeftEdge = panelRightEdge - DETAIL_PANEL_WIDTH;

    return { x: panelLeftEdge, y: screenY };
  });

  // Use custom position if dragged, otherwise use derived position
  let displayPosition = $derived(customPosition ?? derivedPosition);

  let isVisible = $derived(
    ((!!currentNode || !!currentStep) && displayPosition !== null) || !!uiState.loadError
  );

  // Reset state when selection clears
  $effect(() => {
    if (!traceState.selection) {
      customPosition = null;
      if (showDetailContent) {
        showDetailContent = false;
        visualMode = 'compact';
        uiState.closeDetailPanel();
      }
    }
  });

  function openDetails(): void {
    if (isTransitioning || !panelElement) return;
    isTransitioning = true;

    if (activeTween) activeTween.kill();

    // Fade out → swap content → fade in
    activeTween = gsap.to(panelElement, {
      opacity: 0,
      duration: ANIMATION_TIMINGS.DETAIL_PANEL_FADE_DURATION,
      ease: 'power2.out',
      onComplete: () => {
        showDetailContent = true;
        visualMode = 'detail';
        uiState.setDetailOpen(true);

        activeTween = gsap.to(panelElement, {
          opacity: 1,
          duration: ANIMATION_TIMINGS.DETAIL_PANEL_FADE_DURATION,
          ease: 'power2.out',
          onComplete: () => {
            isTransitioning = false;
            activeTween = null;
          },
        });
      },
    });
  }

  function closeDetails(): void {
    if (isTransitioning || !panelElement) return;
    isTransitioning = true;

    if (activeTween) activeTween.kill();

    // Fade out → swap content → fade in
    activeTween = gsap.to(panelElement, {
      opacity: 0,
      duration: ANIMATION_TIMINGS.DETAIL_PANEL_FADE_DURATION,
      ease: 'power2.out',
      onComplete: () => {
        showDetailContent = false;
        visualMode = 'compact';
        uiState.closeDetailPanel();

        activeTween = gsap.to(panelElement, {
          opacity: 1,
          duration: ANIMATION_TIMINGS.DETAIL_PANEL_FADE_DURATION,
          ease: 'power2.out',
          onComplete: () => {
            isTransitioning = false;
            activeTween = null;
          },
        });
      },
    });
  }

  // Cleanup GSAP tween on unmount
  $effect(() => {
    return () => {
      if (activeTween) {
        activeTween.kill();
        activeTween = null;
      }
    };
  });

  function handleClose(): void {
    if (showDetailContent) {
      closeDetails();
    } else if (isExpanded) {
      traceState.requestCollapse();
    } else {
      traceState.clearSelection();
    }
  }

  function handleDragStart(e: MouseEvent): void {
    if (!displayPosition) return;

    isDragging = true;
    dragOffset = {
      x: e.clientX - displayPosition.x,
      y: e.clientY - displayPosition.y,
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }

  function handleDragMove(e: MouseEvent): void {
    if (!isDragging) return;

    customPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    };
  }

  function handleDragEnd(): void {
    isDragging = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }
</script>

{#if isVisible}
  <div class="panel-container" transition:fade={{ duration: 150 }}>
    <aside
      bind:this={panelElement}
      class="panel"
      class:detail-open={visualMode === 'detail'}
      class:dragging={isDragging}
      style={`--panel-x: ${displayPosition?.x ?? 100}px; --panel-y: ${displayPosition?.y ?? 100}px;`}
    >
      <PanelHeader
        context={{
          phase: currentNode?.phase ?? currentStep?.phase,
          step: currentNode?.step ?? currentStep?.stepId,
          assetType: currentNode?.assetType,
          selectionType: currentNode ? 'node' : currentStep ? 'step' : null,
        }}
        showCloseButton={!!currentNode || !!currentStep}
        {isDragging}
        onClose={handleClose}
        onStartDrag={handleDragStart}
      />

      <div class="panel-scroll-area" class:has-footer={currentNode?.assetManifest?.attestation}>
        <div class="panel-content">
          {#if uiState.loadError}
            <p class="panel-placeholder">{uiState.loadError}</p>
          {:else if currentNode}
            <NodeContent
              node={currentNode}
              {showDetailContent}
              {detailAvailable}
              onOpenDetails={openDetails}
            />
          {:else if currentStep}
            <StepOverview nodes={currentStep.nodes} edges={currentStep.edges} />
          {:else}
            <p class="panel-placeholder">Select a node to view details</p>
          {/if}
        </div>
      </div>

      {#if currentNode?.assetManifest?.attestation}
        <div class="panel-footer" class:expanded={signatureExpanded}>
          <AttestationPanel
            attestation={currentNode.assetManifest.attestation}
            bind:expanded={signatureExpanded}
          />
        </div>
      {/if}
    </aside>
  </div>
{/if}

<style>
  .panel-container {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    pointer-events: none;
  }

  .panel {
    position: absolute;
    left: var(--panel-x);
    top: var(--panel-y);
    transform: translateY(-50%);
    pointer-events: auto;
    width: 360px;
    max-height: calc(100vh - 100px); /* Matches DETAIL_PANEL_MAX_HEIGHT_OFFSET */
    min-height: 100px;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    /* Opacity transitions handled by GSAP */
  }

  .panel.dragging {
    cursor: grabbing;
    user-select: none;
  }

  .panel.detail-open {
    left: var(--space-xl);
    top: calc(var(--header-height) + var(--space-xl));
    transform: none;
    width: calc(50vw - var(--space-xl) * 2);
    max-width: 700px;
    height: calc(100vh - var(--header-height) - var(--space-xl) * 2);
    max-height: none;
  }

  .panel-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--space-xl) var(--space-xl) var(--space-xl);
    min-height: 0;
  }

  .panel-scroll-area.has-footer {
    padding-bottom: 60px;
  }

  .panel-content {
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .panel-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--space-md) var(--space-xl) var(--space-lg) var(--space-xl);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border-soft);
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  }

  .panel-footer.expanded {
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  }

  .panel-placeholder {
    color: var(--color-text-faint);
    font-style: italic;
  }

  @media (max-width: 900px) {
    .panel {
      left: 50%;
      top: auto;
      bottom: var(--space-xl);
      transform: translateX(-50%);
      width: calc(100% - var(--space-xl) * 2);
      max-width: none;
      max-height: 60vh;
    }

    .panel.detail-open {
      left: var(--space-md);
      top: calc(var(--header-height) + var(--space-md));
      bottom: auto;
      transform: none;
      width: calc(100vw - var(--space-md) * 2);
      max-height: calc(100vh - var(--header-height) - var(--space-md) * 2);
    }
  }
</style>
