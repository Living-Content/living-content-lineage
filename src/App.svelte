<script lang="ts">
  import { uiState } from './stores/uiState.svelte.js';
  import Header from './components/Header.svelte';
  import GraphView from './components/graph/GraphView.svelte';
  import DetailPanel from './components/dataviewer/DetailPanel.svelte';
</script>

<div class="app-shell" class:loading={uiState.isLoading}>
  <Header />
  <DetailPanel />
  <GraphView />
</div>
