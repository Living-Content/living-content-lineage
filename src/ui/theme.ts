import type { AssetType, NodeType } from '../types.js';

export function getCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export const NODE_STYLES: Record<
  NodeType,
  {
    color: string;
    borderColor: string;
    iconColor: string;
    borderStyle?: string;
  }
> = {
  data: {
    color: getCssVar('--node-data-color', '#ffffff'),
    borderColor: getCssVar('--node-data-border', '#1a1a1a'),
    iconColor: getCssVar('--node-data-icon', '#1a1a1a'),
  },
  compute: {
    color: getCssVar('--node-compute-color', '#ffffff'),
    borderColor: getCssVar('--node-compute-border', '#ec4899'),
    iconColor: getCssVar('--node-compute-icon', '#ec4899'),
    borderStyle: 'dashed',
  },
  attestation: {
    color: getCssVar('--node-attestation-color', '#ffffff'),
    borderColor: getCssVar('--node-attestation-border', '#22c55e'),
    iconColor: getCssVar('--node-attestation-icon', '#22c55e'),
  },
  filter: {
    color: getCssVar('--node-filter-color', '#ffffff'),
    borderColor: getCssVar('--node-filter-border', '#1a1a1a'),
    iconColor: getCssVar('--node-filter-icon', '#1a1a1a'),
  },
  join: {
    color: getCssVar('--node-join-color', '#ffffff'),
    borderColor: getCssVar('--node-join-border', '#1a1a1a'),
    iconColor: getCssVar('--node-join-icon', '#1a1a1a'),
  },
  store: {
    color: getCssVar('--node-store-color', '#fef3c7'),
    borderColor: getCssVar('--node-store-border', '#ec4899'),
    iconColor: getCssVar('--node-store-icon', '#d97706'),
    borderStyle: 'solid',
  },
  media: {
    color: getCssVar('--node-media-color', '#ffffff'),
    borderColor: getCssVar('--node-media-border', '#1a1a1a'),
    iconColor: getCssVar('--node-media-icon', '#1a1a1a'),
  },
  meta: {
    color: getCssVar('--node-meta-color', '#f0f4f8'),
    borderColor: getCssVar('--node-meta-border', '#3b82f6'),
    iconColor: getCssVar('--node-meta-icon', '#3b82f6'),
  },
};

export const ASSET_TYPE_COLORS: Partial<Record<AssetType, string>> = {
  Model: getCssVar('--asset-model', '#000000'),
  Code: getCssVar('--asset-code', '#9ca3af'),
  Document: getCssVar('--asset-document', '#22d3ee'),
  Data: getCssVar('--asset-data', '#fb923c'),
  Dataset: getCssVar('--asset-dataset', '#3b82f6'),
};

export const NODE_ICON_PATHS: Record<NodeType, string> = {
  data: '/icons/data.svg',
  compute: '/icons/compute.svg',
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
export const META_NODE_SIZE = 24;
