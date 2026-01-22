import type { AssetManifest, AssetType, Trace } from '../../../../config/types.js';
import type { AssetManifestRequest } from '../assetManifestRequest.js';
import type { Manifest } from './traceTypes.js';
import { normalizeAssetManifest, normalizeInlineData } from './assetManifestMapper.js';
import { buildTrace } from './traceParser.js';

/**
 * Extracts asset manifest fetch requests from a manifest.
 *
 * Returns a list of URLs to fetch for assets that have external manifests.
 */
export const getAssetManifestRequests = (
  manifest: Manifest,
  baseUrl: URL
): AssetManifestRequest[] => {
  return manifest.assets
    .filter((asset) => asset.manifestUrl)
    .map((asset) => ({
      assetId: asset.id,
      url: new URL(asset.manifestUrl!, baseUrl).toString(),
    }));
};

/**
 * Extracts claim manifest fetch requests from a manifest.
 *
 * Returns a list of URLs to fetch for claims that have external manifests.
 */
export const getClaimManifestRequests = (
  manifest: Manifest,
  baseUrl: URL
): AssetManifestRequest[] => {
  return manifest.claims
    .filter((claim) => claim.manifestUrl)
    .map((claim) => ({
      assetId: claim.id,
      url: new URL(claim.manifestUrl!, baseUrl).toString(),
    }));
};

/**
 * Parses a manifest using an adapter-provided asset type mapping.
 *
 * Handles both bundled manifests (inline data) and external file references.
 */
export const parseManifest = (
  manifest: Manifest,
  assetManifests: Map<string, unknown>,
  claimManifests: Map<string, unknown>,
  mapAssetType: (assetType: string) => AssetType
): Trace => {
  const normalizedAssetManifests = new Map<string, AssetManifest>();

  // Process externally-loaded asset manifests
  assetManifests.forEach((rawManifest, assetId) => {
    const normalized = normalizeAssetManifest(rawManifest);
    if (normalized) {
      normalizedAssetManifests.set(assetId, normalized);
    }
  });

  // Process inline data for bundled manifests
  manifest.assets.forEach((asset) => {
    if (!normalizedAssetManifests.has(asset.id) && asset.data) {
      const normalized = normalizeInlineData(asset.data);
      if (normalized) {
        normalizedAssetManifests.set(asset.id, normalized);
      }
    }
  });

  return buildTrace(manifest, normalizedAssetManifests, claimManifests, mapAssetType);
};
