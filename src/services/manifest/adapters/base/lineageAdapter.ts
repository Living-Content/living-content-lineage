import type { AssetManifest, AssetType, LineageGraph } from '../../../../config/types.js';
import type { AssetManifestRequest } from '../assetManifestRequest.js';
import type { Manifest } from './lineageTypes.js';
import { normalizeAssetManifest } from './assetManifestMapper.js';
import { buildLineageGraph } from './lineageParser.js';

export const getAssetManifestRequests = (
  manifest: Manifest,
  baseUrl: URL
): AssetManifestRequest[] => {
  return manifest.assets
    .filter((asset) => asset.manifest_url)
    .map((asset) => ({
      assetId: asset.id,
      url: new URL(asset.manifest_url!, baseUrl).toString(),
    }));
};

// Parses a manifest using an adapter-provided asset type mapping.
export const parseManifest = (
  manifest: Manifest,
  assetManifests: Map<string, unknown>,
  mapAssetType: (assetType: string) => AssetType
): LineageGraph => {
  const normalizedManifests = new Map<string, AssetManifest>();
  assetManifests.forEach((rawManifest, assetId) => {
    const normalized = normalizeAssetManifest(rawManifest);
    if (normalized) {
      normalizedManifests.set(assetId, normalized);
    }
  });

  return buildLineageGraph(manifest, normalizedManifests, mapAssetType);
};
