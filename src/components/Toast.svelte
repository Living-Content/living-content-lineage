<script lang="ts">
  import { toastStore } from '../stores/toastStore.svelte.js';

  function getBarColor(style: string): string {
    switch (style) {
      case 'green': return 'rgb(var(--color-green))';
      case 'red': return 'rgb(var(--color-red))';
      case 'yellow': return 'rgb(var(--color-yellow))';
      case 'blue': return 'rgb(var(--color-blue))';
      default: return 'rgb(var(--color-foreground))';
    }
  }

  function formatTimestamp(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${min}:${ss}`;
  }
</script>

{#if toastStore.toasts.length > 0}
  <div class="toast-container">
    {#each toastStore.toasts as toast (toast.id)}
      <div
        class="toast"
        class:style-success={toast.style === 'green'}
        class:style-danger={toast.style === 'red'}
        class:style-warning={toast.style === 'yellow'}
        class:style-info={toast.style === 'blue'}
        style="--bar-color: {getBarColor(toast.style)}"
        role="alert"
      >
        <div class="content">
          <div class="content-row">
            <span class="message">{toast.message}</span>
            <span class="timestamp">{formatTimestamp()}</span>
          </div>
          {#if toast.persistent}
            <button
              class="action-text"
              onclick={() => toastStore.remove(toast.id)}
            >
              DISMISS
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
