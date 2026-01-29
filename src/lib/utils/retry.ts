/**
 * Retry Utilities
 * Standardized retry logic with exponential backoff
 */

import { logger } from '../logger.js';

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds (cap for exponential growth) */
  maxDelayMs: number;
  /** Optional jitter factor (0-1) to randomize delays */
  jitterFactor?: number;
}

/**
 * Calculate exponential backoff delay with optional jitter.
 */
function calculateBackoff(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  if (config.jitterFactor && config.jitterFactor > 0) {
    const jitter = cappedDelay * config.jitterFactor * Math.random();
    return Math.floor(cappedDelay + jitter);
  }

  return cappedDelay;
}

/**
 * Execute an async operation with retry logic.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  shouldRetry: (error: unknown) => boolean = () => true
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt >= config.maxRetries;
      const isRetryable = shouldRetry(error);

      if (isLastAttempt || !isRetryable) {
        if (isLastAttempt) {
          logger.debug(`Retry: All ${config.maxRetries} retries exhausted`);
        }
        throw error;
      }

      const delay = calculateBackoff(attempt, config);
      const retriesRemaining = config.maxRetries - attempt;
      const plural = retriesRemaining === 1 ? 'retry' : 'retries';
      logger.debug(`Retry: Failed, retrying in ${delay}ms (${retriesRemaining} ${plural} remaining)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/** Default retry config for API calls */
export const API_RETRY: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  jitterFactor: 0.2,
};
