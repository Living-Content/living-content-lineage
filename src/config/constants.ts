/**
 * Graph visualization constants.
 * Colors come from CSS variables in theme.css
 */

// Zoom
export const ZOOM_MIN = 0.15;
export const ZOOM_MAX = 1.3;
export const ZOOM_DEFAULT = 0.8;
export const ZOOM_FACTOR = 0.95;

// LOD (Level of Detail) - hysteresis to prevent oscillation
export const LOD_COLLAPSE_THRESHOLD = 0.65; // Collapse when zooming out past this
export const LOD_EXPAND_THRESHOLD = 0.75;   // Expand when zooming in past this
export const LOD_THRESHOLD = 0.7;
export const LOD_ANIMATION_MS = 300;

// Workflow nodes (collapsed view)
export const WORKFLOW_NODE_SCALE = 2.0;

// Panel layout (behavioral thresholds)
export const PANEL_MIN_EXPANDED_WIDTH = 500;
export const PANEL_MIN_EXPANDED_HEIGHT = 300;
