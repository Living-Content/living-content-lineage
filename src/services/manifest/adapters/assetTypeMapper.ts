import type { AssetType } from '../../../config/types.js';

const VALID_ASSET_TYPES: Record<string, AssetType> = {
  Media: 'Media',
  Document: 'Document',
  Data: 'Data',
  Code: 'Code',
  Model: 'Model',
  Action: 'Action',
  Claim: 'Claim',
};

export const mapAssetType = (assetType: string): AssetType => {
  const mapped = VALID_ASSET_TYPES[assetType];
  if (!mapped) throw new Error(`Unsupported asset_type: ${assetType}`);
  return mapped;
};
