import type { AssetType, NodeType } from '../types.js';

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  data: 'Data',
  process: 'Process',
  attestation: 'Verification',
  filter: 'Filter',
  join: 'Merge',
  store: 'Storage',
  media: 'Media',
  meta: 'Stage',
};

export const ASSET_TYPE_LABELS: Partial<Record<AssetType, string>> = {
  Model: 'Model',
  Code: 'Code',
  Action: 'Action',
  Data: 'Data',
  Document: 'Document',
  Dataset: 'Dataset',
  Media: 'Media',
};

export function formatNodeTypeLabel(nodeType: NodeType): string {
  return NODE_TYPE_LABELS[nodeType] ?? 'Node';
}

export function formatAssetTypeLabel(assetType?: AssetType): string {
  if (!assetType) return '';
  return ASSET_TYPE_LABELS[assetType] ?? assetType;
}
