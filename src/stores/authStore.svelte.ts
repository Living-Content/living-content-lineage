/**
 * Auth Store
 * Authentication state machine using Svelte 5 runes.
 *
 * States:
 *   INITIALIZING  - App starting, auth state unknown
 *   ANONYMOUS     - User has anon ID, not authenticated
 *   AUTHENTICATED - User has valid session
 *   REFRESHING    - Access token expired, refresh in progress
 *   SESSION_ENDED - Refresh failed, requires user action
 */

import { SvelteSet } from 'svelte/reactivity';
import { logger } from '../lib/logger.js';
import type { AuthState, UserClaims, AuthStoreState } from '../lib/auth/types.js';

const validTransitions: Record<AuthState, AuthState[]> = {
  INITIALIZING: ['ANONYMOUS', 'AUTHENTICATED', 'SESSION_ENDED'],
  ANONYMOUS: ['AUTHENTICATED', 'INITIALIZING'],
  AUTHENTICATED: ['REFRESHING', 'ANONYMOUS', 'SESSION_ENDED'],
  REFRESHING: ['AUTHENTICATED', 'SESSION_ENDED'],
  SESSION_ENDED: ['ANONYMOUS', 'AUTHENTICATED', 'INITIALIZING'],
};

let currentState = $state<AuthState>('INITIALIZING');
let userId = $state<string | null>(null);
let claims = $state<UserClaims | null>(null);
let isReady = $state(false);

type AuthEventHandler = (data: AuthStoreState) => void;
const stateChangeHandlers = new SvelteSet<AuthEventHandler>();
const readyHandlers = new SvelteSet<AuthEventHandler>();

function transition(
  newState: AuthState,
  data: { userId?: string | null; claims?: UserClaims | null } = {}
): boolean {
  const previousState = currentState;

  if (!validTransitions[previousState]?.includes(newState)) {
    logger.warn(
      `AuthState: Invalid transition from ${previousState} to ${newState}`
    );
    return false;
  }

  currentState = newState;
  if (data.userId !== undefined) {
    userId = data.userId;
  }
  if (data.claims !== undefined) {
    claims = data.claims;
  }

  logger.debug(
    `AuthState: ${previousState} → ${newState}`,
    data.userId ? `(user: ${data.userId})` : ''
  );

  const eventData: AuthStoreState = {
    state: currentState,
    userId,
    claims,
    isReady,
  };
  stateChangeHandlers.forEach((handler) => handler(eventData));

  if (!isReady && newState !== 'INITIALIZING') {
    isReady = true;
    logger.debug('AuthState: Ready');
    readyHandlers.forEach((handler) =>
      handler({ state: currentState, userId, claims, isReady })
    );
  }

  return true;
}

export const authStore = {
  get state(): AuthState {
    return currentState;
  },

  get userId(): string | null {
    return userId;
  },

  get claims(): UserClaims | null {
    return claims;
  },

  get isReady(): boolean {
    return isReady;
  },

  get isAuthenticated(): boolean {
    return currentState === 'AUTHENTICATED';
  },

  get isAnonymous(): boolean {
    return currentState === 'ANONYMOUS';
  },

  get isInitializing(): boolean {
    return currentState === 'INITIALIZING';
  },

  get isRefreshing(): boolean {
    return currentState === 'REFRESHING';
  },

  get isSessionEnded(): boolean {
    return currentState === 'SESSION_ENDED';
  },

  setAnonymous(anonUserId: string | null): boolean {
    return transition('ANONYMOUS', { userId: anonUserId, claims: null });
  },

  setAuthenticated(authUserId: string, userClaims: UserClaims | null = null): boolean {
    return transition('AUTHENTICATED', { userId: authUserId, claims: userClaims });
  },

  setRefreshing(): boolean {
    return transition('REFRESHING', {});
  },

  endSession(): boolean {
    return transition('SESSION_ENDED', {});
  },

  reset(): boolean {
    const previousState = currentState;
    currentState = 'INITIALIZING';
    userId = null;
    claims = null;
    isReady = false;

    logger.debug(`AuthState: Reset from ${previousState}`);

    const eventData: AuthStoreState = {
      state: currentState,
      userId: null,
      claims: null,
      isReady: false,
    };
    stateChangeHandlers.forEach((handler) => handler(eventData));

    return true;
  },

  onStateChange(handler: AuthEventHandler): () => void {
    stateChangeHandlers.add(handler);
    return () => stateChangeHandlers.delete(handler);
  },

  onReady(handler: AuthEventHandler): () => void {
    if (isReady) {
      handler({ state: currentState, userId, claims, isReady });
      return () => {};
    }
    readyHandlers.add(handler);
    return () => readyHandlers.delete(handler);
  },

  waitForReady(): Promise<AuthStoreState> {
    return new Promise((resolve) => {
      if (isReady) {
        resolve({ state: currentState, userId, claims, isReady });
        return;
      }
      const unsubscribe = authStore.onReady((data) => {
        unsubscribe();
        resolve(data);
      });
    });
  },
};
