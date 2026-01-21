<script lang="ts">
  import { onMount } from 'svelte';
  import type { GraphController } from '../../services/graph/layout/graphController.js';
  import { createGraphController } from '../../services/graph/layout/graphController.js';
  import { clearSelection, setLineageData } from '../../stores/lineageState.js';
  import { setLoadError, setLoading, setSimpleView } from '../../stores/uiState.js';
  import { resolveManifestUrl } from '../../services/manifest/urlResolver.js';
  import PhaseFilterBadge from '../PhaseFilterBadge.svelte';

  let container: HTMLDivElement | null = null;

  onMount(() => {
    let controller: GraphController | null = null;
    let isCancelled = false;

    const start = async () => {
      if (!container || isCancelled) return;
      setLoading(true);
      controller = await createGraphController({
        container,
        manifestUrl: resolveManifestUrl(),
        callbacks: {
          onSimpleViewChange: (simple) => setSimpleView(simple),
          onHover: () => {},
          onHoverEnd: () => {},
          onLoaded: (data) => {
            setLoadError(null);
            setLineageData(data);
          },
          onError: (error) => {
            setLoadError(error.message + (error.details ? `: ${error.details}` : ''));
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
  <PhaseFilterBadge />
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
