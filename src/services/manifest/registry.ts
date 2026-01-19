import type { ManifestType, LineageGraph } from '../../config/types.js';
import type { ManifestAdapter } from './adapters/manifestAdapter.js';
import { c2paAdapter } from './adapters/c2pa/c2paAdapter.js';
import { eqtyAdapter } from './adapters/eqty/eqtyAdapter.js';
import { customAdapter } from './adapters/custom/customAdapter.js';
import { ManifestLoadError, type AssetLoadResult } from './errors.js';

const ADAPTERS: ManifestAdapter<unknown>[] = [
  c2paAdapter,
  eqtyAdapter,
  customAdapter,
];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const getManifestType = (raw: unknown): ManifestType | null => {
  if (!isRecord(raw)) return null;
  const value = raw.manifest_type ?? raw.manifestType;
  if (value === 'c2pa' || value === 'eqty' || value === 'custom') {
    return value;
  }
  return null;
};

export const getAdapter = (type: ManifestType): ManifestAdapter<unknown> => {
  const adapter = ADAPTERS.find((candidate) => candidate.type === type);
  if (!adapter) {
    throw new Error(`Unsupported manifest type: ${type}`);
  }
  return adapter;
};

const resolveAdapter = (raw: unknown): ManifestAdapter<unknown> => {
  const explicitType = getManifestType(raw);
  if (explicitType) {
    const adapter = getAdapter(explicitType);
    if (!adapter.isCompatible(raw)) {
      throw new Error(`Manifest did not match adapter for ${explicitType}`);
    }
    return adapter;
  }

  const compatible = ADAPTERS.filter((adapter) => adapter.isCompatible(raw));
  if (compatible.length === 1) return compatible[0];
  if (compatible.length === 0) {
    throw new Error('Manifest type could not be determined');
  }
  throw new Error('Manifest matched multiple adapters');
};

export const loadManifest = async (url: string): Promise<LineageGraph> => {
  const manifestUrl = new URL(url, window.location.href);
  const response = await fetch(manifestUrl.toString());
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.statusText}`);
  }

  const raw = (await response.json()) as unknown;
  const adapter = resolveAdapter(raw);

  const baseUrl = new URL('.', manifestUrl);
  const assetRequests = adapter.getAssetManifestRequests(raw, baseUrl);

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

  return adapter.parse(raw, assetManifests);
};
