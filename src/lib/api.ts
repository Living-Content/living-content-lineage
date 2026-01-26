/**
 * API Service
 * HTTP client with dual auth modes for cross-origin support.
 */

import { logger } from './logger.js';
import { tokenStore } from '../stores/tokenStore.svelte.js';
import { configStore } from '../stores/configStore.svelte.js';

/**
 * Determines if the app is running in cross-origin token mode.
 * Cross-origin mode requires explicit Bearer tokens instead of cookies.
 */
export function isTokenMode(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const apiUrl = configStore.apiUrl;
    if (!apiUrl) return true;
    const apiHost = new URL(apiUrl).host;
    return window.location.host !== apiHost;
  } catch {
    return true;
  }
}

/**
 * Add auth headers/credentials to request options.
 */
function applyAuth(options: RequestInit): RequestInit {
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
}

export const api = {
  isTokenMode,

  /**
   * Fetch with auth support.
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const authOptions = applyAuth(options);
    return fetch(url, authOptions);
  },

  /**
   * Redirect with visible feedback.
   */
  redirectWithLoader(url: string): void {
    window.location.href = url;
  },
};
