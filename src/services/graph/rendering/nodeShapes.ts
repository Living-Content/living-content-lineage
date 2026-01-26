/**
 * Node shape geometry constants.
 */

import { GEOMETRY } from '../../../config/animationConstants.js';

/**
 * Content offset for text/icon placement (accounts for phase bar).
 */
export const getContentOffset = (): number => {
  return GEOMETRY.PHASE_BAR_WIDTH;
};
