/**
 * Centralized animation timing and geometry constants.
 * Consolidates magic numbers from rendering and interaction modules.
 */

export const ANIMATION_TIMINGS = {
  /** Duration for selection ring draw animation (seconds) */
  SELECTION_DRAW_DURATION: 0.5,
  /** Duration for selection ring fade out (seconds) */
  SELECTION_FADE_DURATION: 0.15,
  /** View level transition fade duration (seconds) */
  VIEW_LEVEL_FADE_DURATION: 0.3,
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
  /** Node crossfade in duration for mode transitions (seconds) */
  NODE_CROSSFADE_IN_DURATION: 0.25,
  /** Node crossfade out duration for mode transitions (seconds) */
  NODE_CROSSFADE_OUT_DURATION: 0.2,
  /** Title overlay animation ease factor */
  TITLE_EASE_FACTOR: 0.15,
  /** Detail panel fade duration for mode transitions (seconds) */
  DETAIL_PANEL_FADE_DURATION: 0.15,
  /** Viewport center animation duration (seconds) */
  VIEWPORT_CENTER_DURATION: 0.3,
  /** Viewport zoom animation duration (seconds) */
  VIEWPORT_ZOOM_DURATION: 0.4,
  /** Node alpha fade animation duration (seconds) */
  NODE_ALPHA_DURATION: 0.3,
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
  /** Title overlay idle alpha */
  TITLE_IDLE_ALPHA: 0.5,
  /** Title animation completion threshold */
  TITLE_ANIMATION_THRESHOLD: 0.01,
};
