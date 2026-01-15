/**
 * UI state for panels, loading, and display modes.
 */
import { writable } from 'svelte/store';

export const isLoading = writable(true);
export const isDetailOpen = writable(false);
export const isSidebarFloating = writable(false);
export const isSimpleView = writable(false);
export const loadError = writable<string | null>(null);

export function setLoading(loading: boolean): void {
  isLoading.set(loading);
}

export function setDetailOpen(open: boolean): void {
  isDetailOpen.set(open);
}

export function closeDetailPanel(): void {
  isDetailOpen.set(false);
}

export function toggleSidebarFloating(): void {
  isSidebarFloating.update((value: boolean) => !value);
}

export function setSimpleView(simple: boolean): void {
  isSimpleView.set(simple);
}

export function setLoadError(message: string | null): void {
  loadError.set(message);
}
