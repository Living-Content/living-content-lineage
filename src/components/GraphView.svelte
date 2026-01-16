<script lang="ts">
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
          onHover: () => {
            // Hover tooltip handled by cursor change in graphController
          },
          onHoverEnd: () => {
            // Hover end handled by cursor change in graphController
          },
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
  <div id="graph-container" bind:this={container}></div>
</main>
