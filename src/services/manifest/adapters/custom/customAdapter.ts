import type { LineageGraph } from '../../../../config/types.js';
import type { ManifestAdapter } from '../manifestAdapter.js';
import {
  getLineageAssetManifestRequests,
  parseLineageManifest,
} from '../base/lineageAdapter.js';
import { isLineageManifest, type LineageManifest } from '../base/lineageTypes.js';
import { isCustomManifest } from './customTypes.js';
import { mapAssetType } from '../assetTypeMapper.js';

export const customAdapter: ManifestAdapter<LineageManifest> = {
  type: 'custom',
  isCompatible(raw: unknown): raw is LineageManifest {
    return isCustomManifest(raw) && isLineageManifest(raw);
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
