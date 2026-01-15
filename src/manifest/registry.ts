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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getManifestType(raw: unknown): ManifestType | null {
  if (!isRecord(raw)) return null;
  const value = raw.manifest_type ?? raw.manifestType;
  if (value === 'c2pa' || value === 'eqty' || value === 'custom') {
    return value;
  }
  return null;
}

export function getAdapter(type: ManifestType): ManifestAdapter<unknown> {
  const adapter = ADAPTERS.find((candidate) => candidate.type === type);
  if (!adapter) {
    throw new Error(`Unsupported manifest type: ${type}`);
  }
  return adapter;
}

function resolveAdapter(raw: unknown): ManifestAdapter<unknown> {
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
}

export async function loadManifest(url: string): Promise<LineageGraph> {
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
