/**
 * Theme public API
 *
 * Import theme utilities from this module:
 * import { getCssVar, getColor } from './themes';
 */

// Re-export theme utilities
export {
  getCssVar,
  getCssVarInt,
  getCssVarFloat,
  getCssVarColorHex,
} from './theme.js';

// Re-export types
export type { CssVar, CssVarName } from './definitions/index.js';
