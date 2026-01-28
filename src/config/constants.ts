/**
 * Graph visualization constants.
 * Colors come from CSS variables in theme.css
 */

// Zoom
export const ZOOM_MIN = 0.15;
export const ZOOM_MAX = 1.3;
export const ZOOM_DEFAULT = 0.8;
export const ZOOM_FACTOR = 0.95;

// View level thresholds (3-level hierarchy)
export const OVERVIEW_THRESHOLD = 0.35; // zoom out past this → workflow overview
export const SESSION_THRESHOLD = 0.15; // zoom out past this → content session

// Text simplification threshold (switches from detailed to simple node labels)
export const TEXT_SIMPLIFY_THRESHOLD = 0.5;

// Panel layout (behavioral thresholds)
export const PANEL_MIN_EXPANDED_WIDTH = 500;
export const PANEL_MIN_EXPANDED_HEIGHT = 300;

// Viewport bounds (pixels)
export const VIEWPORT_TOP_MARGIN = 80;
export const VIEWPORT_BOTTOM_MARGIN = 100;

// Connector gap between workflows (pixels)
export const CONNECTOR_GAP = 100;

// Graph scaling
export const GRAPH_SCALE_FACTOR = 1.5;
export const GROUP_KEY_PRECISION = 1000;

// Content parsing
export const SUMMARY_VALUE_MAX_LENGTH = 100;

// Detail Panel Layout
export const DETAIL_PANEL_WIDTH = 360;
export const DETAIL_PANEL_MAX_HEIGHT_OFFSET = 100;
