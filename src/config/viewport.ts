/**
 * Viewport and zoom constants.
 */

// Zoom limits and defaults
export const ZOOM_MIN = 0.3;
export const ZOOM_MAX = 1.3;
export const ZOOM_DEFAULT = 0.8;

// View-level-specific initial zoom minimums (prevents starting too zoomed out)
export const VIEW_INITIAL_ZOOM_MIN = {
  'content-session': 0.8,
  'workflow-overview': 0.8,
  'workflow-detail': 0.9,
} as const;

// Zoom sensitivity
export const ZOOM_SENSITIVITY = 0.02;

// Graph scaling
export const GRAPH_SCALE_FACTOR = 1.5;
