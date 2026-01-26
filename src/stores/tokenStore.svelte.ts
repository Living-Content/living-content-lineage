/**
 * Token Store
 * Manages authentication tokens for cross-origin scenarios.
 *
 * Security model:
 * - Access token: In-memory only (lost on refresh)
 * - Refresh token: localStorage (survives refresh)
 * - Anon token: localStorage (persisted)
 *
 * Keys are namespaced per GAIM to avoid collisions.
 */

import { logger } from '../lib/logger.js';
import { configStore } from './configStore.svelte.js';

function getTokenKey(key: 'anon-token' | 'refresh-token'): string {
  const gaimId = configStore.gaimId;
  if (!gaimId) {
    throw new Error('TokenStore: gaimId required but not available');
  }
  return `gaim-${gaimId}-${key}`;
}

let accessToken = $state<string | null>(null);
let refreshToken = $state<string | null>(null);
let anonToken = $state<string | null>(null);
let expiresAt = $state<number | null>(null);

function loadAnonToken(): string | null {
  try {
    const gaimId = configStore.gaimId;
    if (!gaimId) return null;
    return localStorage.getItem(`gaim-${gaimId}-anon-token`);
  } catch {
    return null;
  }
}

function saveAnonToken(token: string | null): void {
  try {
    const key = getTokenKey('anon-token');
    if (token) {
      localStorage.setItem(key, token);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors
  }
}

function loadRefreshToken(): string | null {
  try {
    const gaimId = configStore.gaimId;
    if (!gaimId) return null;
    return localStorage.getItem(`gaim-${gaimId}-refresh-token`);
  } catch {
    return null;
  }
}

function saveRefreshToken(token: string | null): void {
  try {
    const key = getTokenKey('refresh-token');
    if (token) {
      localStorage.setItem(key, token);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors
  }
}

export const tokenStore = {
  init(): void {
    refreshToken = loadRefreshToken();
    anonToken = loadAnonToken();
  },

  setTokens(
    newAccessToken: string,
    newRefreshToken: string,
    expiresIn: number
  ): void {
    logger.debug('TokenStore: setTokens called');

    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
    saveRefreshToken(newRefreshToken);
    expiresAt = Date.now() + expiresIn * 1000;

    anonToken = null;
    saveAnonToken(null);
  },

  setAnonToken(token: string): void {
    anonToken = token;
    saveAnonToken(token);
    logger.debug('TokenStore: Anon token stored');
  },

  get accessToken(): string | null {
    return accessToken;
  },

  get refreshToken(): string | null {
    return refreshToken;
  },

  get anonToken(): string | null {
    return anonToken;
  },

  get isExpired(): boolean {
    if (!expiresAt) {
      return true;
    }
    return Date.now() >= expiresAt;
  },

  get hasTokens(): boolean {
    return !!(accessToken || anonToken);
  },

  get expiresIn(): number {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  },

  clearAuthTokens(): void {
    accessToken = null;
    refreshToken = null;
    saveRefreshToken(null);
    expiresAt = null;
    logger.debug('TokenStore: Auth tokens cleared (anon preserved)');
  },

  clear(): void {
    accessToken = null;
    refreshToken = null;
    saveRefreshToken(null);
    anonToken = null;
    saveAnonToken(null);
    expiresAt = null;
    logger.debug('TokenStore: All tokens cleared');
  },
};
