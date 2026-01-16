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
export const ATTESTATION_NODE_SIZE = 16;
export const META_NODE_SIZE = 14;
