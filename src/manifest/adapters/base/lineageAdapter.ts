import type { AssetManifest, LineageGraph } from '../../../types.js';
import type { AssetManifestRequest } from '../assetManifestRequest.js';
import type { LineageManifest } from './lineageTypes.js';
import { normalizeAssetManifest } from './assetManifestMapper.js';
import { buildLineageGraph } from './lineageParser.js';

export function getLineageAssetManifestRequests(
  manifest: LineageManifest,
  baseUrl: URL
): AssetManifestRequest[] {
  return manifest.assets
    .filter((asset) => asset.manifest_url)
    .map((asset) => ({
      assetId: asset.id,
      url: new URL(asset.manifest_url!, baseUrl).toString(),
    }));
}

export function parseLineageManifest(
  manifest: LineageManifest,
  assetManifests: Map<string, unknown>
): LineageGraph {
  const normalizedManifests = new Map<string, AssetManifest>();
  assetManifests.forEach((rawManifest, assetId) => {
    const normalized = normalizeAssetManifest(rawManifest);
    if (normalized) {
      normalizedManifests.set(assetId, normalized);
    }
  });

  return buildLineageGraph(manifest, normalizedManifests);
}
