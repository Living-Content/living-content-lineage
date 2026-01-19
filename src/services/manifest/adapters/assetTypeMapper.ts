import type { AssetType } from '../../../config/types.js';

const VALID_ASSET_TYPES: Record<string, AssetType> = {
  Media: 'Media',
  Document: 'Document',
  DataObject: 'DataObject',
  Dataset: 'Dataset',
  Code: 'Code',
  Model: 'Model',
  Action: 'Action',
  Attestation: 'Attestation',
  Credential: 'Credential',
};

export const mapAssetType = (assetType: string): AssetType => {
  const mapped = VALID_ASSET_TYPES[assetType];
  if (!mapped) throw new Error(`Unsupported asset_type: ${assetType}`);
  return mapped;
};

export const mapC2paAssetType = (assetType: string): AssetType => {
  if (assetType.startsWith('c2pa.types.model')) return 'Model';
  if (assetType.startsWith('c2pa.types.dataset')) return 'Dataset';
  return mapAssetType(assetType);
};
