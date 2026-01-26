<script lang="ts">
  import { authStore } from '../../../stores/authStore.svelte.js';
  import { authService } from '../../../lib/auth/authService.js';

  let {
    onNavigate,
    onClose,
  }: {
    onNavigate: (panel: string) => void;
    onClose: () => void;
  } = $props();

  let isAuthenticated = $derived(authStore.isAuthenticated);

  async function handleAuthAction() {
    if (isAuthenticated) {
      await authService.logout();
      onClose();
    } else {
      onNavigate('login');
    }
  }
</script>

<div class="panel-content">
  <div class="panel-body">
    <section class="section">
      <h3 class="section-title">Account</h3>
      <button class="action" onclick={handleAuthAction}>
        <span class="action-label">{isAuthenticated ? 'Log out' : 'Log in'}</span>
      </button>
      <button class="action" onclick={() => onNavigate('settings')}>
        <span class="action-label">Settings</span>
      </button>
    </section>
  </div>
</div>
