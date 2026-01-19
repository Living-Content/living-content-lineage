/**
 * Type-safe assertion data extraction.
 * Parses assertion data from manifests into typed structures for display.
 */
import type { ManifestAssertion } from '../../../config/types.js';

/**
 * Model assertion data (lco.model).
 */
export interface LcoModelData {
  provider?: string;
  modelId?: string;
  computation?: string;
  parameters?: {
    maxTokens?: number;
    temperature?: number;
    [key: string]: unknown;
  };
}

/**
 * Code assertion data (lco.code).
 */
export interface LcoCodeData {
  function?: string;
  module?: string;
  computation?: string;
  hash?: string;
}

/**
 * Execution assertion data (lco.execution).
 */
export interface LcoExecutionData {
  executionStartTime?: string;
  executionEndTime?: string;
  executionDurationMs?: number;
  previousFunction?: string;
  nextFunction?: string;
}

/**
 * Usage assertion data (lco.usage).
 */
export interface LcoUsageData {
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/**
 * Action assertion data (lco.action).
 */
export interface LcoActionData {
  function?: string;
  durationMs?: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Content assertion data (lco.content).
 */
export interface LcoContentData {
  type?: string;
  contentHash?: string;
  contentPreview?: string;
}

/**
 * C2PA action assertion data.
 */
export interface C2paAction {
  action?: string;
  softwareAgent?: {
    name?: string;
    version?: string;
  };
  when?: string;
  digitalSourceType?: string;
}

export interface C2paActionsData {
  actions?: C2paAction[];
}

/**
 * Aggregated parsed assertion data for a node.
 */
export interface ParsedAssertionData {
  model?: LcoModelData;
  code?: LcoCodeData;
  execution?: LcoExecutionData;
  usage?: LcoUsageData;
  action?: LcoActionData;
  content?: LcoContentData;
  c2paActions?: C2paActionsData;
}

/**
 * Parse lco.model assertion data.
 */
export const parseLcoModel = (data: unknown): LcoModelData | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  return {
    provider: typeof d.provider === 'string' ? d.provider : undefined,
    modelId: typeof d.model_id === 'string' ? d.model_id : undefined,
    computation: typeof d.computation === 'string' ? d.computation : undefined,
    parameters: d.parameters && typeof d.parameters === 'object'
      ? parseParameters(d.parameters as Record<string, unknown>)
      : undefined,
  };
};

const parseParameters = (params: Record<string, unknown>): LcoModelData['parameters'] => {
  return {
    maxTokens: typeof params.max_tokens === 'number' ? params.max_tokens : undefined,
    temperature: typeof params.temperature === 'number' ? params.temperature : undefined,
    ...params,
  };
};

/**
 * Parse lco.code assertion data.
 */
export const parseLcoCode = (data: unknown): LcoCodeData | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  return {
    function: typeof d.function === 'string' ? d.function : undefined,
    module: typeof d.module === 'string' ? d.module : undefined,
    computation: typeof d.computation === 'string' ? d.computation : undefined,
    hash: typeof d.hash === 'string' ? d.hash : undefined,
  };
};

/**
 * Parse lco.execution assertion data.
 */
export const parseLcoExecution = (data: unknown): LcoExecutionData | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  const durationMs = typeof d.execution_duration_ms === 'number'
    ? d.execution_duration_ms
    : typeof d.execution_duration_ms === 'string'
      ? parseFloat(d.execution_duration_ms)
      : undefined;
  return {
    executionStartTime: typeof d.execution_start_time === 'string' ? d.execution_start_time : undefined,
    executionEndTime: typeof d.execution_end_time === 'string' ? d.execution_end_time : undefined,
    executionDurationMs: durationMs,
    previousFunction: typeof d.previous_function === 'string' ? d.previous_function : undefined,
    nextFunction: typeof d.next_function === 'string' ? d.next_function : undefined,
  };
};

/**
 * Parse lco.usage assertion data.
 */
export const parseLcoUsage = (data: unknown): LcoUsageData | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  const durationMs = typeof d.duration_ms === 'number'
    ? d.duration_ms
    : typeof d.duration_ms === 'string'
      ? parseFloat(d.duration_ms)
      : typeof d.total_duration_ms === 'number'
        ? d.total_duration_ms
        : undefined;
  return {
    durationMs,
    inputTokens: typeof d.input_tokens === 'number' ? d.input_tokens : undefined,
    outputTokens: typeof d.output_tokens === 'number' ? d.output_tokens : undefined,
    totalTokens: typeof d.total_tokens === 'number' ? d.total_tokens : undefined,
  };
};

/**
 * Parse lco.action assertion data.
 */
export const parseLcoAction = (data: unknown): LcoActionData | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  const durationMs = typeof d.duration_ms === 'number'
    ? d.duration_ms
    : typeof d.duration_ms === 'string'
      ? parseFloat(d.duration_ms)
      : undefined;
  return {
    function: typeof d.function === 'string' ? d.function : undefined,
    durationMs,
    startTime: typeof d.start_time === 'string' ? d.start_time : undefined,
    endTime: typeof d.end_time === 'string' ? d.end_time : undefined,
  };
};

/**
 * Parse lco.content assertion data.
 */
export const parseLcoContent = (data: unknown): LcoContentData | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  return {
    type: typeof d.type === 'string' ? d.type : undefined,
    contentHash: typeof d.content_hash === 'string' ? d.content_hash : undefined,
    contentPreview: typeof d.content_preview === 'string' ? d.content_preview : undefined,
  };
};

/**
 * Parse c2pa.actions assertion data.
 */
export const parseC2paActions = (data: unknown): C2paActionsData | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.actions)) return { actions: [] };
  return {
    actions: d.actions.map((action: unknown) => {
      if (!action || typeof action !== 'object') return {};
      const a = action as Record<string, unknown>;
      const softwareAgent = a.softwareAgent && typeof a.softwareAgent === 'object'
        ? a.softwareAgent as Record<string, unknown>
        : undefined;
      return {
        action: typeof a.action === 'string' ? a.action : undefined,
        softwareAgent: softwareAgent ? {
          name: typeof softwareAgent.name === 'string' ? softwareAgent.name : undefined,
          version: typeof softwareAgent.version === 'string' ? softwareAgent.version : undefined,
        } : undefined,
        when: typeof a.when === 'string' ? a.when : undefined,
        digitalSourceType: typeof a.digitalSourceType === 'string' ? a.digitalSourceType : undefined,
      };
    }),
  };
};

/**
 * Extract all typed assertion data from a list of assertions.
 */
export const extractAssertionData = (assertions: ManifestAssertion[] | undefined): ParsedAssertionData => {
  const result: ParsedAssertionData = {};
  if (!assertions) return result;

  for (const assertion of assertions) {
    switch (assertion.label) {
      case 'lco.model':
        result.model = parseLcoModel(assertion.data);
        break;
      case 'lco.code':
        result.code = parseLcoCode(assertion.data);
        break;
      case 'lco.execution':
        result.execution = parseLcoExecution(assertion.data);
        break;
      case 'lco.usage':
        result.usage = parseLcoUsage(assertion.data);
        break;
      case 'lco.action':
        result.action = parseLcoAction(assertion.data);
        break;
      case 'lco.content':
        result.content = parseLcoContent(assertion.data);
        break;
      case 'c2pa.actions':
        result.c2paActions = parseC2paActions(assertion.data);
        break;
    }
  }
  return result;
};

/**
 * Format duration in milliseconds to a human-readable string.
 */
export const formatDuration = (ms: number | undefined): string => {
  if (ms === undefined) return '-';
  return `${ms.toFixed(0)}ms`;
};

/**
 * Format a number with appropriate precision.
 */
export const formatNumber = (value: number | undefined, decimals = 2): string => {
  if (value === undefined) return '-';
  return value.toFixed(decimals);
};

/**
 * Format a percentage value.
 */
export const formatPercent = (value: number | undefined): string => {
  if (value === undefined) return '-';
  return `${(value * 100).toFixed(0)}%`;
};
