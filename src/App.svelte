<script lang="ts">
  import { onMount } from 'svelte';
  import { uiState } from './stores/uiState.svelte.js';
  import { menuStore } from './stores/menuStore.svelte.js';
  import { configStore } from './stores/configStore.svelte.js';
  import { authService } from './lib/auth/authService.js';
  import Header from './components/Header.svelte';
  import GraphCanvas from './components/graph/GraphCanvas.svelte';
  import DetailPanel from './components/dataviewer/DetailPanel.svelte';
  import Menu from './components/menu/Menu.svelte';

  let authReady = $state(false);

  onMount(async () => {
    // Initialize config from URL params
    configStore.init();

    // Initialize auth after config (must complete before graph loads)
    if (configStore.hasValidConfig()) {
      await authService.init();
    }

    authReady = true;
  });
</script>

<div class="app-shell" class:loading={uiState.isLoading}>
  <Header />
  <DetailPanel />
  {#if authReady}
    <GraphCanvas />
  {/if}

  {#if menuStore.isOpen}
    <Menu />
  {/if}
</div>
