/**
 * Config Store
 * Configuration management for the tracer.
 *
 * Parses gaimId and workflowId from the lco_manifest URL parameter.
 * Format: {gaim_id}_{workflow_id}
 */

import { logger } from '../lib/logger.js';
import type { AppConfig } from '../lib/auth/types.js';

let config = $state<AppConfig>({
  apiUrl: '',
  gaimId: '',
  workflowId: '',
});

let isLoaded = $state(false);

function parseLcoManifest(): { gaimId: string; workflowId: string } | null {
  const params = new URLSearchParams(window.location.search);
  const lcoManifest = params.get('lco_manifest');

  if (!lcoManifest) {
    return null;
  }

  const parts = lcoManifest.split('_');
  if (parts.length < 2) {
    return null;
  }

  return {
    gaimId: parts[0],
    workflowId: parts.slice(1).join('_'),
  };
}

function buildApiUrl(gaimId: string): string {
  const isLocalhost = window.location.hostname === 'localhost';
  return isLocalhost
    ? 'https://localhost:8000'
    : `https://${gaimId}.api.livingcontent.co`;
}

export const configStore = {
  get gaimId(): string {
    return config.gaimId;
  },

  get workflowId(): string {
    return config.workflowId;
  },

  get apiUrl(): string {
    return config.apiUrl;
  },

  get isLoaded(): boolean {
    return isLoaded;
  },

  get current(): AppConfig {
    return config;
  },

  /**
   * Initialize config from URL parameters.
   * Call this early in app startup.
   */
  init(): boolean {
    const parsed = parseLcoManifest();

    if (!parsed) {
      logger.warn('Config: No lco_manifest param found');
      isLoaded = true;
      return false;
    }

    config = {
      gaimId: parsed.gaimId,
      workflowId: parsed.workflowId,
      apiUrl: buildApiUrl(parsed.gaimId),
    };

    isLoaded = true;
    logger.debug('Config: Initialized', config);
    return true;
  },

  /**
   * Check if we have valid config for auth.
   */
  hasValidConfig(): boolean {
    return !!(config.gaimId && config.apiUrl);
  },
};
