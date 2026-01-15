<script lang="ts">
  // Graph viewport that initializes Sigma and handles overlays/hover.
  import { onMount } from 'svelte';
  import type { GraphController } from '../services/graph/graphController.js';
  import { createGraphController } from '../services/graph/graphController.js';
  import {
    clearSelection,
    selectNode,
    selectStage,
    setLineageData,
  } from '../stores/lineageState.js';
  import {
    closeDetailPanel,
    setLoadError,
    setLoading,
    setSimpleView,
  } from '../stores/uiState.js';

  let container: HTMLDivElement | null = null;
  let tooltip: HTMLDivElement | null = null;
  let tooltipTitle: HTMLDivElement | null = null;
  let tooltipType: HTMLDivElement | null = null;

  function showTooltip(payload: {
    title: string;
    nodeType: string;
    screenX: number;
    screenY: number;
    size: number;
  }): void {
    if (!tooltip || !tooltipTitle || !tooltipType) return;
    tooltipTitle.textContent = payload.title;
    tooltipType.textContent = payload.nodeType;
    tooltip.style.left = `${payload.screenX}px`;
    tooltip.style.top = `${payload.screenY - payload.size - 12}px`;
    tooltip.classList.add('visible');
  }

  function hideTooltip(): void {
    tooltip?.classList.remove('visible');
  }

  onMount(() => {
    let controller: GraphController | null = null;
    let isCancelled = false;

    const start = async () => {
      if (!container || isCancelled) return;
      setLoading(true);
      controller = await createGraphController({
        container,
        manifestUrl: '/data/manifest.json',
        callbacks: {
          onNodeSelect: (nodeData) => {
            closeDetailPanel();
            selectNode(nodeData);
          },
          onStageSelect: (stageLabel, nodes, edges) => {
            closeDetailPanel();
            selectStage({ label: stageLabel, nodes, edges });
          },
          onSelectionClear: () => {
            closeDetailPanel();
            clearSelection();
          },
          onSimpleViewChange: (simple) => setSimpleView(simple),
          onHover: showTooltip,
          onHoverEnd: hideTooltip,
          onLoaded: (data) => {
            setLoadError(null);
            setLineageData(data);
          },
          onError: (message) => {
            setLoadError(message);
            closeDetailPanel();
            clearSelection();
          },
        },
      });
      setLoading(false);
    };

    start();

    return () => {
      isCancelled = true;
      controller?.destroy();
    };
  });
</script>

<main class="graph-container">
  <div id="sigma-container" bind:this={container}></div>
  <div class="stage-labels" id="stage-labels"></div>
  <div class="edge-overlay" id="edge-overlay"></div>
  <div class="icon-overlay" id="icon-overlay"></div>
  <div class="node-hover-tooltip" id="node-hover-tooltip" bind:this={tooltip}>
    <div class="tooltip-title" bind:this={tooltipTitle}></div>
    <div class="tooltip-type" bind:this={tooltipType}></div>
  </div>
</main>
