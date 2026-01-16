import type { AssetType, LineageGraph } from '../../../types.js';
import type { ManifestAdapter } from '../manifestAdapter.js';
import {
  getLineageAssetManifestRequests,
  parseLineageManifest,
} from '../base/lineageAdapter.js';
import {
  isLineageManifest,
  type LineageManifest,
} from '../base/lineageTypes.js';
import { isEqtyManifest } from './eqtyTypes.js';

// Maps manifest asset_type strings to internal AssetType values.
function mapAssetType(assetType: string): AssetType {
  switch (assetType) {
    case 'Model':
    case 'Code':
    case 'Action':
    case 'Data':
    case 'Document':
    case 'Dataset':
    case 'Media':
      return assetType;
    default:
      throw new Error(`Unsupported asset_type: ${assetType}`);
  }
}

export const eqtyAdapter: ManifestAdapter<LineageManifest> = {
  type: 'eqty',
  isCompatible(raw: unknown): raw is LineageManifest {
    return isEqtyManifest(raw) && isLineageManifest(raw);
  },
  getAssetManifestRequests(raw: LineageManifest, baseUrl: URL) {
    return getLineageAssetManifestRequests(raw, baseUrl);
  },
  parse(
    raw: LineageManifest,
    assetManifests: Map<string, unknown>
  ): LineageGraph {
    return parseLineageManifest(raw, assetManifests, mapAssetType);
  },
};
