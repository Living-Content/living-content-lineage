/**
 * View level state store using Svelte 5 runes.
 * Single source of truth for the 3-level zoom hierarchy.
 *
 * Each level has its own zoom space. Transitions happen at boundaries:
 * - ZOOM_MIN: transition to more zoomed-out level
 * - ZOOM_MAX: transition to more zoomed-in level
 */
import { ZOOM_MIN, ZOOM_MAX } from '../config/viewport.js';
import type { ViewLevel } from '../config/types.js';

// Re-export for backwards compatibility
export type { ViewLevel } from '../config/types.js';

// Level order for navigation (most zoomed out → most zoomed in)
const LEVEL_ORDER: ViewLevel[] = ['content-session', 'workflow-overview', 'workflow-detail'];

let level = $state<ViewLevel>('workflow-detail');
let isTransitioning = $state(false);
let isLocked = $state(false);

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
   * Check if zooming has crossed a level boundary.
   * Returns the new level if transitioning, null otherwise.
   *
   * - Zoom out past ZOOM_MIN → go to more zoomed-out level
   * - Zoom in past ZOOM_MAX → go to more zoomed-in level
   */
  checkScale(scale: number): ViewLevel | null {
    if (isLocked || isTransitioning) return null;

    const currentIndex = LEVEL_ORDER.indexOf(level);

    // Zoomed out past minimum → go to more zoomed-out level
    if (scale <= ZOOM_MIN && currentIndex > 0) {
      level = LEVEL_ORDER[currentIndex - 1];
      return level;
    }

    // Zoomed in past maximum → go to more zoomed-in level
    if (scale >= ZOOM_MAX && currentIndex < LEVEL_ORDER.length - 1) {
      level = LEVEL_ORDER[currentIndex + 1];
      return level;
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
