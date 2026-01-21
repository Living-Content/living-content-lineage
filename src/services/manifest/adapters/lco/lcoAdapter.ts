import type { LineageGraph } from '../../../../config/types.js';
import type { ManifestAdapter } from '../manifestAdapter.js';
import {
  getAssetManifestRequests,
  parseManifest,
} from '../base/lineageAdapter.js';
import { isManifest, type Manifest } from '../base/lineageTypes.js';
import { isLcoManifest } from './lcoTypes.js';
import { mapAssetType } from '../assetTypeMapper.js';

/**
 * Adapter for LCO (Living Content) manifest format.
 */
export const lcoAdapter: ManifestAdapter<Manifest> = {
  type: 'lco',
  isCompatible(raw: unknown): raw is Manifest {
    return isLcoManifest(raw) && isManifest(raw);
  },
  getAssetManifestRequests(raw: Manifest, baseUrl: URL) {
    return getAssetManifestRequests(raw, baseUrl);
  },
  parse(
    raw: Manifest,
    assetManifests: Map<string, unknown>
  ): LineageGraph {
    return parseManifest(raw, assetManifests, mapAssetType);
  },
};
