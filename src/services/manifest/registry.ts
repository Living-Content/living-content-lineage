import type { LineageGraph } from '../../config/types.js';
import { getAssetManifestRequests, parseManifest } from './adapters/base/lineageAdapter.js';
import { isManifest } from './adapters/base/lineageTypes.js';
import { mapAssetType } from './adapters/assetTypeMapper.js';
import type { AssetLoadResult } from './errors.js';

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

  const assetManifests = new Map<string, unknown>();
  const results: AssetLoadResult[] = await Promise.all(
    assetRequests.map(async (request): Promise<AssetLoadResult> => {
      try {
        const res = await fetch(request.url);
        if (!res.ok) {
          return { assetId: request.assetId, success: false, error: `HTTP ${res.status}` };
        }
        const manifest = (await res.json()) as unknown;
        assetManifests.set(request.assetId, manifest);
        return { assetId: request.assetId, success: true };
      } catch (error) {
        return { assetId: request.assetId, success: false, error: String(error) };
      }
    })
  );

  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.warn(`Failed to load ${failed.length} asset manifest(s):`, failed);
  }

  return parseManifest(raw, assetManifests, mapAssetType);
};
