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

// Selection highlighting
export const FADED_NODE_ALPHA = 0.25;

// Edges
export const EDGE_WIDTH = 2;
export const EDGE_DOT_RADIUS = 4;
export const EDGE_GAP = 90; // Fixed gap between node edges in pixels

// Workflow edges (collapsed view)
export const WORKFLOW_EDGE_WIDTH = 3;
export const WORKFLOW_DOT_RADIUS = 6;

// Workflow labels
export const WORKFLOW_LABEL_FONT_SIZE = 20;
export const WORKFLOW_LABEL_TOP_PADDING = 80;
export const WORKFLOW_LABEL_LINE_START = 30;

// Panel layout
export const PANEL_MARGIN = 25;
export const PANEL_MIN_EXPANDED_WIDTH = 500;
export const PANEL_MIN_EXPANDED_HEIGHT = 300;
export const PANEL_DETAIL_MAX_WIDTH = 800;
export const HEADER_HEIGHT = 80;
export const WORKFLOW_LABEL_HEIGHT = 50;
export const PANEL_TOP_OFFSET = HEADER_HEIGHT + WORKFLOW_LABEL_HEIGHT;
export const MOBILE_BREAKPOINT = 900;
