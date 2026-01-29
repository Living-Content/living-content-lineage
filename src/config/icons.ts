/**
 * Icon path utilities for assets and phases.
 */
import type { AssetType, NodeType, Phase } from './types.js';
import { getAssetTypeIconName } from './types.js';
import { getCssVarInt } from '../themes/theme.js';

export function getAssetIconPath(assetType: AssetType): string {
  const iconName = getAssetTypeIconName(assetType);
  return `/icons/assets/${iconName}.svg`;
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
  if (nodeType === 'claim') {
    return {
      size: getCssVarInt('--claim-icon-size'),
      iconPath: getAssetIconPath('Claim'),
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
