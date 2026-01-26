<script lang="ts">
  /**
   * Login panel with email and Google SSO options.
   */
  import { authService } from '../../../lib/auth/authService.js';

  let email = $state('');
  let isLoading = $state(false);

  async function signInWithGoogle() {
    isLoading = true;
    const result = await authService.signInWithGoogle();
    if (!result.ok) {
      isLoading = false;
    }
  }

  async function sendMagicLink() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return;
    }

    isLoading = true;
    const result = await authService.sendMagicLink(trimmedEmail);
    if (!result.ok) {
      isLoading = false;
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    sendMagicLink();
  }
</script>

<div class="panel-content">
  <div class="panel-body">
    <section class="section">
      <h3 class="section-title">Email</h3>
      <form class="form-row" onsubmit={handleSubmit}>
        <input
          type="email"
          class="input"
          placeholder="you@example.com"
          autocomplete="email"
          bind:value={email}
          disabled={isLoading}
        />
        <button
          type="submit"
          class="btn"
          disabled={isLoading || !email.trim()}
        >
          Submit
        </button>
      </form>
    </section>

    <section class="section">
      <h3 class="section-title">SSO</h3>
      <button
        class="action"
        onclick={signInWithGoogle}
        disabled={isLoading}
      >
        <span class="action-label">Continue with Google</span>
      </button>
    </section>
  </div>
</div>

<style>
  .panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 80px 24px 24px;
    overflow-y: auto;
  }

  .panel-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.4);
    margin: 0 0 8px;
  }

  .form-row {
    display: flex;
    gap: 12px;
  }

  .input {
    flex: 1;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-size: 16px;
  }

  .input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
  }

  .input:disabled {
    opacity: 0.5;
  }

  .btn {
    padding: 12px 24px;
    background: white;
    border: none;
    border-radius: 8px;
    color: black;
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

  .action {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    text-align: left;
    transition: opacity 0.15s ease;
  }

  .action:hover:not(:disabled) {
    opacity: 0.7;
  }

  .action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-label {
    flex: 1;
  }
</style>
