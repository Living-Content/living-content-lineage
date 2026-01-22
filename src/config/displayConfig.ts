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
   * - 'content.query' -> content.query
   * - 'node.phase' -> node.phase
   * If not specified, uses the field key itself against content.
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
      'inputTokens': { type: 'metric', isCard: true, label: 'Input Tokens', source: 'content.inputTokens', span: 2 },
      'outputTokens': { type: 'metric', isCard: true, label: 'Output Tokens', source: 'content.outputTokens', span: 2 },
      'totalDurationMs': { type: 'duration', isCard: true, label: 'Duration', source: 'content.totalDurationMs', span: 2 },
      'temperature': { type: 'number', isCard: true, label: 'Temperature', source: 'content.temperature', span: 2 },
      'maxTokens': { type: 'metric', isCard: false, label: 'Max Tokens', source: 'content.maxTokens' },
    }
  },

  Code: {
    cardColumns: 4,
    fields: {
      'durationMs': { type: 'duration', isCard: true, label: 'Duration', source: 'content.durationMs', span: 2 },
      'arguments': { type: 'key-value', isCard: false, label: 'Arguments', source: 'content.arguments' },
      'sourceCode': { type: 'code', isCard: false, label: 'Source Code', source: 'content.sourceCode' },
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
      // === INGEST (user query arriving) ===
      'query': { type: 'text-preview', isCard: true, label: 'Query', source: 'content.query', span: 4, truncateAt: 150 },
      'toolId': { type: 'badge', isCard: true, label: 'Requested Tool', source: 'content.toolId', span: 2 },
      'messageCount': { type: 'metric', isCard: true, label: 'Messages', source: 'content.messageCount', span: 2 },
      'value': { type: 'text-preview', isCard: true, label: 'Content', source: 'content.value', span: 4, truncateAt: 100 },

      // === REFLECT (gap analysis) ===
      'gaps': { type: 'list', isCard: true, label: 'Knowledge Gaps', source: 'content.gaps', span: 4 },
      'requirements': { type: 'list', isCard: false, label: 'Requirements', source: 'content.requirements' },
      'reasoningTrace': { type: 'text-preview', isCard: false, label: 'Reasoning', source: 'content.reasoningTrace', truncateAt: 500 },
      'dataQualityAssessment': { type: 'text-preview', isCard: true, label: 'Data Quality', source: 'content.dataQualityAssessment', span: 4, truncateAt: 200 },

      // === PLAN (query planning) ===
      'queries': { type: 'list', isCard: true, label: 'Planned Queries', source: 'content.queries', span: 4 },
      'executionPlan': { type: 'key-value', isCard: false, label: 'Execution Plan', source: 'content.executionPlan' },

      // === EVALUATE (sufficiency check) ===
      'isSufficient': { type: 'status', isCard: true, label: 'Data Sufficient', source: 'content.isSufficient', span: 2 },
      'iteration': { type: 'metric', isCard: true, label: 'Iteration', source: 'content.iteration', span: 2 },
      'shouldContinue': { type: 'status', isCard: true, label: 'Continue?', source: 'content.shouldContinue', span: 2 },

      // === SELECT (tool selection) ===
      'candidates': { type: 'list', isCard: false, label: 'Candidates', source: 'content.candidates' },
      'llmResponse': { type: 'text-preview', isCard: false, label: 'Selection Reasoning', source: 'content.llmResponse', truncateAt: 300 },

      // === STORE (persistence) ===
      'responseLength': { type: 'metric', isCard: true, label: 'Response Length', source: 'content.responseLength', span: 2 },
      'requestMessageId': { type: 'text', isCard: false, label: 'Request ID', source: 'content.requestMessageId' },
      'responseMessageId': { type: 'text', isCard: false, label: 'Response ID', source: 'content.responseMessageId' },
    }
  },

  Data: {
    cardColumns: 4,
    fields: {
      // === RETRIEVE (search results) ===
      'count': { type: 'metric', isCard: true, label: 'Results Found', source: 'content.count', span: 2 },
      'totalChunks': { type: 'metric', isCard: true, label: 'Chunks', source: 'content.totalChunks', span: 2 },
      'success': { type: 'status', isCard: true, label: 'Status', source: 'content.success', span: 2 },
      'evaluationSummary': { type: 'text-preview', isCard: true, label: 'Summary', source: 'content.evaluationSummary', span: 4, truncateAt: 200 },
      'chunks': { type: 'list', isCard: false, label: 'Retrieved Chunks', source: 'content.chunks' },

      // === HISTORY (conversation) ===
      'messageCount': { type: 'metric', isCard: true, label: 'Messages', source: 'content.messageCount', span: 2 },
    }
  },

  Media: {
    cardColumns: 4,
    fields: {
      'format': { type: 'badge', isCard: true, label: 'Format', source: 'manifest.format', span: 2 },
      'dimensions': { type: 'dimensions', isCard: true, label: 'Dimensions', source: 'computed.dimensions', span: 2 },
      'fileSize': { type: 'filesize', isCard: true, label: 'File Size', source: 'content.size', span: 4 },
      'mimeType': { type: 'text', isCard: false, label: 'MIME Type', source: 'manifest.format' },
      'duration': { type: 'duration', isCard: false, label: 'Duration', source: 'content.duration' },
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
 * Get value from an object using dot-notation path.
 * Supports array indices (e.g., 'actions.0.name').
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
  content: Record<string, unknown>;
  assertions: Record<string, unknown>;
  computed: Record<string, unknown>;
}

/**
 * Resolve a field's value from its source path.
 */
export const resolveFieldValue = (
  source: string | undefined,
  fieldKey: string,
  context: DataContext
): unknown => {
  if (!source) {
    // Default: look in content using the field key
    return getValueByPath(context.content, fieldKey);
  }

  const [root, ...rest] = source.split('.');
  const path = rest.join('.');

  switch (root) {
    case 'node':
      return getValueByPath(context.node, path);
    case 'manifest':
      return getValueByPath(context.manifest, path);
    case 'content':
      return getValueByPath(context.content, path);
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
