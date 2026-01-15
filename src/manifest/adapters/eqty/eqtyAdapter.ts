import type { LineageGraph } from '../../types.js';
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

export const eqtyAdapter: ManifestAdapter<LineageManifest> = {
  type: 'eqty',
  isCompatible(raw: unknown): raw is LineageManifest {
    return isEqtyManifest(raw) && isLineageManifest(raw);
  },
  getAssetManifestRequests(raw: LineageManifest, baseUrl: string) {
    return getLineageAssetManifestRequests(raw, baseUrl);
  },
  parse(
    raw: LineageManifest,
    assetManifests: Map<string, unknown>
  ): LineageGraph {
    return parseLineageManifest(raw, assetManifests);
  },
};
