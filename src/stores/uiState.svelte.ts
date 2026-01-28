/**
 * UI state store using Svelte 5 runes.
 */
import type { Phase } from '../config/types.js';

let isLoading = $state(false);
let isDetailOpen = $state(false);
let isSimpleView = $state(false);
let loadError = $state<string | null>(null);
let phaseFilter = $state<Phase | null>(null);
let activeMobilePanel = $state<'data' | 'comments'>('data');

export const uiState = {
  get isLoading() { return isLoading; },
  get isDetailOpen() { return isDetailOpen; },
  get isSimpleView() { return isSimpleView; },
  get loadError() { return loadError; },
  get phaseFilter() { return phaseFilter; },
  get activeMobilePanel() { return activeMobilePanel; },

  setLoading(loading: boolean): void {
    isLoading = loading;
  },

  setDetailOpen(open: boolean): void {
    isDetailOpen = open;
  },

  closeDetailPanel(): void {
    isDetailOpen = false;
  },

  setSimpleView(simple: boolean): void {
    isSimpleView = simple;
  },

  setLoadError(message: string | null): void {
    loadError = message;
  },

  setPhaseFilter(phase: Phase | null): void {
    phaseFilter = phase;
  },

  clearPhaseFilter(): void {
    phaseFilter = null;
  },

  setActiveMobilePanel(panel: 'data' | 'comments'): void {
    activeMobilePanel = panel;
  },
};
