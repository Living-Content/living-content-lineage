<script lang="ts">
  import { onMount } from 'svelte';
  import type { GraphController } from '../services/graph/graphController.js';
  import { createGraphController } from '../services/graph/graphController.js';
  import {
    clearSelection,
    selectedNode,
    selectNode,
    selectStage,
    setLineageData,
  } from '../stores/lineageState.js';
  import {
    setLoadError,
    setLoading,
    setSimpleView,
  } from '../stores/uiState.js';

  let container: HTMLDivElement | null = null;

  onMount(() => {
    let controller: GraphController | null = null;
    let isCancelled = false;

    const unsubscribeSelectedNode = selectedNode.subscribe((node) => {
      if (node === null && controller) {
        controller.clearSelection();
      }
    });

    const start = async () => {
      if (!container || isCancelled) return;
      setLoading(true);
      controller = await createGraphController({
        container,
        manifestUrl: '/data/manifest.json',
        callbacks: {
          onNodeSelect: (nodeData) => {
            selectNode(nodeData);
          },
          onStageSelect: (stageLabel, nodes, edges) => {
            selectStage({ label: stageLabel, nodes, edges });
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
            clearSelection();
          },
        },
      });
      setLoading(false);
    };

    start();

    return () => {
      isCancelled = true;
      unsubscribeSelectedNode();
      controller?.destroy();
    };
  });
</script>

<main class="graph-container">
  <div id="graph-container" bind:this={container}></div>
</main>
