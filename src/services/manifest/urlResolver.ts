/**
 * Resolves the manifest URL from the lco_manifest query parameter.
 *
 * The lco_manifest param format is: {gaim_id}_{workflow_id}
 * This builds the API URL: https://{gaimId}.api.livingcontent.co/trace/{workflowId}/manifest
 */
import { logger } from '../../lib/logger.js';

interface ManifestParams {
  gaimId: string;
  workflowId: string;
}

/**
 * Parses the lco_manifest query parameter value.
 * Format: {gaim_id}_{workflow_id}
 */
const parseLcoManifestParam = (value: string): ManifestParams | null => {
  const parts = value.split('_');
  if (parts.length < 2) {
    return null;
  }

  const gaimId = parts[0];
  const workflowId = parts.slice(1).join('_');

  return { gaimId, workflowId };
};

/**
 * Builds the API URL for fetching a manifest.
 */
const buildApiUrl = (gaimId: string, workflowId: string): string => {
  const isLocalhost = window.location.hostname === 'localhost';
  const apiBaseUrl = isLocalhost
    ? 'https://localhost:8000'
    : `https://${gaimId}.api.livingcontent.co`;

  return `${apiBaseUrl}/trace/${workflowId}/manifest`;
};

/**
 * Resolves the manifest URL from the current page URL.
 * Checks for lco_manifest query param, falls back to local manifest.
 */
export function resolveManifestUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const lcoManifest = params.get('lco_manifest');

  if (lcoManifest) {
    const parsed = parseLcoManifestParam(lcoManifest);
    if (parsed) {
      return buildApiUrl(parsed.gaimId, parsed.workflowId);
    }
    logger.warn('Invalid lco_manifest format. Expected: {gaim_id}_{workflow_id}');
  }

  return '/data/manifest.json';
}
