/**
 * Icon path utilities for assets and phases.
 */
import type { AssetType, NodeType, Phase } from './types.js';
import { getCssVarInt } from '../themes/index.js';

export function getAssetIconPath(assetType: AssetType): string {
  return `/icons/assets/${assetType.toLowerCase()}.svg`;
}

export function getPhaseIconPath(phase: Phase): string {
  return `/icons/phases/${phase.toLowerCase()}.svg`;
}

/**
 * Returns icon configuration for a node type, or null if it uses standard rendering.
 */
export function getIconNodeConfig(
  nodeType: NodeType
): { size: number; iconPath: string } | null {
  if (nodeType === 'attestation') {
    return {
      size: getCssVarInt('--attestation-icon-size'),
      iconPath: getAssetIconPath('Attestation'),
    };
  }
  return null;
}

/**
 * Returns true if the node type should render as an icon.
 */
export function isIconNode(nodeType: NodeType): boolean {
  return getIconNodeConfig(nodeType) !== null;
}
