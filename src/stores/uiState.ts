/**
 * UI state for panels, loading, and display modes.
 */
import { writable } from 'svelte/store';

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
