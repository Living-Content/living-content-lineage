/**
 * Text measurement utilities for node layout.
 */
import { getCssVar } from '../../../themes/index.js';
import { GEOMETRY } from '../../../config/animationConstants.js';
import type { NodeRenderOptions } from './nodeRenderer.js';

// Base dimensions (will be scaled)
export const BASE_TYPE_LABEL_FONT_SIZE = 13;
export const BASE_MAIN_LABEL_FONT_SIZE = 18;
export const BASE_SIMPLE_TYPE_FONT_SIZE = 20;
export const BASE_ICON_DIAMETER = 36;
export const BASE_NODE_HEIGHT_DETAILED = 56;
export const BASE_NODE_HEIGHT_SIMPLE = 48;
export const BASE_LEFT_PADDING = 16;
export const BASE_ICON_TEXT_GAP = 12;
export const BASE_RIGHT_PADDING = 16;
export const BASE_SIMPLE_HORIZONTAL_PADDING = 24;

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

export const getNodeFontFamily = (type: 'sans' | 'mono' = 'sans'): string => {
  return type === 'mono' ? getCssVar('--font-mono') : getCssVar('--font-sans');
};

export const measureText = (text: string, fontSize: number, fontWeight = '600'): number => {
  measureCtx.font = `${fontWeight} ${fontSize}px ${getNodeFontFamily()}`;
  return measureCtx.measureText(text).width;
};

export interface ScaledDimensions {
  iconDiameter: number;
  leftPadding: number;
  iconTextGap: number;
  typeLabelFontSize: number;
  mainLabelFontSize: number;
  simpleTypeFontSize: number;
}

export const getScaledDimensions = (scale: number): ScaledDimensions => {
  return {
    iconDiameter: BASE_ICON_DIAMETER * scale,
    leftPadding: BASE_LEFT_PADDING * scale,
    iconTextGap: BASE_ICON_TEXT_GAP * scale,
    typeLabelFontSize: BASE_TYPE_LABEL_FONT_SIZE * scale,
    mainLabelFontSize: BASE_MAIN_LABEL_FONT_SIZE * scale,
    simpleTypeFontSize: BASE_SIMPLE_TYPE_FONT_SIZE * scale,
  };
};

// Minimum node width to prevent tiny nodes
export const MIN_NODE_WIDTH = 120;
// Maximum node width before truncation
export const MAX_NODE_WIDTH = 300;

/**
 * Measures text with the correct font.
 */
export const measureTextWithFont = (
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight = '400'
): number => {
  measureCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return measureCtx.measureText(text).width;
};

/**
 * Calculate the total width of a node based on its render options.
 * Dynamically sizes based on text, with min/max constraints.
 */
export const calculateNodeWidth = (
  options: NodeRenderOptions,
  dims: ScaledDimensions,
  scale: number
): number => {
  const contentOffset = GEOMETRY.PHASE_BAR_WIDTH * scale;
  const rightPadding = 12 * scale;

  if (options.mode === 'simple') {
    const horizontalPadding = BASE_SIMPLE_HORIZONTAL_PADDING * scale;
    const textWidth = measureTextWithFont(
      options.typeLabel,
      dims.simpleTypeFontSize,
      getNodeFontFamily(),
      '600'
    );
    const width = contentOffset + horizontalPadding + textWidth + horizontalPadding;
    return Math.max(MIN_NODE_WIDTH * scale, Math.min(MAX_NODE_WIDTH * scale, width));
  }

  // Detailed mode: measure both labels with their respective fonts
  const textStartX = contentOffset + dims.leftPadding;

  // Type label uses sans-serif
  const typeWidth = measureTextWithFont(
    options.typeLabel,
    dims.typeLabelFontSize,
    getNodeFontFamily(),
    '600'
  );

  // Main label uses monospace at larger size
  const mainWidth = options.mainLabel
    ? measureTextWithFont(
        options.mainLabel,
        dims.mainLabelFontSize,
        getNodeFontFamily('mono'),
        '400'
      )
    : 0;

  const maxTextWidth = Math.max(typeWidth, mainWidth);
  const width = textStartX + maxTextWidth + rightPadding;

  return Math.max(MIN_NODE_WIDTH * scale, Math.min(MAX_NODE_WIDTH * scale, width));
};

/**
 * Pre-calculates the width a node would have without creating it.
 */
export const preCalculateNodeWidth = (
  node: { nodeType: string; assetType?: string; title?: string; label: string },
  scale: number
): number => {
  // Icon nodes (claims) have fixed size
  if (node.nodeType === 'claim') return 0; // Claims don't participate in width calculation
  if (node.assetType === 'Action') return 0; // Actions don't participate

  const dims = getScaledDimensions(scale);
  const typeLabel = node.assetType
    ? (node.assetType === 'Data' ? 'DATA' : node.assetType.toUpperCase())
    : 'DATA';
  const mainLabel = node.title ?? node.label;

  const options: NodeRenderOptions = {
    mode: 'detailed',
    iconPath: '',
    typeLabel,
    mainLabel,
  };

  return calculateNodeWidth(options, dims, scale);
};

export const truncateText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string => {
  const measured = ctx.measureText(text);
  if (measured.width <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
};

export { measureCtx };
