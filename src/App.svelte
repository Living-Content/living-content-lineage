<script lang="ts">
  import { uiState } from './stores/uiState.svelte.js';
  import Header from './components/Header.svelte';
  import GraphView from './components/graph/GraphView.svelte';
  import DataViewPanel from './components/dataviewer/DataViewPanel.svelte';
  import LiquidFilter from './components/dataviewer/LiquidFilter.svelte';
</script>

<LiquidFilter />

<div class="app-shell" class:loading={uiState.isLoading}>
  <Header />
  <DataViewPanel />
  <GraphView />
</div>
