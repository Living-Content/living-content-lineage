import type { LineageGraph } from '../../../types.js';
import type { ManifestAdapter } from '../manifestAdapter.js';
import {
  getLineageAssetManifestRequests,
  parseLineageManifest,
} from '../base/lineageAdapter.js';
import { isLineageManifest, type LineageManifest } from '../base/lineageTypes.js';
import { mapC2paAssetType } from '../assetTypeMapper.js';

const isC2paManifest = (raw: unknown): raw is LineageManifest => {
  if (!isLineageManifest(raw)) return false;
  const record = raw as { manifest_type?: string };
  if (record.manifest_type && record.manifest_type !== 'c2pa') return false;
  return true;
};

export const c2paAdapter: ManifestAdapter<LineageManifest> = {
  type: 'c2pa',
  isCompatible(raw: unknown): raw is LineageManifest {
    return isC2paManifest(raw);
  },
  getAssetManifestRequests(raw: LineageManifest, baseUrl: URL) {
    return getLineageAssetManifestRequests(raw, baseUrl);
  },
  parse(
    raw: LineageManifest,
    assetManifests: Map<string, unknown>
  ): LineageGraph {
    return parseLineageManifest(raw, assetManifests, mapC2paAssetType);
  },
};
