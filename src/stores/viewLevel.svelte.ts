/**
 * View level state store using Svelte 5 runes.
 * Single source of truth for the 3-level zoom hierarchy.
 *
 * View Levels:
 * - content-session: Highest zoom out (scale < 0.15), shows session cards
 * - workflow-overview: Middle (scale 0.15 - 0.35), shows workflow cards
 * - workflow-detail: Zoomed in (scale > 0.35), shows full node/edge graph
 */

export type ViewLevel = 'content-session' | 'workflow-overview' | 'workflow-detail';

import { OVERVIEW_THRESHOLD, SESSION_THRESHOLD } from '../config/constants.js';

let level = $state<ViewLevel>('workflow-detail');
let isTransitioning = $state(false);
let isLocked = $state(false);

/**
 * Determines the view level based on zoom scale.
 */
const scaleToLevel = (scale: number): ViewLevel => {
  if (scale < SESSION_THRESHOLD) return 'content-session';
  if (scale < OVERVIEW_THRESHOLD) return 'workflow-overview';
  return 'workflow-detail';
};

export const viewLevel = {
  get current(): ViewLevel {
    return level;
  },

  get isTransitioning(): boolean {
    return isTransitioning;
  },

  get isLocked(): boolean {
    return isLocked;
  },

  /**
   * Called on every zoom - checks thresholds and updates level.
   * Returns the new level if it changed, null otherwise.
   * When locked, always returns null (no view changes).
   */
  checkScale(scale: number): ViewLevel | null {
    // When locked, don't change view level based on zoom
    if (isLocked) return null;

    const newLevel = scaleToLevel(scale);

    if (newLevel !== level) {
      level = newLevel;
      return newLevel;
    }
    return null;
  },

  /**
   * Sets the transitioning state during view changes.
   */
  setTransitioning(value: boolean): void {
    isTransitioning = value;
  },

  /**
   * Force-set the view level (for initial state or programmatic changes).
   */
  setLevel(newLevel: ViewLevel): void {
    level = newLevel;
  },

  /**
   * Lock the current view level - zoom won't change the view.
   */
  lock(): void {
    isLocked = true;
  },

  /**
   * Unlock the view level - zoom can change the view again.
   */
  unlock(): void {
    isLocked = false;
  },

  /**
   * Toggle the view lock state.
   */
  toggleLock(): void {
    isLocked = !isLocked;
  },
};
