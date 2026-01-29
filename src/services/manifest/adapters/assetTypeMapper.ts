import { isValidAssetType, type AssetType } from '../../../config/types.js';

export const mapAssetType = (assetType: string): AssetType => {
  if (!isValidAssetType(assetType)) {
    throw new Error(`Unsupported asset_type: ${assetType}`);
  }
  return assetType;
};
