<script lang="ts">
  /**
   * Inspector panel for displaying selected node information.
   * Positioned relative to selected node using world coordinates + viewport state.
   */
  import { fade } from 'svelte/transition';
  import gsap from 'gsap';
  import { traceState } from '../../stores/traceState.svelte.js';
  import { uiState } from '../../stores/uiState.svelte.js';
  import { commentState } from '../../stores/commentState.svelte.js';
  import { hasDetailContent } from '../../services/inspector/detailContent.js';
  import { ANIMATION_TIMINGS, GEOMETRY } from '../../config/animation.js';
  import { DETAIL_PANEL_WIDTH } from '../../config/panels.js';
  import InspectorHeader from './InspectorHeader.svelte';
  import InspectorBody from './InspectorBody.svelte';
  import InspectorFooter from './InspectorFooter.svelte';
  import AttestationSection from './sections/AttestationSection.svelte';
  import CommentDrawer from '../comments/CommentDrawer.svelte';
  import { useDrag } from './shared/useDrag.svelte.js';

  let panelElement = $state<HTMLElement | null>(null);
  let activeTween: gsap.core.Tween | null = null;

  let showDetailContent = $state(false);
  let signatureExpanded = $state(false);
  let commentsOpen = $state(false);

  // Drag state
  const drag = useDrag();

  // Mode transition state
  let isTransitioning = $state(false);
  let visualMode = $state<'compact' | 'detail'>('compact');

  // Derived state
  let isExpanded = $derived(traceState.isExpanded);
  let currentNode = $derived(traceState.isExpanded ? traceState.expandedNode : traceState.selectedNode);
  let detailAvailable = $derived(currentNode ? hasDetailContent(currentNode) : false);
  let commentCount = $derived(currentNode ? commentState.getCount(currentNode.id) : 0);

  // Derive position from world coordinates + viewport
  let derivedPosition = $derived.by(() => {
    const node = traceState.overlayNode;
    const vs = traceState.viewportState;
    if (!node || !vs) return null;

    const screenX = node.worldX * vs.scale + vs.x;
    const screenY = node.worldY * vs.scale + vs.y;
    const scaledNodeWidth = node.nodeWidth * vs.scale;
    const panelRightEdge = screenX - scaledNodeWidth / 2 - GEOMETRY.OVERLAY_GAP;
    const panelLeftEdge = panelRightEdge - DETAIL_PANEL_WIDTH;

    return { x: panelLeftEdge, y: screenY };
  });

  let displayPosition = $derived(drag.customPosition ?? derivedPosition);
  let isVisible = $derived((!!currentNode && displayPosition !== null) || !!uiState.loadError);

  // Reset state when selection clears
  $effect(() => {
    if (!traceState.selection) {
      drag.resetPosition();
      commentsOpen = false;
      if (showDetailContent) {
        showDetailContent = false;
        visualMode = 'compact';
        uiState.closeDetailPanel();
      }
    }
  });

  // Load comments when node is selected
  $effect(() => {
    if (currentNode?.id) {
      commentState.loadComments(currentNode.id);
    }
  });

  // Cleanup GSAP tween on unmount
  $effect(() => {
    return () => {
      if (activeTween) {
        activeTween.kill();
        activeTween = null;
      }
    };
  });

  function toggleComments(): void {
    commentsOpen = !commentsOpen;
  }

  function openDetails(): void {
    if (isTransitioning || !panelElement) return;
    isTransitioning = true;
    if (activeTween) activeTween.kill();

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
    drag.startDrag(e, displayPosition);
  }
</script>

{#if isVisible}
  <div class="panel-container" transition:fade={{ duration: 150 }}>
    <aside
      bind:this={panelElement}
      class="panel"
      class:detail-open={visualMode === 'detail'}
      class:dragging={drag.isDragging}
      style={`--panel-x: ${displayPosition?.x ?? 100}px; --panel-y: ${displayPosition?.y ?? 100}px;`}
    >
      <InspectorHeader
        context={{
          phase: currentNode?.phase,
          step: currentNode?.step,
          assetType: currentNode?.assetType,
          selectionType: currentNode ? 'node' : null,
        }}
        showCloseButton={!!currentNode}
        isDragging={drag.isDragging}
        onClose={handleClose}
        onStartDrag={handleDragStart}
      />

      <div class="panel-scroll-area" class:has-footer={currentNode}>
        <InspectorBody
          loadError={uiState.loadError}
          {currentNode}
          {showDetailContent}
          {detailAvailable}
        />
      </div>

      {#if currentNode}
        <InspectorFooter
          showDetailsLink={detailAvailable && !showDetailContent}
          {commentCount}
          {commentsOpen}
          onOpenDetails={openDetails}
          onToggleComments={toggleComments}
        />
      {/if}

      {#if currentNode?.assetManifest?.attestation}
        <div class="panel-footer attestation-footer" class:expanded={signatureExpanded}>
          <AttestationSection
            attestation={currentNode.assetManifest.attestation}
            bind:expanded={signatureExpanded}
          />
        </div>
      {/if}

      {#if currentNode}
        <CommentDrawer nodeId={currentNode.id} bind:isOpen={commentsOpen} />
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
    max-height: calc(100vh - var(--header-height) - var(--panel-margin) - 60px);
    min-height: 100px;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-sm);
    overflow: visible;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .panel.dragging {
    cursor: grabbing;
    user-select: none;
  }

  .panel.detail-open {
    left: var(--panel-margin);
    top: calc(var(--header-height) + var(--panel-margin));
    transform: none;
    width: calc(50vw - var(--panel-margin) * 2);
    max-width: 700px;
    height: calc(100vh - var(--header-height) - var(--panel-margin) * 2);
    max-height: none;
  }

  .panel-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--space-xl) var(--space-xl) var(--space-xl);
    min-height: 0;
  }

  .panel-scroll-area.has-footer {
    padding-bottom: var(--space-md);
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

  .attestation-footer {
    bottom: 52px;
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
