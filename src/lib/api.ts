/**
 * API Service
 * HTTP client with dual auth modes for cross-origin support.
 * Includes automatic retry for 5xx errors and token refresh for 401/403.
 */

import { logger } from './logger.js';
import { isTokenMode } from './authMode.js';
import { tokenStore } from '../stores/tokenStore.svelte.js';
import { refreshAccessToken } from './auth/tokenRefresh.js';
import { withRetry, API_RETRY } from './utils/retry.js';


/** Error with HTTP status for retry logic */
class HttpError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Check if error is retryable (5xx or network errors) */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof HttpError) {
    return error.status >= 500;
  }
  return error instanceof TypeError; // Network errors
};

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
   * Fetch with auth support, automatic retry for 5xx, and token refresh for 401/403.
   */
  async fetch(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
    // Pre-request: refresh token if needed
    if (tokenNeedsRefresh() && canRefreshToken()) {
      await tryRefreshToken();
    }

    const makeRequest = async (): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const authOptions = applyAuth(options);
        const response = await fetch(url, {
          ...authOptions,
          signal: controller.signal,
        });

        // Throw on 5xx to trigger retry
        if (response.status >= 500) {
          throw new HttpError(`Server error: ${response.status}`, response.status);
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Wrap with retry for 5xx errors
    const response = await withRetry(makeRequest, API_RETRY, isRetryableError);

    // If 401/403, try to refresh and retry once
    if (
      (response.status === 401 || response.status === 403) &&
      canRefreshToken()
    ) {
      logger.debug(`API: Got ${response.status}, attempting refresh and retry`);
      const refreshed = await tryRefreshToken();

      if (refreshed) {
        return withRetry(makeRequest, API_RETRY, isRetryableError);
      }
    }

    return response;
  },

  /**
   * Redirect with visible feedback.
   */
  redirectWithLoader(url: string): void {
    window.location.href = url;
  },
};
