import type { LineageGraph, ManifestType } from '../../types.js';
import type { AssetManifestRequest } from './assetManifestRequest.js';

export interface ManifestAdapter<TRaw> {
  readonly type: ManifestType;
  isCompatible(raw: unknown): raw is TRaw;
  getAssetManifestRequests(raw: TRaw, baseUrl: string): AssetManifestRequest[];
  parse(raw: TRaw, assetManifests: Map<string, unknown>): LineageGraph;
}
