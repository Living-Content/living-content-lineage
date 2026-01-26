<script lang="ts">
  /**
   * Detail panel for displaying node and step information.
   * Positioned relative to selected node, draggable to override.
   */
  import { traceState } from '../../stores/traceState.svelte.js';
  import { uiState } from '../../stores/uiState.svelte.js';
  import { hasDetailContent } from '../../services/dataviewer/parsing/detailContent.js';
  import PanelHeader from './panel/PanelHeader.svelte';
  import NodeContent from './panel/NodeContent.svelte';
  import StepOverview from './StepOverview.svelte';
  import AttestationPanel from './AttestationPanel.svelte';

  let showDetailContent = $state(false);
  let signatureExpanded = $state(false);

  // Drag state
  let customPosition = $state<{ x: number; y: number } | null>(null);
  let isDragging = $state(false);
  let dragOffset = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  // Derived state
  let isExpanded = $derived(traceState.isExpanded);
  let currentNode = $derived(traceState.isExpanded ? traceState.expandedNode : traceState.selectedNode);
  let currentStep = $derived(traceState.selectedStep);
  let detailAvailable = $derived(currentNode ? hasDetailContent(currentNode) : false);
  let basePosition = $derived(traceState.overlayPosition);

  // Use custom position if dragged, otherwise use position from store
  let displayPosition = $derived(
    customPosition ?? (basePosition ? { x: basePosition.x, y: basePosition.y } : null)
  );

  let isVisible = $derived(
    ((!!currentNode || !!currentStep) && displayPosition !== null) || !!uiState.loadError
  );

  // Reset custom position when selection changes
  $effect(() => {
    const selectionKey = traceState.selection
      ? `${traceState.selection.type}:${traceState.selection.type === 'step' ? traceState.selection.stepId : traceState.selection.nodeId}`
      : null;

    if (!selectionKey) {
      customPosition = null;
      if (showDetailContent) {
        showDetailContent = false;
        uiState.closeDetailPanel();
      }
    }
  });

  function openDetails(): void {
    showDetailContent = true;
    uiState.setDetailOpen(true);
  }

  function closeDetails(): void {
    showDetailContent = false;
    uiState.closeDetailPanel();
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
  <div class="panel-container">
    <aside
      class="panel"
      class:detail-open={showDetailContent}
      class:dragging={isDragging}
      style={`--panel-x: ${displayPosition?.x ?? 100}px; --panel-y: ${displayPosition?.y ?? 100}px;`}
    >
      <PanelHeader
        phase={currentNode?.phase ?? currentStep?.phase}
        step={currentNode?.step ?? currentStep?.stepId}
        assetType={currentNode?.assetType}
        showCloseButton={!!currentNode || !!currentStep}
        isNodeSelected={!!currentNode}
        isStepSelected={!!currentStep}
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
    max-height: calc(100vh - 100px);
    min-height: 100px;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    animation: panel-fade-in 0.2s ease-out;
    transition: width 0.3s ease, max-height 0.3s ease, left 0.3s ease, top 0.3s ease;
  }

  .panel.dragging {
    cursor: grabbing;
    user-select: none;
    transition: none;
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

  @keyframes panel-fade-in {
    from {
      opacity: 0;
      transform: translateY(-50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
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
