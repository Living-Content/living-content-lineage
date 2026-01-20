import type { LineageGraph } from '../../../../config/types.js';
import type { ManifestAdapter } from '../manifestAdapter.js';
import {
  getAssetManifestRequests,
  parseManifest,
} from '../base/lineageAdapter.js';
import { isManifest, type Manifest } from '../base/lineageTypes.js';
import { mapC2paAssetType } from '../assetTypeMapper.js';

const isC2paManifest = (raw: unknown): raw is Manifest => {
  if (!isManifest(raw)) return false;
  const record = raw as { manifest_type?: string };
  if (record.manifest_type && record.manifest_type !== 'c2pa') return false;
  return true;
};

export const c2paAdapter: ManifestAdapter<Manifest> = {
  type: 'c2pa',
  isCompatible(raw: unknown): raw is Manifest {
    return isC2paManifest(raw);
  },
  getAssetManifestRequests(raw: Manifest, baseUrl: URL) {
    return getAssetManifestRequests(raw, baseUrl);
  },
  parse(
    raw: Manifest,
    assetManifests: Map<string, unknown>
  ): LineageGraph {
    return parseManifest(raw, assetManifests, mapC2paAssetType);
  },
};
