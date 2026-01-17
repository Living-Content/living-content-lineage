import type { AssetType, NodeType, WorkflowPhase } from '../types.js';

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
  store: {
    color: getCssVar('--node-store-color'),
    borderStyle: 'solid',
  },
  media: {
    color: getCssVar('--node-media-color'),
  },
  stage: {
    color: getCssVar('--node-stage-color'),
  },
};

export const ASSET_TYPE_COLORS: Partial<Record<AssetType, string>> = {
  Model: getCssVar('--asset-model'),
  Code: getCssVar('--asset-code'),
  Document: getCssVar('--asset-document'),
  DataObject: getCssVar('--asset-data'),
  Dataset: getCssVar('--asset-dataset'),
};

export const ASSET_TYPE_ICON_PATHS: Record<AssetType, string> = {
  Media: '/icons/assets/media.svg',
  Document: '/icons/assets/document.svg',
  DataObject: '/icons/assets/dataobject.svg',
  Dataset: '/icons/assets/dataset.svg',
  Code: '/icons/assets/code.svg',
  Model: '/icons/assets/model.svg',
  Action: '/icons/assets/action.svg',
  Attestation: '/icons/assets/attestation.svg',
  Credential: '/icons/assets/credential.svg',
};

export const PHASE_ICON_PATHS: Record<WorkflowPhase, string> = {
  Acquisition: '/icons/phases/acquisition.svg',
  Preparation: '/icons/phases/preparation.svg',
  Retrieval: '/icons/phases/retrieval.svg',
  Reasoning: '/icons/phases/reasoning.svg',
  Generation: '/icons/phases/generation.svg',
  Persistence: '/icons/phases/persistence.svg',
};

export const PHASE_COLORS: Record<WorkflowPhase, string> = {
  Acquisition: '#EF2D2D',
  Preparation: '#FF595E',
  Retrieval: '#FFCA3A',
  Reasoning: '#8AC926',
  Generation: '#1982C4',
  Persistence: '#0054AF',
};

export const DEFAULT_NODE_SIZE = 14;
export const META_NODE_SIZE = 14;

/**
 * Configuration for icon-based node rendering.
 * Nodes with entries here render as icons instead of text pills.
 */
export const ICON_NODE_CONFIG: Partial<Record<NodeType, { size: number; iconPath: string }>> = {
  attestation: { size: 56, iconPath: ASSET_TYPE_ICON_PATHS.Attestation },
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
  return ICON_NODE_CONFIG[nodeType] ?? null;
}
