<script lang="ts">
  import { onMount } from 'svelte';
  import { uiState } from './stores/uiState.svelte.js';
  import { menuStore } from './stores/menuStore.svelte.js';
  import { configStore } from './stores/configStore.svelte.js';
  import { authStore } from './stores/authStore.svelte.js';
  import { authService } from './lib/auth/authService.js';
  import { setLoaderStatus } from './lib/staticLoader.js';
  import Header from './components/Header.svelte';
  import GraphCanvas from './components/graph/GraphCanvas.svelte';
  import InspectorPanel from './components/inspector/InspectorPanel.svelte';
  import Menu from './components/menu/Menu.svelte';
  import ReplayActionBar from './components/replay/ReplayActionBar.svelte';
  import SessionExpiredModal from './components/SessionExpiredModal.svelte';
  import Toast from './components/Toast.svelte';

  let authReady = $state(false);
  let showSessionModal = $state(false);

  function handleSessionRecovered() {
    showSessionModal = false;
    authReady = true;
    setLoaderStatus('Content');
  }

  onMount(async () => {
    configStore.init();

    if (configStore.hasValidConfig()) {
      await authService.init();
    }

    if (authStore.isSessionEnded) {
      showSessionModal = true;
    } else {
      authReady = true;
      setLoaderStatus('Content');
    }
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

  {#if showSessionModal}
    <SessionExpiredModal onRecovered={handleSessionRecovered} />
  {/if}

  <ReplayActionBar onReplayComplete={handleReplayComplete} />

  <Toast />
</div>
