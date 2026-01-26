<script lang="ts">
  /**
   * Settings panel with user profile and theme options.
   */
  import { authStore } from '../../../stores/authStore.svelte.js';
</script>

<div class="panel-content">
  <div class="panel-body">
    {#if authStore.isAuthenticated && authStore.claims}
      <section class="section">
        <h3 class="section-title">Account</h3>
        <div class="profile">
          {#if authStore.claims.picture}
            <img class="profile-picture" src={authStore.claims.picture} alt="" />
          {:else}
            <div class="profile-picture profile-placeholder"></div>
          {/if}
          <div class="profile-info">
            {#if authStore.claims.name}
              <span class="profile-name">{authStore.claims.name}</span>
            {/if}
            {#if authStore.claims.email}
              <span class="profile-email">{authStore.claims.email}</span>
            {/if}
          </div>
        </div>
      </section>
    {/if}

    <section class="section">
      <h3 class="section-title">About</h3>
      <div class="info-row">
        <span class="info-label">Tracer</span>
        <span class="info-value">v1.0.0</span>
      </div>
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

  .info-row {
    display: flex;
    gap: 24px;
    font-size: 16px;
    color: white;
  }

  .info-label {
    opacity: 0.4;
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .profile-picture {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .profile-placeholder {
    background: rgba(255, 255, 255, 0.1);
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .profile-name {
    font-size: 16px;
    font-weight: 600;
    color: white;
  }

  .profile-email {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
