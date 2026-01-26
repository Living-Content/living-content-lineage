<script lang="ts">
  /**
   * Sign-in prompt for unauthenticated users.
   * Styled as a subtle inline banner with left accent.
   */
  import { menuStore } from '../../stores/menuStore.svelte.js';

  function handleSignIn() {
    menuStore.open();
    menuStore.navigateTo('login');
  }
</script>

<div class="auth-prompt">
  <p class="message">Sign in to leave a comment</p>
  <button class="sign-in-btn" onclick={handleSignIn}>
    Sign In
  </button>
</div>

<style>
  .auth-prompt {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    margin: var(--space-md);
    background: var(--color-surface-hover);
    border-left: 3px solid var(--color-text-primary);
    border-radius: var(--radius-sm);
  }

  .message {
    margin: 0;
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
  }

  .sign-in-btn {
    padding: var(--space-xs) var(--space-md);
    background: transparent;
    border: 1px solid var(--color-text-primary);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-small);
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
    white-space: nowrap;
  }

  .sign-in-btn:hover {
    opacity: 0.7;
  }
</style>
