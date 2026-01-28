/**
 * Theme utilities with typed CSS variable access
 */
import type { CssVar } from './definitions/index.js';

/**
 * Get a CSS variable value by name.
 * Only accepts valid CSS variable names (with -- prefix).
 */
export function getCssVar(name: CssVar): string {
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

/**
 * Get a CSS variable value as an integer.
 * Parses values like "48px" or "100" to their numeric equivalent.
 */
export function getCssVarInt(name: CssVar): number {
  const value = getCssVar(name);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`CSS variable ${name} value "${value}" is not a valid integer`);
  }
  return parsed;
}

/**
 * Get a CSS variable value as a float.
 * Parses values like "0.5" or "1.5" to their numeric equivalent.
 */
export function getCssVarFloat(name: CssVar): number {
  const value = getCssVar(name);
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`CSS variable ${name} value "${value}" is not a valid number`);
  }
  return parsed;
}

function colorStringToValue(colorString: string): number {
  // Support rgb() format
  const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return (r << 16) | (g << 8) | b;
  }
  // Support rgba() format (ignoring alpha for hex conversion)
  const rgbaMatch = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    return (r << 16) | (g << 8) | b;
  }
  throw new Error(`Unsupported color format: ${colorString}`);
}

/**
 * Get a color value from CSS variable by name.
 * Returns numeric hex value for Pixi.js graphics.
 */
export function getCssVarColorHex(cssVarName: CssVar): number {
  return colorStringToValue(getCssVar(cssVarName));
}
