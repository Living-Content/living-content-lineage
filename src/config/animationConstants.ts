/**
 * Centralized animation timing and geometry constants.
 * Consolidates magic numbers from rendering and interaction modules.
 */

export const ANIMATION_TIMINGS = {
  /** Duration for selection ring draw animation (seconds) */
  SELECTION_DRAW_DURATION: 0.5,
  /** Duration for selection ring fade out (seconds) */
  SELECTION_FADE_DURATION: 0.15,
  /** Base duration for LOD transitions (seconds) */
  LOD_DURATION: 0.5,
  /** Factor for outgoing layer fade during LOD */
  LOD_FADE_OUT_FACTOR: 0.5,
  /** Delay factor for incoming layer during LOD */
  LOD_FADE_IN_DELAY_FACTOR: 0.3,
  /** Duration factor for incoming layer during LOD */
  LOD_FADE_IN_DURATION_FACTOR: 0.6,
  /** Panel entrance animation duration (seconds) */
  PANEL_ENTRANCE_DURATION: 0.3,
  /** Panel detail view transition duration (seconds) */
  PANEL_DETAIL_DURATION: 0.2,
  /** Viewport pan animation duration (seconds) */
  VIEWPORT_PAN_DURATION: 0.3,
  /** Text mode transition duration (seconds) */
  TEXT_MODE_DURATION: 0.25,
  /** Node expansion scale animation duration (seconds) */
  NODE_EXPANSION_DURATION: 0.3,
  /** Node fade to background opacity duration (seconds) */
  NODE_FADE_DURATION: 0.2,
  /** Overlay fade in duration after node expansion (seconds) */
  OVERLAY_FADE_DURATION: 0.2,
  /** Hover pulse animation duration (seconds) */
  HOVER_PULSE_DURATION: 0.15,
};

export const GEOMETRY = {
  /** Badge radius as factor of node height */
  BADGE_RADIUS_FACTOR: 0.32,
  /** Additional width padding for badge nodes */
  BADGE_WIDTH_PADDING: 56,
  /** Padding around selection ring */
  SELECTION_RING_PADDING: 6,
  /** Stroke width for selection ring */
  SELECTION_RING_STROKE_WIDTH: 3,
  /** Width of highlight bar on nodes */
  HIGHLIGHT_BAR_WIDTH: 6,
  /** Width of highlight bar on hover */
  HIGHLIGHT_BAR_WIDTH_HOVER: 10,
  /** Border radius for nodes */
  NODE_BORDER_RADIUS: 4,
  /** Scale factor for expanded node */
  EXPANDED_NODE_SCALE: 2.5,
  /** Duration for highlight bar hover animation (seconds) */
  HIGHLIGHT_BAR_HOVER_DURATION: 0.15,
  /** Gap between node and overlay (pixels) */
  OVERLAY_GAP: 20,
};
