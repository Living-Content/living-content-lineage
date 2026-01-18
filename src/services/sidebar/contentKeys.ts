/**
 * Utilities for formatting content field values in the sidebar.
 */

/**
 * Keys to exclude from dynamic content display (internal/structural keys).
 */
const EXCLUDED_KEYS = new Set(['id', 'type', 'nodeType', 'shape', 'x', 'y']);

/**
 * Check if a key should be displayed in the content list.
 */
export function shouldDisplayKey(key: string): boolean {
  return !EXCLUDED_KEYS.has(key);
}

/**
 * Format a key for display (convert camelCase to readable label).
 */
export function formatKeyLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toLowerCase())
    .trim();
}

/**
 * Format a content value for display.
 */
export function formatContentValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }
  if (Array.isArray(value)) {
    return `${value.length} items`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Check if a value is suitable for summary display (simple, short values).
 */
export function isSummaryValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.length <= 100;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  return false;
}
