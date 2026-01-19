/**
 * Structured error types for manifest loading.
 * Provides detailed error information for debugging and user feedback.
 */

export interface AssetLoadResult {
  assetId: string;
  success: boolean;
  error?: string;
}

export class ManifestLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly failedAssets?: AssetLoadResult[]
  ) {
    super(message);
    this.name = 'ManifestLoadError';
  }
}

export interface ManifestErrorInfo {
  message: string;
  details?: string;
  failedAssets?: AssetLoadResult[];
}
