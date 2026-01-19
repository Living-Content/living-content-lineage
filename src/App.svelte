<script lang="ts">
  // Root shell that wires global layout and loading state.
  import { isLoading } from './stores/uiState.js';
  import Header from './components/Header.svelte';
  import GraphView from './components/graph/GraphView.svelte';
  import DataViewPanel from './components/dataviewer/DataViewPanel.svelte';
  import LiquidFilter from './components/dataviewer/LiquidFilter.svelte';
</script>

<LiquidFilter />

<div class="app-shell" class:loading={$isLoading}>
  <Header />
  <DataViewPanel />
  <GraphView />
</div>
