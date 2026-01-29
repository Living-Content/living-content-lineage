/**
 * API Service
 * HTTP client with dual auth modes for cross-origin support.
 */

import { logger } from './logger.js';
import { isTokenMode } from './authMode.js';
import { tokenStore } from '../stores/tokenStore.svelte.js';
import { refreshAccessToken } from './auth/tokenRefresh.js';


// Track ongoing refresh to avoid concurrent refreshes
let refreshPromise: Promise<boolean> | null = null;

/**
 * Check if token needs refresh (expired or within 2 minutes of expiry).
 */
function tokenNeedsRefresh(): boolean {
  if (!isTokenMode()) {
    return false;
  }
  return tokenStore.isExpired || tokenStore.expiresIn <= 120;
}

/**
 * Check if token refresh is possible (has refresh token).
 */
function canRefreshToken(): boolean {
  return isTokenMode() && !!tokenStore.refreshToken;
}

/**
 * Attempt to refresh the access token.
 * Returns true if refresh succeeded, false otherwise.
 * Deduplicates concurrent refresh attempts.
 */
async function tryRefreshToken(): Promise<boolean> {
  if (!canRefreshToken()) {
    return false;
  }

  // If already refreshing, wait for that to complete
  if (refreshPromise) {
    return refreshPromise;
  }

  logger.debug('API: Refreshing token');
  refreshPromise = (async () => {
    try {
      const result = await refreshAccessToken();
      return result.ok;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Add auth headers/credentials to request options.
 */
const applyAuth = (options: RequestInit): RequestInit => {
  const headers = new Headers(options.headers);

  if (isTokenMode()) {
    headers.set('X-Auth-Mode', 'token');

    const accessToken = tokenStore.accessToken;
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const anonToken = tokenStore.anonToken;
    if (anonToken) {
      headers.set('X-Anon-Token', anonToken);
    }
  } else {
    options.credentials = 'include';
  }

  return { ...options, headers };
};

export const api = {

  /**
   * Fetch with auth support, automatic token refresh, and retry on 401/403.
   */
  async fetch(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
    // Pre-request: refresh token if needed
    if (tokenNeedsRefresh() && canRefreshToken()) {
      await tryRefreshToken();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const authOptions = applyAuth(options);
      const response = await fetch(url, {
        ...authOptions,
        signal: controller.signal,
      });

      // If 401/403, try to refresh and retry once
      if (
        (response.status === 401 || response.status === 403) &&
        canRefreshToken()
      ) {
        logger.debug(`API: Got ${response.status}, attempting refresh and retry`);
        const refreshed = await tryRefreshToken();

        if (refreshed) {
          // Retry with fresh token
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);

          try {
            const retryOptions = applyAuth(options);
            return await fetch(url, {
              ...retryOptions,
              signal: retryController.signal,
            });
          } finally {
            clearTimeout(retryTimeoutId);
          }
        }
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * Redirect with visible feedback.
   */
  redirectWithLoader(url: string): void {
    window.location.href = url;
  },
};
