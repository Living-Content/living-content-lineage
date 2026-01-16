import type { AssetType, NodeType } from '../types.js';

export function getCssVar(name: string, fallback?: string): string {
  if (typeof window === 'undefined') {
    return fallback ?? '';
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback || '';
}

export const NODE_STYLES: Record<
  NodeType,
  {
    color: string;
    borderStyle?: string;
  }
> = {
  data: {
    color: getCssVar('--node-data-color'),
  },
  process: {
    color: getCssVar('--node-compute-color'),
    borderStyle: 'dashed',
  },
  attestation: {
    color: getCssVar('--node-attestation-color'),
  },
  filter: {
    color: getCssVar('--node-filter-color'),
  },
  join: {
    color: getCssVar('--node-join-color'),
  },
  store: {
    color: getCssVar('--node-store-color'),
    borderStyle: 'solid',
  },
  media: {
    color: getCssVar('--node-media-color'),
  },
  meta: {
    color: getCssVar('--node-meta-color'),
  },
};

export const ASSET_TYPE_COLORS: Partial<Record<AssetType, string>> = {
  Model: getCssVar('--asset-model'),
  Code: getCssVar('--asset-code'),
  Document: getCssVar('--asset-document'),
  Data: getCssVar('--asset-data'),
  Dataset: getCssVar('--asset-dataset'),
};

export const NODE_ICON_PATHS: Record<NodeType, string> = {
  data: '/icons/data.svg',
  process: '/icons/compute.svg',
  attestation: '/icons/attestation.svg',
  filter: '/icons/filter.svg',
  join: '/icons/join.svg',
  store: '/icons/store.svg',
  media: '/icons/media.svg',
  meta: '/icons/collection.svg',
};

export const ASSET_TYPE_ICONS: Partial<Record<AssetType, string>> = {
  Code: '/icons/code.svg',
  Document: '/icons/document.svg',
};

export const DEFAULT_NODE_SIZE = 14;
export const META_NODE_SIZE = 14;

/**
 * Configuration for icon-based node rendering.
 * Nodes with entries here render as icons instead of text pills.
 */
export const ICON_NODE_CONFIG: Partial<Record<NodeType, { size: number }>> = {
  attestation: { size: 56 },
};

/**
 * Returns true if the node type should render as an icon.
 */
export function isIconNode(nodeType: NodeType): boolean {
  return nodeType in ICON_NODE_CONFIG;
}

/**
 * Returns the icon configuration for a node type, or null if it uses pill rendering.
 */
export function getIconNodeConfig(nodeType: NodeType): { size: number; iconPath: string } | null {
  const config = ICON_NODE_CONFIG[nodeType];
  if (!config) return null;
  const iconPath = NODE_ICON_PATHS[nodeType];
  return { ...config, iconPath };
}
