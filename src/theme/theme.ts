import type { AssetType, NodeType, Phase } from '../config/types.js';

export function getCssVar(name: string): string {
  if (typeof window === 'undefined') {
    throw new Error(`Cannot read CSS variable ${name}: window is undefined`);
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!value) {
    throw new Error(`CSS variable ${name} is not defined`);
  }
  return value;
}

export function getAssetIconPath(assetType: AssetType): string {
  return `/icons/assets/${assetType.toLowerCase()}.svg`;
}

export function getPhaseIconPath(phase: Phase): string {
  return `/icons/phases/${phase.toLowerCase()}.svg`;
}

function colorStringToValue(colorString: string): number {
  const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return (r << 16) | (g << 8) | b;
  }
  throw new Error(`Unsupported color format: ${colorString}`);
}

/**
 * Get a color value from CSS variable by name.
 * Returns numeric value for Pixi.js graphics.
 */
export function getColor(cssVarName: string): number {
  return colorStringToValue(getCssVar(cssVarName));
}


/**
 * Returns icon configuration for a node type, or null if it uses standard rendering.
 */
export function getIconNodeConfig(nodeType: NodeType): { size: number; iconPath: string } | null {
  if (nodeType === 'attestation') {
    return { size: parseInt(getCssVar('--attestation-icon-size')), iconPath: getAssetIconPath('Attestation') };
  }
  return null;
}

/**
 * Returns true if the node type should render as an icon.
 */
export function isIconNode(nodeType: NodeType): boolean {
  return getIconNodeConfig(nodeType) !== null;
}
