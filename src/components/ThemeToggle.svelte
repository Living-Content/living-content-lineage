<script lang="ts">
  /**
   * Theme toggle button.
   * Cycles through light, dark, and system themes.
   */
  import { onMount } from 'svelte';
  import {
    themePreference,
    resolvedTheme,
    cycleTheme,
    initializeTheme,
  } from '../stores/themeState.js';

  let mounted = false;

  onMount(() => {
    mounted = true;
    const cleanup = initializeTheme();
    return cleanup;
  });

  function handleClick(): void {
    cycleTheme();
  }

  $: icon = getIcon($themePreference);
  $: label = getLabel($themePreference);

  function getIcon(pref: string): string {
    switch (pref) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
      default:
        return '☀️';
    }
  }

  function getLabel(pref: string): string {
    switch (pref) {
      case 'light':
        return 'Light theme';
      case 'dark':
        return 'Dark theme';
      case 'system':
        return 'System theme';
      default:
        return 'Theme';
    }
  }
</script>

{#if mounted}
  <button
    class="theme-toggle"
    on:click={handleClick}
    title={label}
    aria-label={label}
  >
    <span class="theme-icon">{icon}</span>
  </button>
{/if}

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface-subtle, rgba(0, 0, 0, 0.03));
    cursor: pointer;
    transition: background var(--duration-fast, 0.1s) ease;
  }

  .theme-toggle:hover {
    background: var(--color-surface-hover, #f5f5f5);
  }

  .theme-toggle:active {
    background: var(--color-surface-active, #ebebeb);
  }

  .theme-icon {
    font-size: 16px;
    line-height: 1;
  }
</style>
