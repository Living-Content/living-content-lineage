/**
 * Authentication type definitions.
 */

export type AuthState =
  | 'INITIALIZING'
  | 'ANONYMOUS'
  | 'AUTHENTICATED'
  | 'REFRESHING'
  | 'SESSION_ENDED';

export interface UserClaims {
  email?: string;
  name?: string;
  picture?: string;
  isAdmin?: boolean;
  gaimRole?: string;
  isGaimMember?: boolean;
}

export interface AuthStoreState {
  state: AuthState;
  userId: string | null;
  claims: UserClaims | null;
  isReady: boolean;
}

export interface AppConfig {
  apiUrl: string;
  gaimId: string;
  workflowId: string;
}
