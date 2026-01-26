/**
 * Login flow handling
 *
 * Manages the OAuth/magic link login flow:
 * - Redirect to central auth service
 * - Handle callback with auth code
 * - Exchange code for session
 */

import { logger } from './logger.js';
import { isTokenMode } from './api.js';
import { tokenStore } from '../stores/tokenStore.svelte.js';
import { configStore } from '../stores/configStore.svelte.js';
import { type Result, ok, err } from './types/result.js';

const AUTH_SERVICE_URL = 'https://auth.service.livingcontent.co';

interface AuthStateData {
  state: string;
  redirectUri: string;
  originalSearch: string;
  expires: number;
}

export const login = {
  /**
   * Redirect to central auth service.
   */
  async redirectToAuth(method: 'google' | 'email', email?: string): Promise<Result<void>> {
    if (method === 'email' && (!email || !email.includes('@'))) {
      return err('Invalid email address');
    }

    const gaimId = configStore.gaimId;
    if (!gaimId) {
      return err('Missing GAIM ID');
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const authUrl = new URL(`${AUTH_SERVICE_URL}/login`);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('gaim_id', gaimId);
    authUrl.searchParams.set('method', method);

    if (email) {
      authUrl.searchParams.set('email', email);
    }

    const authState = crypto.randomUUID();
    const authStateData: AuthStateData = {
      state: authState,
      redirectUri: redirectUri,
      originalSearch: window.location.search,
      expires: Date.now() + 10 * 60 * 1000,
    };
    localStorage.setItem('auth_state_data', JSON.stringify(authStateData));
    authUrl.searchParams.set('auth_state', authState);

    logger.debug(`Login: Redirecting to central auth for ${method} sign-in`);

    window.location.href = authUrl.toString();
    return ok(undefined);
  },

  /**
   * Redirect to central auth for Google sign-in.
   */
  async signInWithGoogle(): Promise<Result<void>> {
    return login.redirectToAuth('google');
  },

  /**
   * Redirect to central auth for magic link sign-in.
   */
  async sendMagicLink(email: string): Promise<Result<void>> {
    return login.redirectToAuth('email', email);
  },

  /**
   * Handle auth callback when returning from central auth with code.
   */
  async handleAuthCallback(
    onLoginSuccess: () => Promise<Result<{ user_id: string }>>
  ): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedAuthState = params.get('auth_state');

    if (!code) {
      return false;
    }

    logger.debug('Login: Handling auth callback with code');

    const authStateDataStr = localStorage.getItem('auth_state_data');
    localStorage.removeItem('auth_state_data');

    let authStateData: AuthStateData | null = null;
    try {
      authStateData = authStateDataStr ? JSON.parse(authStateDataStr) : null;
    } catch {
      authStateData = null;
    }

    if (!returnedAuthState || !authStateData || returnedAuthState !== authStateData.state) {
      logger.error('Login: auth_state mismatch');
      cleanUrl();
      return false;
    }

    if (authStateData.expires && Date.now() > authStateData.expires) {
      logger.error('Login: auth_state expired');
      cleanUrl();
      return false;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (isTokenMode()) {
        headers['X-Auth-Mode'] = 'token';
      }

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      };

      if (!isTokenMode()) {
        fetchOptions.credentials = 'include';
      }

      const apiUrl = configStore.apiUrl;
      const response = await fetch(`${apiUrl}/auth/exchange`, fetchOptions);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Failed to exchange auth code');
      }

      const exchangeData = await response.json();

      if (isTokenMode() && exchangeData.access_token) {
        tokenStore.setTokens(
          exchangeData.access_token,
          exchangeData.refresh_token,
          exchangeData.expires_in
        );
      }

      const loginResult = await onLoginSuccess();
      if (!loginResult.ok) {
        throw new Error(loginResult.error);
      }

      cleanUrl();
      logger.debug('Login: Auth callback completed successfully');

      return true;
    } catch (error) {
      logger.error('Login: Auth callback failed:', error);
      cleanUrl();
      return false;
    }
  },
};

function cleanUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('auth_state');
  window.history.replaceState({}, document.title, url.toString());
}
