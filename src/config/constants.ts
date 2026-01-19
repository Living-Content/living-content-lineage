/**
 * Graph visualization constants.
 * Colors come from CSS variables in theme.css
 */

// Zoom
export const ZOOM_MIN = 0.15;
export const ZOOM_MAX = 1.3;
export const ZOOM_DEFAULT = 0.8;
export const ZOOM_FACTOR = 0.95;

// LOD (Level of Detail)
export const LOD_THRESHOLD = 0.3;
export const LOD_ANIMATION_MS = 300;

// Text simplification threshold (switches from detailed to simple node labels)
export const TEXT_SIMPLIFY_THRESHOLD = 0.5;

// Workflow nodes (collapsed view)
export const WORKFLOW_NODE_SCALE = 4.0;

// Panel layout (behavioral thresholds)
export const PANEL_MIN_EXPANDED_WIDTH = 500;
export const PANEL_MIN_EXPANDED_HEIGHT = 300;

// Viewport bounds (pixels)
export const VIEWPORT_TOP_MARGIN = 180;
export const VIEWPORT_BOTTOM_MARGIN = 100;
