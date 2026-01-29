/**
 * Auth Mode Detection
 * Determines whether the app uses token-based or cookie-based authentication.
 */

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
