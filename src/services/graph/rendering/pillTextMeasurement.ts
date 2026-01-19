/**
 * Text measurement utilities for pill node layout.
 */
import { getCssVar } from '../../../theme/theme.js';
import type { PillRenderOptions } from './nodeRenderer.js';

// Base dimensions (will be scaled)
export const BASE_TYPE_LABEL_FONT_SIZE = 13;
export const BASE_MAIN_LABEL_FONT_SIZE = 18;
export const BASE_SIMPLE_TYPE_FONT_SIZE = 16;
export const BASE_ICON_DIAMETER = 36;
export const BASE_PILL_HEIGHT_DETAILED = 56;
export const BASE_PILL_HEIGHT_SIMPLE = 48;
export const BASE_LEFT_PADDING = 10;
export const BASE_ICON_TEXT_GAP = 12;
export const BASE_RIGHT_PADDING = 20;

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

export const getNodeFontFamily = (): string => {
  return getCssVar('--font-sans', '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif');
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

export const calculatePillWidth = (options: PillRenderOptions, dims: ScaledDimensions, scale: number): number => {
  const textStartX = dims.leftPadding + dims.iconDiameter + dims.iconTextGap;
  const rightPadding = BASE_RIGHT_PADDING * scale;

  if (options.mode === 'detailed' && options.mainLabel) {
    const typeWidth = measureText(options.typeLabel, dims.typeLabelFontSize);
    const mainWidth = measureText(options.mainLabel, dims.mainLabelFontSize);
    const maxTextWidth = Math.max(typeWidth, mainWidth);
    return textStartX + maxTextWidth + rightPadding;
  } else {
    const typeWidth = measureText(options.typeLabel, dims.simpleTypeFontSize);
    return textStartX + typeWidth + rightPadding;
  }
};

export { measureCtx };
