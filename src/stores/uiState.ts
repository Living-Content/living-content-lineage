/**
 * UI state for panels, loading, and display modes.
 */
import { writable } from 'svelte/store';
import type { Phase } from '../config/types.js';

export const isLoading = writable(true);
export const isDetailOpen = writable(false);
export const isSimpleView = writable(false);
export const loadError = writable<string | null>(null);

export const setLoading = (loading: boolean): void => {
  isLoading.set(loading);
};

export const setDetailOpen = (open: boolean): void => {
  isDetailOpen.set(open);
};

export const closeDetailPanel = (): void => {
  isDetailOpen.set(false);
};

export const setSimpleView = (simple: boolean): void => {
  isSimpleView.set(simple);
};

export const setLoadError = (message: string | null): void => {
  loadError.set(message);
};

// Phase filter state
export const phaseFilter = writable<Phase | null>(null);

export const setPhaseFilter = (phase: Phase | null): void => {
  phaseFilter.set(phase);
};

export const clearPhaseFilter = (): void => {
  phaseFilter.set(null);
};
