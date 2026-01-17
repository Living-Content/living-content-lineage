/**
 * Graph visualization constants.
 * Colors come from CSS variables in theme.css
 */

// Zoom
export const ZOOM_MIN = 0.3;
export const ZOOM_MAX = 1.3;
export const ZOOM_DEFAULT = 0.8;
export const ZOOM_FACTOR = 0.95;

// LOD (Level of Detail) - hysteresis to prevent oscillation
export const LOD_COLLAPSE_THRESHOLD = 0.65; // Collapse when zooming out past this
export const LOD_EXPAND_THRESHOLD = 0.75;   // Expand when zooming in past this
export const LOD_THRESHOLD = 0.7;           // Legacy - use for callbacks
export const LOD_ANIMATION_MS = 300;

// Stage nodes (collapsed view)
export const STAGE_NODE_SCALE = 2.0;

// Selection highlighting
export const FADED_NODE_ALPHA = 0.25;

// Edges
export const EDGE_WIDTH = 2;
export const EDGE_DOT_RADIUS = 4;

// Stage edges (collapsed view)
export const STAGE_EDGE_WIDTH = 3;
export const STAGE_DOT_RADIUS = 6;

// Stage labels
export const STAGE_LABEL_FONT_SIZE = 20;
export const STAGE_LABEL_TOP_PADDING = 80;
export const STAGE_LABEL_LINE_START = 30;
