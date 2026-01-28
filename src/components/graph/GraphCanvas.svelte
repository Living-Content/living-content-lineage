<script lang="ts">
  /**
   * GraphCanvas - Owner component for graph rendering.
   *
   * Svelte decides WHEN things happen via edge-triggered $effect blocks.
   * GraphEngine executes deterministically via explicit commands.
   *
   * This component is the ONLY bridge between Svelte stores and the engine.
   * - Reads from stores to detect changes
   * - Passes initial state to bootstrap
   * - Handles engine callbacks by updating stores
   * - Calls engine commands when state changes
   */
  import { onMount } from 'svelte';
  import { activateGraph, type GraphActivationResult } from '../../services/trace/core/activate.js';
  import type { GraphEngine, HoverPayload, SelectionTarget } from '../../services/trace/core/interface.js';
  import { traceState } from '../../stores/traceState.svelte.js';
  import { uiState } from '../../stores/uiState.svelte.js';
  import { commentState } from '../../stores/commentState.svelte.js';
  import { configStore } from '../../stores/configStore.svelte.js';
  import { menuStore } from '../../stores/menuStore.svelte.js';
  import { viewLevel, type ViewLevel } from '../../stores/viewLevel.svelte.js';
  import type { Trace, Phase, TraceNodeData } from '../../config/types.js';
import type { StepData } from '../../stores/traceState.svelte.js';
  import { resolveManifestUrl } from '../../services/manifest/urlResolver.js';
  import { hideStaticLoader } from '../../lib/staticLoader.js';

  interface Props {
    onHover?: (payload: HoverPayload) => void;
    onHoverEnd?: () => void;
  }

  let { onHover, onHoverEnd }: Props = $props();

  let container: HTMLDivElement | null = $state(null);
  let engine: GraphEngine | null = $state(null);

  /**
   * Normalize selection for comparison.
   * Handles object identity issues by converting to a string key.
   */
  const selectionKey = (sel: SelectionTarget): string => {
    if (!sel) return 'none';
    return sel.type === 'node' ? `node:${sel.nodeId}` : `step:${sel.stepId}`;
  };

  // Track previous values for edge-triggered effects
  let prevSelectionKey = $state('none');
  let prevDetailOpen = $state(false);
  let prevPhaseFilter: Phase | null = $state(null);
  let prevIsExpanded = $state(false);
  let prevMenuOpen = $state(false);
  let prevViewLevel: ViewLevel = $state('workflow-detail');

  onMount(() => {
    let isCancelled = false;
    let result: GraphActivationResult | null = null;

    const start = async (): Promise<void> => {
      if (!container || isCancelled) return;

      uiState.setLoading(true);

      // Read initial state from stores and pass to activation
      const initialSelection = traceState.selection as SelectionTarget;
      const initialPhaseFilter = uiState.phaseFilter;
      const initialDetailOpen = uiState.isDetailOpen;
      const initialIsExpanded = traceState.isExpanded;

      result = await activateGraph(
        container,
        resolveManifestUrl(),
        {
          // Engine callbacks - Pixi reports events, Svelte decides policy
          onSimpleViewChange: (simple) => uiState.setSimpleView(simple),
          onViewportChange: (vs) => traceState.updateViewport(vs),
          onViewLevelChange: (level) => {
            // View level changed - collapse expanded node when leaving detail view
            if (level !== 'workflow-detail') {
              traceState.collapseNode();
            }
          },
          onLoaded: (data: unknown) => {
            uiState.setLoadError(null);
            const trace = data as Trace;
            traceState.setTrace(trace);

            // Connect comment system (checks auth internally)
            if (configStore.hasValidConfig() && trace.nodes) {
              const nodeIds = trace.nodes.map((n) => n.id);
              commentState.connect(configStore.workflowId, nodeIds);
            }

            hideStaticLoader();
          },
          onError: (error) => {
            uiState.setLoadError(error.message + (error.details ? `: ${error.details}` : ''));
            traceState.clearSelection();
            hideStaticLoader();
          },
          onHover: onHover ?? (() => {}),
          onHoverEnd: onHoverEnd ?? (() => {}),
          // Selection callbacks - wire Pixi to traceState
          selection: {
            getSelection: () => {
              const sel = traceState.selection;
              if (!sel) return null;
              return sel.type === 'node'
                ? { type: 'node', nodeId: sel.nodeId, data: sel.data }
                : { type: 'step', stepId: sel.stepId, data: sel.data };
            },
            getIsExpanded: () => traceState.isExpanded,
            onExpandNode: (node) => traceState.expandNode(node as TraceNodeData),
            onCollapseNode: () => traceState.collapseNode(),
            onSelectStep: (stepData) => traceState.selectStep(stepData as StepData),
            onClearSelection: () => traceState.clearSelection(),
            onSetOverlayNode: (info) => traceState.setOverlayNode(info),
            onSetExpansionProgress: (progress) => traceState.setExpansionProgress(progress),
            onCollapseRequest: (callback) => traceState.onCollapseRequest(callback),
          },
        },
        {
          // Initial state from stores
          selection: initialSelection,
          phaseFilter: initialPhaseFilter,
          detailPanelOpen: initialDetailOpen,
          isExpanded: initialIsExpanded,
        }
      );

      if (result && !isCancelled) {
        engine = result.engine;

        // Initialize prev values from current state
        prevSelectionKey = selectionKey(traceState.selection as SelectionTarget);
        prevDetailOpen = uiState.isDetailOpen;
        prevPhaseFilter = uiState.phaseFilter;
        prevIsExpanded = traceState.isExpanded;
        prevViewLevel = viewLevel.current;
      }

      uiState.setLoading(false);
    };

    start();

    return () => {
      isCancelled = true;
      engine?.destroy();
    };
  });

  /**
   * Edge-triggered effect for state changes.
   * All state changes flow through a single effect for deterministic ordering.
   */
  $effect(() => {
    if (!engine) return;

    const nextSelection = traceState.selection as SelectionTarget;
    const nextSelectionKey = selectionKey(nextSelection);
    const nextDetailOpen = uiState.isDetailOpen;
    const nextPhaseFilter = uiState.phaseFilter;
    const nextIsExpanded = traceState.isExpanded;
    const nextViewLevel = viewLevel.current;

    // Selection changed?
    if (nextSelectionKey !== prevSelectionKey) {
      engine.setSelection(nextSelection);
      prevSelectionKey = nextSelectionKey;
    }

    // Phase filter changed?
    if (nextPhaseFilter !== prevPhaseFilter) {
      engine.setPhaseFilter(nextPhaseFilter);
      prevPhaseFilter = nextPhaseFilter;
    }

    // Detail panel changed?
    if (nextDetailOpen !== prevDetailOpen) {
      engine.setDetailPanelOpen(nextDetailOpen, prevDetailOpen);
      prevDetailOpen = nextDetailOpen;
    }

    // Expansion state changed?
    if (nextIsExpanded !== prevIsExpanded) {
      engine.setExpanded(nextIsExpanded);
      prevIsExpanded = nextIsExpanded;
    }

    // View level changed?
    if (nextViewLevel !== prevViewLevel) {
      engine.transitionToLevel(nextViewLevel);
      prevViewLevel = nextViewLevel;
    }

    // Menu open state changed? Hide secondary title elements when menu opens
    const nextMenuOpen = menuStore.isOpen;
    if (nextMenuOpen !== prevMenuOpen) {
      engine.setTitleSecondaryVisible(!nextMenuOpen);
      prevMenuOpen = nextMenuOpen;
    }
  });
</script>

<main class="graph-container">
  <div id="graph-container" bind:this={container}></div>
</main>

<style>
  .graph-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
  }

  :global(#graph-container) {
    width: 100%;
    height: 100%;
    background: #050505;
    cursor: grab;
    position: relative;
    z-index: 0;
    overflow: hidden;
  }

  /* Animated gradient blobs */
  :global(#graph-container::before) {
    content: '';
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    pointer-events: none;
    background:
      radial-gradient(ellipse 80% 80% at 30% 40%, rgba(37, 99, 235, 0.5) 0%, transparent 50%),
      radial-gradient(ellipse 70% 70% at 70% 30%, rgba(6, 182, 212, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse 90% 90% at 60% 70%, rgba(236, 72, 153, 0.5) 0%, transparent 50%),
      radial-gradient(ellipse 60% 60% at 40% 60%, rgba(168, 85, 247, 0.4) 0%, transparent 50%);
    animation: drift 60s ease-in-out infinite;
    z-index: 1;
  }

  /* Subtle noise texture */
  :global(#graph-container::after) {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.09;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    z-index: 2;
  }

  @keyframes drift {
    0%, 100% {
      transform: translate(0%, 0%);
    }
    25% {
      transform: translate(25%, -15%);
    }
    50% {
      transform: translate(10%, 20%);
    }
    75% {
      transform: translate(-20%, 5%);
    }
  }

  :global(#graph-container canvas) {
    position: absolute;
    inset: 0;
    z-index: 4;
  }

  :global(#graph-container:active) {
    cursor: grabbing;
  }
</style>
