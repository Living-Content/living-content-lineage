/**
 * Theme state management.
 * Handles theme selection, persistence, and system preference detection.
 */
import { writable, derived } from 'svelte/store';

export type ThemeName = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'lineage-theme';

/**
 * Get the user's system color scheme preference.
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Load theme preference from localStorage.
 */
function loadStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * The user's explicit theme choice (light, dark, or system).
 */
export const themePreference = writable<ThemeName>(loadStoredTheme());

/**
 * The resolved theme applied to the document (light or dark).
 * When preference is 'system', this follows the OS preference.
 */
export const resolvedTheme = derived(themePreference, ($preference) => {
  if ($preference === 'system') {
    return getSystemTheme();
  }
  return $preference;
});

/**
 * Set the theme preference and persist to localStorage.
 */
export function setTheme(theme: ThemeName): void {
  themePreference.set(theme);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

/**
 * Cycle through themes: light -> dark -> system -> light
 */
export function cycleTheme(): void {
  themePreference.update((current) => {
    switch (current) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'system';
      case 'system':
        return 'light';
    }
  });
  themePreference.subscribe((value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value);
    }
  })();
}

/**
 * Apply the resolved theme to the document root.
 * Call this in your root component's onMount.
 */
export function applyThemeToDocument(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Initialize theme system: apply stored theme and listen for system changes.
 * Returns a cleanup function.
 */
export function initializeTheme(): () => void {
  const unsubscribe = resolvedTheme.subscribe(applyThemeToDocument);

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    themePreference.update((pref) => {
      if (pref === 'system') {
        // Trigger re-evaluation of derived store
        return 'system';
      }
      return pref;
    });
  };
  mediaQuery.addEventListener('change', handleChange);

  return () => {
    unsubscribe();
    mediaQuery.removeEventListener('change', handleChange);
  };
}
