/**
 * Session Restore
 * Session validation and restoration on page load.
 */

import { logger } from '../logger.js';
import { api, isTokenMode } from '../api.js';
import { authStore } from '../../stores/authStore.svelte.js';
import { tokenStore } from '../../stores/tokenStore.svelte.js';
import { configStore } from '../../stores/configStore.svelte.js';
import { type Result, ok, err } from '../types/result.js';
import { refreshAccessToken, scheduleTokenRefresh } from './tokenRefresh.js';

export interface AuthCheckResponse {
  authenticated: boolean;
  user_id: string | null;
  auth_type: string | null;
  expires_in: number | null;
  anon_token: string | null;
}

export interface UserProfileResponse {
  uid: string;
  email: string | null;
  username: string | null;
  name: string | null;
  picture: string | null;
  role: string | null;
}

/**
 * Fetch auth status from the server.
 */
export async function fetchAuthCheck(): Promise<Result<AuthCheckResponse>> {
  try {
    const response = await api.fetch(`${configStore.apiUrl}/auth/check`);
    if (!response.ok) {
      logger.warn('Auth: Failed to fetch auth status');
      return err(`Auth check failed with status ${response.status}`);
    }
    const data = await response.json();

    if (isTokenMode() && data.anon_token && !data.authenticated) {
      tokenStore.setAnonToken(data.anon_token);
    }

    return ok(data);
  } catch (error) {
    logger.error('Auth: Error fetching auth status:', error);
    return err(error instanceof Error ? error.message : 'Unknown auth check error');
  }
}

/**
 * Fetch user profile from /users/me endpoint.
 */
export async function fetchUserProfile(): Promise<Result<UserProfileResponse>> {
  try {
    const response = await api.fetch(`${configStore.apiUrl}/users/me`);
    if (!response.ok) {
      logger.warn('Auth: Failed to fetch user profile');
      return err(`Profile fetch failed with status ${response.status}`);
    }
    return ok(await response.json());
  } catch (error) {
    logger.error('Auth: Error fetching user profile:', error);
    return err(error instanceof Error ? error.message : 'Unknown profile fetch error');
  }
}

/**
 * Fetch anonymous user ID from auth check endpoint.
 */
export async function fetchAnonymousUserId(): Promise<Result<string | null>> {
  const authCheck = await fetchAuthCheck();
  if (!authCheck.ok) {
    return err(authCheck.error);
  }
  return ok(authCheck.data.user_id);
}

/**
 * Restore existing session using stored refresh token.
 */
export async function restoreSession(): Promise<Result<void>> {
  try {
    logger.info('Auth: Attempting token refresh...');
    const refreshResult = await refreshAccessToken();

    if (!refreshResult.ok) {
      logger.info('Auth: Refresh failed');
      return err(refreshResult.error);
    }

    const authCheck = await fetchAuthCheck();
    if (!authCheck.ok || !authCheck.data.authenticated) {
      logger.warn('Auth: Not authenticated after refresh');
      return err('Not authenticated after refresh');
    }

    logger.info('Auth: Session refreshed successfully');

    const profile = await fetchUserProfile();
    if (!profile.ok) {
      logger.warn('Auth: Failed to fetch user profile after session validation');
      return err(profile.error);
    }

    authStore.setAuthenticated(profile.data.uid, {
      email: profile.data.email ?? undefined,
      name: profile.data.name ?? undefined,
      picture: profile.data.picture ?? undefined,
      isAdmin: profile.data.role === 'admin',
      gaimRole: profile.data.role ?? undefined,
      isGaimMember: profile.data.role !== null,
    });

    if (authCheck.data.expires_in) {
      scheduleTokenRefresh(authCheck.data.expires_in);
    }

    return ok(undefined);
  } catch (error) {
    logger.error('Auth: Session restore failed:', error);
    return err(error instanceof Error ? error.message : 'Unknown session restore error');
  }
}

/**
 * Handle successful login callback from OAuth flow.
 */
export async function handleLoginSuccess(): Promise<Result<{ user_id: string }>> {
  logger.debug('Auth: Login success callback');

  const authCheck = await fetchAuthCheck();
  if (!authCheck.ok || !authCheck.data.authenticated || !authCheck.data.user_id) {
    logger.warn('Auth: Not authenticated after login');
    return err('Not authenticated after login');
  }

  const profile = await fetchUserProfile();
  if (!profile.ok) {
    logger.warn('Auth: Failed to fetch profile after login');
    return err(profile.error);
  }

  authStore.setAuthenticated(profile.data.uid, {
    email: profile.data.email ?? undefined,
    name: profile.data.name ?? undefined,
    picture: profile.data.picture ?? undefined,
    isAdmin: profile.data.role === 'admin',
    gaimRole: profile.data.role ?? undefined,
    isGaimMember: profile.data.role !== null,
  });

  if (authCheck.data.expires_in) {
    scheduleTokenRefresh(authCheck.data.expires_in);
  }

  return ok({ user_id: profile.data.uid });
}
