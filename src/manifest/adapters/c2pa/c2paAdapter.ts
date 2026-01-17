import type { AssetType, LineageGraph } from '../../../types.js';
import type { ManifestAdapter } from '../manifestAdapter.js';
import {
  getLineageAssetManifestRequests,
  parseLineageManifest,
} from '../base/lineageAdapter.js';
import { isLineageManifest, type LineageManifest } from '../base/lineageTypes.js';

function isC2paManifest(raw: unknown): raw is LineageManifest {
  if (!isLineageManifest(raw)) return false;
  const record = raw as { manifest_type?: string };
  if (record.manifest_type && record.manifest_type !== 'c2pa') return false;
  return true;
}

/**
 * Maps C2PA asset type identifiers and internal labels into AssetType.
 */
function mapAssetType(assetType: string): AssetType {
  if (assetType.startsWith('c2pa.types.model')) return 'Model';
  if (assetType.startsWith('c2pa.types.dataset')) return 'Dataset';

  switch (assetType) {
    case 'Media':
    case 'Document':
    case 'DataObject':
    case 'Dataset':
    case 'Code':
    case 'Model':
    case 'Action':
    case 'Attestation':
    case 'Credential':
      return assetType;
    default:
      throw new Error(`Unsupported asset_type: ${assetType}`);
  }
}

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
    return parseLineageManifest(raw, assetManifests, mapAssetType);
  },
};
