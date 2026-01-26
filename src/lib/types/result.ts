/**
 * Result Type
 * Discriminated union for consistent error handling.
 */

/**
 * Discriminated union representing either success with data or failure with error.
 */
export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/**
 * Create a successful Result containing data.
 */
export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });

/**
 * Create a failed Result containing an error.
 */
export const err = <E = string>(error: E): Result<never, E> => ({ ok: false, error });
