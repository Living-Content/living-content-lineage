import type { LineageGraph } from '../../config/types.js';
import { getAssetManifestRequests, getClaimManifestRequests, parseManifest } from './adapters/base/lineageAdapter.js';
import { isManifest } from './adapters/base/lineageTypes.js';
import { mapAssetType } from './adapters/assetTypeMapper.js';
import type { AssetManifestRequest } from './adapters/assetManifestRequest.js';
import type { AssetLoadResult } from './errors.js';

/**
 * Fetches external manifests in parallel and returns a map of id -> manifest data.
 */
const fetchManifests = async (
  requests: AssetManifestRequest[]
): Promise<{ manifests: Map<string, unknown>; results: AssetLoadResult[] }> => {
  const manifests = new Map<string, unknown>();
  const results: AssetLoadResult[] = await Promise.all(
    requests.map(async (request): Promise<AssetLoadResult> => {
      try {
        const res = await fetch(request.url);
        if (!res.ok) {
          return { assetId: request.assetId, success: false, error: `HTTP ${res.status}` };
        }
        const manifest = (await res.json()) as unknown;
        manifests.set(request.assetId, manifest);
        return { assetId: request.assetId, success: true };
      } catch (error) {
        return { assetId: request.assetId, success: false, error: String(error) };
      }
    })
  );
  return { manifests, results };
};

/**
 * Loads a manifest from a URL and fetches all external asset and claim manifests.
 */
export const loadManifest = async (url: string): Promise<LineageGraph> => {
  const manifestUrl = new URL(url, window.location.href);
  const response = await fetch(manifestUrl.toString());
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.statusText}`);
  }

  const raw = (await response.json()) as unknown;

  if (!isManifest(raw)) {
    throw new Error('Invalid manifest structure');
  }

  const baseUrl = new URL('.', manifestUrl);
  const assetRequests = getAssetManifestRequests(raw, baseUrl);
  const claimRequests = getClaimManifestRequests(raw, baseUrl);

  const [assetResults, claimResults] = await Promise.all([
    fetchManifests(assetRequests),
    fetchManifests(claimRequests),
  ]);

  const failedAssets = assetResults.results.filter(r => !r.success);
  if (failedAssets.length > 0) {
    console.warn(`Failed to load ${failedAssets.length} asset manifest(s):`, failedAssets);
  }

  const failedClaims = claimResults.results.filter(r => !r.success);
  if (failedClaims.length > 0) {
    console.warn(`Failed to load ${failedClaims.length} claim manifest(s):`, failedClaims);
  }

  return parseManifest(raw, assetResults.manifests, claimResults.manifests, mapAssetType);
};
