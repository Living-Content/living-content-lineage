<script lang="ts">
  // Root shell that wires global layout and loading state.
  import { isLoading } from './stores/uiState.js';
  import Header from './components/Header.svelte';
  import GraphView from './components/GraphView.svelte';
  import InfoPanel from './components/dataviewer/InfoPanel.svelte';
  import LiquidFilter from './components/LiquidFilter.svelte';
</script>

<LiquidFilter />

<div class="app-shell" class:loading={$isLoading}>
  <Header />
  <InfoPanel />
  <GraphView />
</div>
