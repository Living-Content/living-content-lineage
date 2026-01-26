/**
 * Auth Service
 * Main authentication orchestrator for the tracer.
 */

import { logger } from '../logger.js';
import { login } from '../login.js';
import { isTokenMode } from '../api.js';
import { authStore } from '../../stores/authStore.svelte.js';
import { tokenStore } from '../../stores/tokenStore.svelte.js';
import { configStore } from '../../stores/configStore.svelte.js';
import { type Result, ok, err } from '../types/result.js';

import {
  refreshAccessToken,
  scheduleTokenRefresh,
  clearTokenRefreshTimer,
} from './tokenRefresh.js';

import {
  fetchUserProfile,
  fetchAnonymousUserId,
  restoreSession,
  handleLoginSuccess,
} from './sessionRestore.js';

export const authService = {
  isTokenMode,

  /**
   * Initialize authentication.
   */
  async init(): Promise<void> {
    logger.debug('Auth: Initializing...');

    const apiUrl = configStore.apiUrl;
    if (!apiUrl) {
      logger.warn('Auth: Missing apiUrl - sign-in disabled');
      authStore.setAnonymous(null);
      return;
    }

    // Initialize token store to load persisted tokens
    tokenStore.init();

    // 1. Check for OAuth callback
    const handled = await login.handleAuthCallback(handleLoginSuccess);
    if (handled) {
      logger.debug('Auth: Handled auth callback');
      return;
    }

    // 2. Check for existing session
    const hasRefreshToken = isTokenMode() && tokenStore.refreshToken;

    if (hasRefreshToken) {
      logger.info('Auth: Found refresh token, attempting restore...');
      const restored = await restoreSession();
      if (restored.ok) return;

      logger.info('Auth: Restore failed, ending session');
      authStore.endSession();
      return;
    }

    // 3. No refresh token - anonymous
    logger.info('Auth: No refresh token, establishing anonymous identity');
    const userIdResult = await fetchAnonymousUserId();
    authStore.setAnonymous(userIdResult.ok ? userIdResult.data : null);
  },

  /**
   * Sign in with Google via central auth service.
   */
  async signInWithGoogle(): Promise<Result<void>> {
    if (authStore.isInitializing) {
      logger.error('Auth: Not initialized');
      return err('Auth not initialized');
    }

    return login.signInWithGoogle();
  },

  /**
   * Send magic link via central auth service.
   */
  async sendMagicLink(email: string): Promise<Result<void>> {
    if (authStore.isInitializing) {
      logger.error('Auth: Not initialized');
      return err('Auth not initialized');
    }

    return login.sendMagicLink(email);
  },

  /**
   * Logout.
   */
  async logout(): Promise<void> {
    logger.debug('Auth: Signing out...');

    clearTokenRefreshTimer();

    try {
      await fetch(`${configStore.apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      logger.warn('Auth: Failed to call logout endpoint:', error);
    }

    if (isTokenMode()) {
      tokenStore.clear();
    }

    const newAnonIdResult = await fetchAnonymousUserId();
    const newAnonId = newAnonIdResult.ok ? newAnonIdResult.data : null;
    logger.debug('Auth: Generated new anonymous userId:', newAnonId);

    authStore.setAnonymous(newAnonId);
    logger.debug('Auth: Signed out');
  },

  /**
   * Continue as guest after SESSION_ENDED.
   */
  async continueAsGuest(): Promise<void> {
    if (!authStore.isSessionEnded) {
      logger.warn('Auth: continueAsGuest called but not in SESSION_ENDED state');
      return;
    }

    logger.debug('Auth: Continuing as guest...');

    if (isTokenMode()) {
      tokenStore.clearAuthTokens();
    }

    const newAnonIdResult = await fetchAnonymousUserId();
    const newAnonId = newAnonIdResult.ok ? newAnonIdResult.data : null;
    authStore.setAnonymous(newAnonId);

    logger.debug('Auth: Now anonymous:', newAnonId);
  },

  /**
   * Manually refresh token.
   */
  async refresh(): Promise<Result<void>> {
    const result = await refreshAccessToken();

    if (result.ok && authStore.isRefreshing) {
      const profile = await fetchUserProfile();
      if (profile.ok) {
        authStore.setAuthenticated(profile.data.uid, {
          email: profile.data.email ?? undefined,
          name: profile.data.name ?? undefined,
          picture: profile.data.picture ?? undefined,
          isAdmin: profile.data.role === 'admin',
          gaimRole: profile.data.role ?? undefined,
          isGaimMember: profile.data.role !== null,
        });
      }
      return ok(undefined);
    } else if (!result.ok && authStore.isRefreshing) {
      authStore.endSession();
    }

    return result.ok ? ok(undefined) : err(result.error);
  },

  scheduleRefresh: scheduleTokenRefresh,
  clearRefreshTimer: clearTokenRefreshTimer,
};
