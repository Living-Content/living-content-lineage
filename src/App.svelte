<script lang="ts">
  import { onMount } from 'svelte';
  import { uiState } from './stores/uiState.svelte.js';
  import { menuStore } from './stores/menuStore.svelte.js';
  import { configStore } from './stores/configStore.svelte.js';
  import { authService } from './lib/auth/authService.js';
  import Header from './components/Header.svelte';
  import GraphCanvas from './components/graph/GraphCanvas.svelte';
  import InspectorPanel from './components/inspector/InspectorPanel.svelte';
  import Menu from './components/menu/Menu.svelte';
  import ReplayActionBar from './components/replay/ReplayActionBar.svelte';

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

  function handleReplayComplete(workflowId: string): void {
    // Navigate to the new branch workflow
    const { apiUrl } = configStore.current;
    if (apiUrl) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('workflowId', workflowId);
      window.location.href = newUrl.toString();
    }
  }
</script>

<div class="app-shell" class:loading={uiState.isLoading}>
  <Header />
  <InspectorPanel />
  {#if authReady}
    <GraphCanvas />
  {/if}

  {#if menuStore.isOpen}
    <Menu />
  {/if}

  <ReplayActionBar onReplayComplete={handleReplayComplete} />
</div>
