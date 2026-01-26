/**
 * Token Refresh
 * Automatic token refresh scheduling.
 */

import { logger } from '../logger.js';
import { isTokenMode } from '../api.js';
import { authStore } from '../../stores/authStore.svelte.js';
import { tokenStore } from '../../stores/tokenStore.svelte.js';
import { configStore } from '../../stores/configStore.svelte.js';
import { fetchUserProfile } from './sessionRestore.js';
import { type Result, ok, err } from '../types/result.js';

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Refresh the access token using the stored refresh token.
 */
export async function refreshAccessToken(): Promise<Result<{ expiresIn: number }>> {
  const refreshTokenValue = tokenStore.refreshToken;
  if (!refreshTokenValue && isTokenMode()) {
    logger.warn('Auth: No refresh token available');
    return err('No refresh token available');
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (isTokenMode()) {
      headers['X-Auth-Mode'] = 'token';
    }

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers,
    };

    if (isTokenMode()) {
      fetchOptions.body = JSON.stringify({ refresh_token: refreshTokenValue });
    } else {
      fetchOptions.credentials = 'include';
    }

    const response = await fetch(
      `${configStore.apiUrl}/auth/refresh`,
      fetchOptions
    );

    if (!response.ok) {
      logger.error('Auth: Refresh failed with status', response.status);
      return err(`Refresh failed with status ${response.status}`);
    }

    const data = await response.json();

    if (isTokenMode() && data.access_token) {
      tokenStore.setTokens(
        data.access_token,
        data.refresh_token,
        data.expires_in
      );
    }

    return ok({ expiresIn: data.expires_in });
  } catch (error) {
    logger.error('Auth: Refresh error:', error);
    return err(error instanceof Error ? error.message : 'Unknown refresh error');
  }
}

/**
 * Schedule automatic token refresh.
 */
export function scheduleTokenRefresh(expiresIn: number): void {
  clearTokenRefreshTimer();

  if (!expiresIn || expiresIn <= 0) {
    logger.debug('Auth: No expiry provided, not scheduling refresh');
    return;
  }

  const refreshIn = Math.max(10, expiresIn - 120);
  logger.debug(`Auth: Scheduling refresh in ${refreshIn} seconds`);

  refreshTimer = setTimeout(async () => {
    logger.debug('Auth: Auto-refreshing token...');

    if (authStore.isAuthenticated) {
      authStore.setRefreshing();
    }

    const result = await refreshAccessToken();

    if (result.ok) {
      if (authStore.isRefreshing) {
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
      }
      scheduleTokenRefresh(result.data.expiresIn);
    } else {
      logger.error('Auth: Auto-refresh failed');
      authStore.endSession();
    }
  }, refreshIn * 1000);
}

/**
 * Clear refresh timer.
 */
export function clearTokenRefreshTimer(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}
