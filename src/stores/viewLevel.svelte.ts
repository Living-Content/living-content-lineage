/**
 * View level state store using Svelte 5 runes.
 * Single source of truth for the 3-level zoom hierarchy.
 *
 * View transitions are triggered by header buttons only (not zoom wheel).
 */
import type { ViewLevel } from '../config/types.js';

// Re-export for backwards compatibility
export type { ViewLevel } from '../config/types.js';

let level = $state<ViewLevel>('workflow-detail');
let isTransitioning = $state(false);
let recenterCounter = $state(0);

export const viewLevel = {
  get current(): ViewLevel {
    return level;
  },

  get isTransitioning(): boolean {
    return isTransitioning;
  },

  get recenterTrigger(): number {
    return recenterCounter;
  },

  setTransitioning(value: boolean): void {
    isTransitioning = value;
  },

  setLevel(newLevel: ViewLevel): void {
    if (newLevel === level) {
      // Same level - just recenter
      recenterCounter++;
    } else {
      level = newLevel;
    }
  },
};
