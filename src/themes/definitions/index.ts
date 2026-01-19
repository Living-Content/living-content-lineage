/**
 * Theme token definitions - aggregates all token categories
 */
export { baseTokens, type BaseTokenName } from './base';
export { typographyTokens, type TypographyTokenName } from './typography';
export { colorTokens, type ColorTokenName } from './colors';
export { phaseTokens, type PhaseTokenName } from './phases';
export { graphTokens, type GraphTokenName } from './graph';
export { componentTokens, type ComponentTokenName } from './components';

import { baseTokens } from './base';
import { typographyTokens } from './typography';
import { colorTokens } from './colors';
import { phaseTokens } from './phases';
import { graphTokens } from './graph';
import { componentTokens } from './components';

/**
 * All theme tokens combined
 */
export const allTokens = {
  ...baseTokens,
  ...typographyTokens,
  ...colorTokens,
  ...phaseTokens,
  ...graphTokens,
  ...componentTokens,
} as const;

/**
 * Union type of all valid CSS variable names (without -- prefix)
 */
export type CssVarName = keyof typeof allTokens;

/**
 * Union type of all valid CSS variable names (with -- prefix)
 */
export type CssVar = `--${CssVarName}`;
