<script lang="ts">
  // Root shell that wires global layout and loading state.
  import { isLoading } from './stores/uiState.js';
  import Header from './components/Header.svelte';
  import GraphView from './components/GraphView.svelte';
  import SidebarPanel from './components/sidebar/SidebarPanel.svelte';
  import DetailPanel from './components/sidebar/DetailPanel.svelte';
</script>

<div class="app-shell" class:loading={$isLoading}>
  <Header />
  <SidebarPanel />
  <DetailPanel />
  <GraphView />
</div>
