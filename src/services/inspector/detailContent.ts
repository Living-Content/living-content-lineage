import type { TraceNodeData } from '../../config/types.js';
import { getDisplayConfig, getDetailOnlyFields, getValueByPath } from '../../config/display.js';

/**
 * Determines whether a node has detail content for the detail panel.
 */
export const hasDetailContent = (node: TraceNodeData): boolean => {
  // Check for known detail content
  if (node.assetManifest?.sourceCode) return true;
  if (node.assetManifest?.data?.response) return true;
  if (node.assetManifest?.data?.query) return true;
  if (node.assetManifest?.assertions?.length) return true;
  if (node.assetManifest?.ingredients?.length) return true;

  // Check if there are any detail-only fields with values
  const config = getDisplayConfig(node.assetType);
  const detailOnlyFields = getDetailOnlyFields(config);
  const data = node.assetManifest?.data ?? {};

  for (const [key] of detailOnlyFields) {
    const value = getValueByPath(data as Record<string, unknown>, key);
    if (value !== undefined && value !== null && value !== '') {
      return true;
    }
  }

  return false;
};
