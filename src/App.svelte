<script lang="ts">
  import { uiState } from './stores/uiState.svelte.js';
  import Header from './components/Header.svelte';
  import GraphCanvas from './components/graph/GraphCanvas.svelte';
  import DetailPanel from './components/dataviewer/DetailPanel.svelte';
</script>

<div class="app-shell" class:loading={uiState.isLoading}>
  <Header />
  <DetailPanel />
  <GraphCanvas />
</div>
