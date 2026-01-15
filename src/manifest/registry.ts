import type { ManifestType, LineageGraph } from '../types.js';
import type { ManifestAdapter } from './adapters/manifestAdapter.js';
import { c2paAdapter } from './adapters/c2pa/c2paAdapter.js';
import { eqtyAdapter } from './adapters/eqty/eqtyAdapter.js';
import { customAdapter } from './adapters/custom/customAdapter.js';

const ADAPTERS: ManifestAdapter<unknown>[] = [
  c2paAdapter,
  eqtyAdapter,
  customAdapter,
];

export function getManifestType(raw: unknown): ManifestType {
  if (!raw || typeof raw !== 'object') return 'c2pa';
  const record = raw as Record<string, unknown>;
  const value = record.manifest_type ?? record.manifestType;
  if (value === 'c2pa' || value === 'eqty' || value === 'custom') {
    return value;
  }
  return 'c2pa';
}

export function getAdapter(type: ManifestType): ManifestAdapter<unknown> {
  const adapter = ADAPTERS.find((candidate) => candidate.type === type);
  if (!adapter) {
    throw new Error(`Unsupported manifest type: ${type}`);
  }
  return adapter;
}

export async function loadManifest(url: string): Promise<LineageGraph> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.statusText}`);
  }

  const raw = (await response.json()) as unknown;
  const manifestType = getManifestType(raw);
  const adapter = getAdapter(manifestType);

  if (!adapter.isCompatible(raw)) {
    throw new Error(`Manifest did not match adapter for ${manifestType}`);
  }

  const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
  const assetRequests = adapter.getAssetManifestRequests(raw, baseUrl);

  const assetManifests = new Map<string, unknown>();
  const fetchPromises = assetRequests.map(async (request) => {
    try {
      const res = await fetch(request.url);
      if (res.ok) {
        const manifest = (await res.json()) as unknown;
        assetManifests.set(request.assetId, manifest);
      } else {
        console.warn(`Failed to fetch asset manifest for ${request.assetId}`);
      }
    } catch (error) {
      console.warn(
        `Failed to fetch asset manifest for ${request.assetId}`,
        error
      );
    }
  });

  await Promise.all(fetchPromises);

  return adapter.parse(raw, assetManifests);
}
