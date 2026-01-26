<script lang="ts">
  import MainPanel from './panels/MainPanel.svelte';
  import LoginPanel from './panels/LoginPanel.svelte';
  import SettingsPanel from './panels/SettingsPanel.svelte';
  import { menuStore } from '../../stores/menuStore.svelte.js';

  let currentPanel = $derived(menuStore.currentPanel);

  function handleNavigate(panel: string) {
    menuStore.navigateTo(panel);
  }

  function handleClose() {
    menuStore.close();
  }
</script>

<div class="menu">
  <div class="menu-inner">
    <div class="panel" class:active={currentPanel === 'main'} data-panel="main">
      <MainPanel onNavigate={handleNavigate} onClose={handleClose} />
    </div>

    <div class="panel" class:active={currentPanel === 'login'} data-panel="login">
      <LoginPanel />
    </div>

    <div class="panel" class:active={currentPanel === 'settings'} data-panel="settings">
      <SettingsPanel />
    </div>
  </div>
</div>

<style>
  .menu {
    position: fixed;
    inset: 0;
    z-index: var(--z-menu);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background-color: rgba(var(--color-background), 0.85);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .menu-inner {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .panel {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transform: translateX(16px);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
    pointer-events: none;
  }

  .panel.active {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }
</style>
