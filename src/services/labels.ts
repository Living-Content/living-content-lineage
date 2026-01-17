import type { AssetType, NodeType } from '../types.js';

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  data: 'Data',
  process: 'Process',
  attestation: 'Verification',
  store: 'Storage',
  media: 'Media',
  stage: 'Stage',
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  Media: 'Media',
  Document: 'Document',
  DataObject: 'Data Object',
  Dataset: 'Dataset',
  Code: 'Code',
  Model: 'Model',
  Action: 'Action',
  Attestation: 'Attestation',
  Credential: 'Credential',
};

export function formatNodeTypeLabel(nodeType: NodeType): string {
  return NODE_TYPE_LABELS[nodeType] ?? 'Node';
}

export function formatAssetTypeLabel(assetType?: AssetType): string {
  if (!assetType) return '';
  return ASSET_TYPE_LABELS[assetType] ?? assetType;
}
