/**
 * Text measurement utilities for node layout.
 * Handles dimension calculations for pill and chevron shapes.
 */
import { getCssVar } from '../../../themes/index.js';
import { getShape, type NodeShapeType } from './nodeShapes.js';
import type { NodeRenderOptions } from './nodeRenderer.js';

// Base dimensions (will be scaled)
export const BASE_TYPE_LABEL_FONT_SIZE = 13;
export const BASE_MAIN_LABEL_FONT_SIZE = 18;
export const BASE_SIMPLE_TYPE_FONT_SIZE = 16;
export const BASE_ICON_DIAMETER = 36;
export const BASE_NODE_HEIGHT_DETAILED = 56;
export const BASE_NODE_HEIGHT_SIMPLE = 48;
export const BASE_LEFT_PADDING = 10;
export const BASE_ICON_TEXT_GAP = 12;
export const BASE_RIGHT_PADDING = 12;

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

export const getNodeFontFamily = (): string => {
  return getCssVar('--font-sans');
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

/**
 * Calculate the total width of a node based on its render options.
 * For chevron shapes, adds extra width for the arrow point.
 */
export const calculateNodeWidth = (
  options: NodeRenderOptions,
  dims: ScaledDimensions,
  scale: number,
  shapeType: NodeShapeType = 'pill'
): number => {
  const nodeHeight = options.mode === 'detailed'
    ? BASE_NODE_HEIGHT_DETAILED * scale
    : BASE_NODE_HEIGHT_SIMPLE * scale;

  const shape = getShape(shapeType);
  const contentOffset = shape.getContentOffset(nodeHeight);

  // Content starts after left padding (+ content offset for chevron)
  const textStartX = contentOffset + dims.leftPadding + dims.iconDiameter + dims.iconTextGap;
  const rightPadding = BASE_RIGHT_PADDING * scale;

  let baseWidth: number;
  if (options.mode === 'detailed' && options.mainLabel) {
    const typeWidth = measureText(options.typeLabel, dims.typeLabelFontSize);
    const mainWidth = measureText(options.mainLabel, dims.mainLabelFontSize);
    const maxTextWidth = Math.max(typeWidth, mainWidth);
    baseWidth = textStartX + maxTextWidth + rightPadding;
  } else {
    const typeWidth = measureText(options.typeLabel, dims.simpleTypeFontSize);
    baseWidth = textStartX + typeWidth + rightPadding;
  }

  // Add extra width for shape (e.g., chevron arrow point)
  return baseWidth + shape.getExtraWidth(nodeHeight);
};

export { measureCtx };
