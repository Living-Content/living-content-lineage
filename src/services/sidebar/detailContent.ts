import type { LineageNodeData } from '../../types.js';

/**
 * Determines whether a node has detail content for the detail panel.
 */
export const hasDetailContent = (node: LineageNodeData): boolean => {
  return Boolean(node.assetManifest?.sourceCode) ||
    Boolean(node.assetManifest?.content?.response) ||
    Boolean(node.assetManifest?.content?.query) ||
    Boolean(node.assetManifest?.assertions?.length) ||
    Boolean(node.assetManifest?.ingredients?.length);
};
