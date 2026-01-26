/**
 * Node shape geometry constants.
 */

import { GEOMETRY } from '../../../config/animationConstants.js';

/**
 * Content offset for text/icon placement (accounts for highlight bar).
 */
export const getContentOffset = (): number => {
  return GEOMETRY.HIGHLIGHT_BAR_WIDTH;
};
