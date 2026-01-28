/**
 * Node rendering dimension constants.
 * Base dimensions are scaled by the graph scale factor during rendering.
 */

// Text simplification threshold (switches from detailed to simple node labels)
export const TEXT_SIMPLIFY_THRESHOLD = 0.5;

// Node grouping precision
export const GROUP_KEY_PRECISION = 1000;

// Base font sizes (will be scaled)
export const BASE_TYPE_LABEL_FONT_SIZE = 13;
export const BASE_MAIN_LABEL_FONT_SIZE = 18;
export const BASE_SIMPLE_TYPE_FONT_SIZE = 20;

// Base dimensions (will be scaled)
export const BASE_ICON_DIAMETER = 36;
export const BASE_NODE_HEIGHT_DETAILED = 56;
export const BASE_NODE_HEIGHT_SIMPLE = 48;

// Base padding (will be scaled)
export const BASE_LEFT_PADDING = 16;
export const BASE_ICON_TEXT_GAP = 12;
export const BASE_RIGHT_PADDING = 16;
export const BASE_SIMPLE_HORIZONTAL_PADDING = 24;

// Node width constraints (applied after scaling)
export const MIN_NODE_WIDTH = 120;
export const MAX_NODE_WIDTH = 300;
