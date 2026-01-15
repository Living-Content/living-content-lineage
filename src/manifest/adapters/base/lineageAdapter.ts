import type { AssetManifest, LineageGraph } from '../../../types.js';
import type { AssetManifestRequest } from '../assetManifestRequest.js';
import type { LineageManifest } from './lineageTypes.js';
import { normalizeAssetManifest } from './assetManifestMapper.js';
import { buildLineageGraph } from './lineageParser.js';

export function getLineageAssetManifestRequests(
  manifest: LineageManifest,
  baseUrl: string
): AssetManifestRequest[] {
  return manifest.assets
    .filter((asset) => asset.manifest_url)
    .map((asset) => ({
      assetId: asset.id,
      url: asset.manifest_url!.startsWith('./')
        ? `${baseUrl}${asset.manifest_url!.slice(2)}`
        : asset.manifest_url!,
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
