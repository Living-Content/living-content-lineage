/**
 * Display configuration for each asset type.
 * Defines which fields appear in card views vs detail views.
 */
import type { DataCardType } from './cardTypes.js';
import type { AssetType } from './types.js';

/**
 * Configuration for how a single field should be displayed.
 */
export interface FieldDisplayConfig {
  /** The rendering type for this field */
  type: DataCardType;
  /**
   * Show as a card in summary view, compact card in detail view.
   * If false or omitted, shows only in detail view (not as card).
   */
  isCard: boolean;
  /** Override display label */
  label?: string;
  /** Grid column span (used in both summary and detail views) */
  span?: 1 | 2 | 3 | 4;
  /** For text-preview type: truncation length */
  truncateAt?: number;
  /** Unit suffix for metrics (e.g., "ms", "KB") */
  unit?: string;
  /**
   * Data source path (dot notation). Examples:
   * - 'assertions.model.modelId' -> assertions.model.modelId
   * - 'data.query' -> data.query
   * - 'node.phase' -> node.phase
   * If not specified, uses the field key itself against data.
   */
  source?: string;
}

/**
 * Display configuration for an asset type.
 */
export interface AssetDisplayConfig {
  /** Field configurations keyed by field path (supports dot notation) */
  fields: Record<string, FieldDisplayConfig>;
  /** Number of columns for metric card grid */
  cardColumns?: 2 | 3 | 4;
}

/**
 * Default display configs keyed by AssetType.
 *
 * isCard: true  → shows as a card in summary view, compact card in detail view
 * isCard: false → shows only in detail view (not as card)
 */
export const DISPLAY_CONFIGS: Record<AssetType, AssetDisplayConfig> = {
  // Process Types
  Model: {
    cardColumns: 4,
    fields: {
      // Note: model name is already shown as title, don't duplicate
      'inputTokens': { type: 'metric', isCard: true, label: 'Input Tokens', source: 'data.inputTokens', span: 2 },
      'outputTokens': { type: 'metric', isCard: true, label: 'Output Tokens', source: 'data.outputTokens', span: 2 },
      'totalDurationMs': { type: 'duration', isCard: true, label: 'Duration', source: 'data.totalDurationMs', span: 2 },
      'temperature': { type: 'number', isCard: true, label: 'Temperature', source: 'data.temperature', span: 2 },
      'maxTokens': { type: 'metric', isCard: false, label: 'Max Tokens', source: 'data.maxTokens' },
    }
  },

  Code: {
    cardColumns: 4,
    fields: {
      'durationMs': { type: 'duration', isCard: true, label: 'Duration', source: 'data.durationMs', span: 2 },
      'module': { type: 'text', isCard: true, label: 'Module', source: 'data.module', span: 2 },
      'arguments': { type: 'key-value', isCard: false, label: 'Arguments', source: 'data.arguments' },
      'sourceCode': { type: 'code', isCard: false, label: 'Source Code', source: 'data.sourceCode' },
    }
  },

  Action: {
    // Action is now a pure connector node with no data payload
    // Just displays title and description, connects inputs to outputs
    cardColumns: 4,
    fields: {}
  },

  // Content Types
  Document: {
    cardColumns: 4,
    fields: {
      // === INGEST (user query arriving) - query moved to detail-only (can be long) ===
      'query': { type: 'text-preview', isCard: false, label: 'Query', source: 'data.query', truncateAt: 500 },
      'messageCount': { type: 'metric', isCard: true, label: 'Messages', source: 'data.messageCount', span: 2 },
      'value': { type: 'text-preview', isCard: true, label: 'Content', source: 'data.value', span: 4, truncateAt: 100 },

      // === SELECT (tool selection - model metrics shown on MODEL node, not here) ===
      'toolId': { type: 'badge', isCard: true, label: 'Tool', source: 'data.toolId', span: 2 },
      'candidates': { type: 'list', isCard: false, label: 'Candidates', source: 'data.candidates' },
      'llmResponse': { type: 'text-preview', isCard: false, label: 'Selection', source: 'data.llmResponse', truncateAt: 100 },

      // === REFLECT (gap analysis) ===
      'gaps': { type: 'list', isCard: true, label: 'Knowledge Gaps', source: 'data.gaps', span: 4 },
      'requirements': { type: 'list', isCard: false, label: 'Requirements', source: 'data.requirements' },
      'reasoningTrace': { type: 'text-preview', isCard: false, label: 'Reasoning', source: 'data.reasoningTrace', truncateAt: 500 },
      'dataQualityAssessment': { type: 'text-preview', isCard: true, label: 'Data Quality', source: 'data.dataQualityAssessment', span: 4, truncateAt: 200 },

      // === PLAN (query planning) ===
      'queries': { type: 'list', isCard: true, label: 'Planned Queries', source: 'data.queries', span: 4 },
      'executionPlan': { type: 'key-value', isCard: false, label: 'Execution Plan', source: 'data.executionPlan' },

      // === EVALUATE (sufficiency check) ===
      'isSufficient': { type: 'status', isCard: true, label: 'Data Sufficient', source: 'data.isSufficient', span: 2 },
      'iteration': { type: 'metric', isCard: true, label: 'Iteration', source: 'data.iteration', span: 2 },
      'shouldContinue': { type: 'status', isCard: true, label: 'Continue?', source: 'data.shouldContinue', span: 2 },

      // === GENERATE (response generation - model metrics shown on MODEL node) ===
      'responseLength': { type: 'metric', isCard: true, label: 'Response Length', source: 'data.responseLength', span: 2 },
      'response': { type: 'markdown', isCard: false, label: 'Response', source: 'data.response' },

      // === STORE (persistence) ===
      'requestMessageId': { type: 'text', isCard: false, label: 'Request ID', source: 'data.requestMessageId' },
      'responseMessageId': { type: 'text', isCard: false, label: 'Response ID', source: 'data.responseMessageId' },
    }
  },

  Data: {
    cardColumns: 4,
    fields: {
      // === HISTORY (conversation) ===
      'messageCount': { type: 'metric', isCard: true, label: 'Messages', source: 'data.messageCount', span: 2 },
      'conversationHistory': { type: 'list', isCard: false, label: 'Conversation History', source: 'data.conversationHistory' },

      // === RETRIEVE (search results) ===
      'count': { type: 'metric', isCard: true, label: 'Results Found', source: 'data.count', span: 2 },
      'totalChunks': { type: 'metric', isCard: true, label: 'Chunks', source: 'data.totalChunks', span: 2 },
      'success': { type: 'status', isCard: true, label: 'Status', source: 'data.success', span: 2 },
      'evaluationSummary': { type: 'text-preview', isCard: true, label: 'Summary', source: 'data.evaluationSummary', span: 4, truncateAt: 200 },
      'chunks': { type: 'list', isCard: false, label: 'Retrieved Chunks', source: 'data.chunks' },
    }
  },

  Media: {
    cardColumns: 4,
    fields: {
      'format': { type: 'badge', isCard: true, label: 'Format', source: 'manifest.format', span: 2 },
      'dimensions': { type: 'dimensions', isCard: true, label: 'Dimensions', source: 'computed.dimensions', span: 2 },
      'fileSize': { type: 'filesize', isCard: true, label: 'File Size', source: 'data.size', span: 4 },
      'mimeType': { type: 'text', isCard: false, label: 'MIME Type', source: 'manifest.format' },
      'duration': { type: 'duration', isCard: false, label: 'Duration', source: 'data.duration' },
    }
  },

  // Verification Types
  Claim: {
    cardColumns: 4,
    fields: {
      'status': { type: 'status', isCard: true, label: 'Status', source: 'computed.status', span: 2 },
      'algorithm': { type: 'badge', isCard: true, label: 'Algorithm', source: 'manifest.attestation.alg', span: 2 },
      'issuer': { type: 'text', isCard: false, label: 'Issuer', source: 'manifest.attestation.issuer' },
    }
  },

};

/**
 * Get display config for an asset type.
 * Returns the config if found, or a default empty config.
 */
export const getDisplayConfig = (assetType: AssetType | undefined): AssetDisplayConfig => {
  if (!assetType || !(assetType in DISPLAY_CONFIGS)) {
    return { fields: {}, cardColumns: 4 };
  }
  return DISPLAY_CONFIGS[assetType];
};

/**
 * Get only card-designated fields from a config.
 * These appear in summary view and as compact cards in detail view.
 */
export const getCardFields = (config: AssetDisplayConfig): [string, FieldDisplayConfig][] => {
  return Object.entries(config.fields).filter(([, field]) => field.isCard);
};

/**
 * Get only detail-only fields (not shown as cards) from a config.
 * These only appear in detail view, below the compact cards.
 */
export const getDetailOnlyFields = (config: AssetDisplayConfig): [string, FieldDisplayConfig][] => {
  return Object.entries(config.fields).filter(([, field]) => !field.isCard);
};

/**
 * Get all fields from a config.
 */
export const getAllDetailFields = (config: AssetDisplayConfig): [string, FieldDisplayConfig][] => {
  return Object.entries(config.fields);
};

/**
 * Check if a field path is configured for display.
 */
export const isConfiguredField = (config: AssetDisplayConfig, fieldPath: string): boolean => {
  return fieldPath in config.fields;
};

/**
 * Retrieves a nested value from an object using dot-notation path.
 * Supports array indices (e.g., 'actions.0.name').
 *
 * @param obj - The object to traverse
 * @param path - Dot-notation path (e.g., 'data.user.name')
 * @returns The value at the path, or undefined if not found
 */
export const getValueByPath = (obj: Record<string, unknown>, path: string): unknown => {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (!isNaN(index)) {
        current = current[index];
        continue;
      }
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
};

/**
 * Data context for resolving field sources.
 */
export interface DataContext {
  node: Record<string, unknown>;
  manifest: Record<string, unknown>;
  data: Record<string, unknown>;
  assertions: Record<string, unknown>;
  computed: Record<string, unknown>;
}

/**
 * Resolves a field's value from a data context using its source path.
 * The source path format is: `{root}.{path}` where root is one of:
 * - 'node': Node metadata
 * - 'manifest': Raw manifest data
 * - 'data': Node payload data
 * - 'assertions': Parsed assertions
 * - 'computed': Computed/derived values
 *
 * @param source - Source path (e.g., 'data.inputTokens') or undefined
 * @param fieldKey - Fallback key to use if source is undefined
 * @param context - Data context containing all data sources
 * @returns The resolved value, or undefined if not found
 */
export const resolveFieldValue = (
  source: string | undefined,
  fieldKey: string,
  context: DataContext
): unknown => {
  if (!source) {
    // Default: look in data using the field key
    return getValueByPath(context.data, fieldKey);
  }

  const [root, ...rest] = source.split('.');
  const path = rest.join('.');

  switch (root) {
    case 'node':
      return getValueByPath(context.node, path);
    case 'manifest':
      return getValueByPath(context.manifest, path);
    case 'data':
      return getValueByPath(context.data, path);
    case 'assertions':
      return getValueByPath(context.assertions, path);
    case 'computed':
      return context.computed[path];
    default:
      return undefined;
  }
};

/**
 * Classify fields as metric vs text for hybrid layout.
 */
export const classifyCardFields = (
  config: AssetDisplayConfig
): { metrics: [string, FieldDisplayConfig][]; properties: [string, FieldDisplayConfig][] } => {
  const cardFields = getCardFields(config);
  const metricTypes: DataCardType[] = ['metric', 'percentage', 'filesize', 'number', 'duration'];

  return {
    metrics: cardFields.filter(([, field]) => metricTypes.includes(field.type)),
    properties: cardFields.filter(([, field]) => !metricTypes.includes(field.type)),
  };
};
