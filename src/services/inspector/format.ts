/**
 * Formatting utilities for the inspector panel.
 * Combines date formatting, value parsing, and content key utilities.
 */
import JSON5 from 'json5';
import { SUMMARY_VALUE_MAX_LENGTH } from '../../config/display.js';

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formats ISO timestamps for concise display.
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================================
// Value Parsing
// ============================================================================

/**
 * Returns true when a value string looks like JSON.
 */
export const looksLikeJson = (value: string): boolean => {
  const trimmed = value.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
};

/**
 * Parses strict JSON when it appears to be valid.
 */
export const parseJson = (value: string): unknown | null => {
  if (!looksLikeJson(value)) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/**
 * Parses JSON5 input if possible.
 */
export const parseLooseJson = (value: string): unknown | null => {
  try {
    return JSON5.parse(value);
  } catch {
    return null;
  }
};

/**
 * Extracts and parses the first JSON fragment in a string.
 */
export const tryParseJsonFragment = (
  value: string
): {
  parsed: unknown;
  prefix: string;
  suffix: string;
} | null => {
  const openings = new Set(['{', '[']);
  const closings: Record<string, string> = { '{': '}', '[': ']' };

  for (let i = 0; i < value.length; i += 1) {
    const startChar = value[i];
    if (!openings.has(startChar)) continue;

    const stack: string[] = [startChar];
    for (let j = i + 1; j < value.length; j += 1) {
      const ch = value[j];
      if (openings.has(ch)) {
        stack.push(ch);
        continue;
      }
      const last = stack[stack.length - 1];
      if (last && ch === closings[last]) {
        stack.pop();
        if (stack.length === 0) {
          const fragment = value.slice(i, j + 1);
          try {
            const parsed = JSON5.parse(fragment);
            return {
              parsed,
              prefix: value.slice(0, i),
              suffix: value.slice(j + 1),
            };
          } catch {
            break;
          }
        }
      }
    }
  }

  return null;
};

/**
 * Detects URLs so they can be rendered as links.
 */
export const isHttpUrl = (value: string): boolean => {
  return value.startsWith('http://') || value.startsWith('https://');
};

/**
 * Detects if a string likely contains Markdown.
 */
export const looksLikeMarkdown = (value: string): boolean => {
  if (value.includes('```')) return true;
  if (/^#{1,6}\s/m.test(value)) return true;
  if (/(\n|^)[*-]\s+/m.test(value)) return true;
  if (/(\n|^)\d+\.\s+/m.test(value)) return true;
  if (/\[[^\]]+]\([^)]+\)/.test(value)) return true;
  if (/\*\*[^*]+\*\*/.test(value)) return true;
  return false;
};

// ============================================================================
// Content Key Utilities
// ============================================================================

/**
 * Keys to exclude from dynamic content display (internal/structural keys).
 */
const EXCLUDED_KEYS = new Set(['id', 'type', 'nodeType', 'shape', 'x', 'y']);

/**
 * Check if a key should be displayed in the content list.
 */
export const shouldDisplayKey = (key: string): boolean => {
  return !EXCLUDED_KEYS.has(key);
};

/**
 * Format a key for display (convert camelCase to readable label).
 */
export const formatKeyLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toLowerCase())
    .trim();
};

/**
 * Format a content value for display.
 */
export const formatContentValue = (value: unknown): string => {
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
};

/**
 * Check if a value is suitable for summary display (simple, short values).
 */
export const isSummaryValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.length <= SUMMARY_VALUE_MAX_LENGTH;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  return false;
};
