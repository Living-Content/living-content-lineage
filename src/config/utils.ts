/**
 * Shared type guard utilities.
 */

/** Type guard for Record objects (excludes arrays) */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/** Type guard for non-null objects (includes arrays) */
export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};
