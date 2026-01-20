import type { LineageGraph } from '../../../../config/types.js';
import type { ManifestAdapter } from '../manifestAdapter.js';
import {
  getAssetManifestRequests,
  parseManifest,
} from '../base/lineageAdapter.js';
import { isManifest, type Manifest } from '../base/lineageTypes.js';
import { isCustomManifest } from './customTypes.js';
import { mapAssetType } from '../assetTypeMapper.js';

export const customAdapter: ManifestAdapter<Manifest> = {
  type: 'custom',
  isCompatible(raw: unknown): raw is Manifest {
    return isCustomManifest(raw) && isManifest(raw);
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
