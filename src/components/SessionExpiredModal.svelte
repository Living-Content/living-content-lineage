<script lang="ts">
  /**
   * Modal shown when user's session has expired.
   * Offers options to sign in again or continue as guest.
   */
  import { authService } from '../lib/auth/authService.js';
  import { menuStore } from '../stores/menuStore.svelte.js';

  interface Props {
    onRecovered: () => void;
  }

  let { onRecovered }: Props = $props();
  let isLoading = $state(false);

  async function handleSignIn() {
    isLoading = true;
    const result = await authService.signInWithGoogle();
    if (!result.ok) {
      isLoading = false;
    }
    // OAuth redirects, so onRecovered not called here
  }

  async function handleContinueAsGuest() {
    isLoading = true;
    await authService.continueAsGuest();
    onRecovered();
  }

  async function handleOpenLogin() {
    await authService.continueAsGuest();
    onRecovered();
    menuStore.open();
    menuStore.navigateTo('login');
  }
</script>

<div class="modal-overlay">
  <div class="modal">
    <h2 class="modal-title">Session Expired</h2>
    <p class="modal-message">Your session has ended. Sign in again to continue where you left off.</p>

    <div class="modal-actions">
      <button
        class="btn btn-primary"
        onclick={handleSignIn}
        disabled={isLoading}
      >
        Sign in with Google
      </button>

      <button
        class="btn btn-secondary"
        onclick={handleOpenLogin}
        disabled={isLoading}
      >
        Other sign in options
      </button>

      <button
        class="btn btn-ghost"
        onclick={handleContinueAsGuest}
        disabled={isLoading}
      >
        Continue as guest
      </button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-menu);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.85);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .modal {
    max-width: 400px;
    padding: 32px;
    margin: 24px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
  }

  .modal-title {
    margin: 0 0 12px;
    font-size: 24px;
    font-weight: 600;
    color: white;
  }

  .modal-message {
    margin: 0 0 24px;
    font-size: 16px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.6);
  }

  .modal-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .btn {
    padding: 14px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: white;
    color: black;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
  }

  .btn-ghost {
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
  }

  .btn-ghost:hover:not(:disabled) {
    color: white;
    opacity: 1;
  }
</style>
