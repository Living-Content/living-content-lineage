/**
 * Shared type guard utilities.
 */
import type { Phase } from './types.js';

const VALID_PHASES: readonly string[] = [
  'Acquisition',
  'Preparation',
  'Retrieval',
  'Reasoning',
  'Generation',
  'Persistence',
];

/** Type guard for Record objects (excludes arrays) */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/** Type guard for non-null objects (includes arrays) */
export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

/** Type guard for Phase values */
export const isPhase = (value: unknown): value is Phase => {
  return typeof value === 'string' && VALID_PHASES.includes(value);
};

/** Validates a string is a valid Phase, throws if not */
export const validatePhase = (value: string | undefined, context: string): Phase => {
  if (!value) {
    throw new Error(`Missing phase for ${context}`);
  }
  if (!isPhase(value)) {
    throw new Error(`Invalid phase "${value}" for ${context}. Valid phases: ${VALID_PHASES.join(', ')}`);
  }
  return value;
};
