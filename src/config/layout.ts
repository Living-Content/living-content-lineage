/**
 * Layout and positioning constants.
 * Controls spacing between nodes, steps, and workflows.
 */

// View level thresholds (3-level hierarchy)
export const OVERVIEW_THRESHOLD = 0.35; // zoom out past this → workflow overview
export const SESSION_THRESHOLD = 0.15; // zoom out past this → content session

// Workflow tree vertical positioning (normalized 0-1 space)
export const BAND_HEIGHT = 0.4;
export const GAP_BETWEEN_BANDS = 0.1;

// Trace layout (normalized 0-1 space)
export const TRACE_HORIZONTAL_GAP = 0.15;
export const TRACE_VERTICAL_GAP = 0.05;
export const TRACE_CLAIM_GAP = 0.10;
export const TRACE_STEP_PADDING = 0.04;

// Step label positioning (world space pixels)
export const LABEL_WORLD_OFFSET_Y = 80;
export const LABEL_LINE_START_OFFSET = 30;
