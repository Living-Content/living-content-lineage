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
  /** Show in card/summary view */
  isCard: boolean;
  /** Show in detail view (always true if isCard is true) */
  isDetail: boolean;
  /** Override display label */
  label?: string;
  /** Grid column span for summary view */
  summarySpan?: 1 | 2 | 3 | 4;
  /** Grid column span for detail view */
  detailSpan?: 1 | 2 | 3 | 4;
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
 */
export const DISPLAY_CONFIGS: Record<AssetType, AssetDisplayConfig> = {
  // Process Types
  Model: {
    cardColumns: 4,
    fields: {
      'modelId': { type: 'text', isCard: true, isDetail: true, label: 'Model ID', source: 'assertions.model.modelId', summarySpan: 2, detailSpan: 2 },
      'provider': { type: 'text', isCard: true, isDetail: true, label: 'Provider', source: 'assertions.model.provider', summarySpan: 2, detailSpan: 2 },
      'tokens.input': { type: 'metric', isCard: true, isDetail: true, label: 'Input Tokens', source: 'assertions.usage.inputTokens', summarySpan: 2, detailSpan: 2 },
      'tokens.output': { type: 'metric', isCard: true, isDetail: true, label: 'Output Tokens', source: 'assertions.usage.outputTokens', summarySpan: 2, detailSpan: 2 },
      'computation': { type: 'text', isCard: false, isDetail: true, label: 'Computation', source: 'assertions.model.computation' },
      'maxTokens': { type: 'number', isCard: false, isDetail: true, label: 'Max Tokens', source: 'assertions.model.parameters.maxTokens' },
      'temperature': { type: 'number', isCard: false, isDetail: true, label: 'Temperature', source: 'assertions.model.parameters.temperature' },
    }
  },

  Code: {
    cardColumns: 4,
    fields: {
      'function': { type: 'text', isCard: true, isDetail: true, label: 'Function', source: 'assertions.code.function', summarySpan: 2, detailSpan: 2 },
      'module': { type: 'text', isCard: true, isDetail: true, label: 'Module', source: 'assertions.code.module', summarySpan: 2, detailSpan: 2 },
      'duration': { type: 'duration', isCard: true, isDetail: true, label: 'Duration', source: 'computed.duration', summarySpan: 4, detailSpan: 4 },
      'hash': { type: 'hash', isCard: false, isDetail: true, label: 'Hash', source: 'assertions.code.hash' },
      'sourceCode': { type: 'code', isCard: false, isDetail: true, label: 'Source Code', source: 'manifest.sourceCode' },
      'startTime': { type: 'datetime', isCard: false, isDetail: true, label: 'Start Time', source: 'assertions.execution.startTime' },
      'endTime': { type: 'datetime', isCard: false, isDetail: true, label: 'End Time', source: 'assertions.execution.endTime' },
    }
  },

  Action: {
    cardColumns: 4,
    fields: {
      'duration': { type: 'duration', isCard: true, isDetail: false, label: 'Duration', source: 'computed.duration', summarySpan: 2, detailSpan: 2 },
      'inputTokens': { type: 'metric', isCard: true, isDetail: true, label: 'Input Tokens', summarySpan: 2, detailSpan: 2 },
      'outputTokens': { type: 'metric', isCard: true, isDetail: true, label: 'Output Tokens', summarySpan: 2, detailSpan: 2 },
      'totalTokens': { type: 'metric', isCard: true, isDetail: true, label: 'Total Tokens', summarySpan: 2, detailSpan: 2 },
      'actionType': { type: 'badge', isCard: false, isDetail: true, label: 'Action Type', source: 'computed.actionType' },
      'agent': { type: 'text', isCard: false, isDetail: true, label: 'Agent', source: 'assertions.c2paActions.actions.0.softwareAgent.name' },
      'function': { type: 'text', isCard: false, isDetail: true, label: 'Function', source: 'assertions.action.function' },
      'startTime': { type: 'datetime', isCard: false, isDetail: true, label: 'Start Time', source: 'assertions.action.startTime' },
      'endTime': { type: 'datetime', isCard: false, isDetail: true, label: 'End Time', source: 'assertions.action.endTime' },
      'agentVersion': { type: 'text', isCard: false, isDetail: true, label: 'Agent Version', source: 'assertions.c2paActions.actions.0.softwareAgent.version' },
    }
  },

  // Content Types
  Document: {
    cardColumns: 4,
    fields: {
      'durationMs': { type: 'duration', isCard: true, isDetail: false, label: 'Duration', summarySpan: 2, detailSpan: 2 },
      'responseLength': { type: 'metric', isCard: true, isDetail: false, label: 'Response Length', summarySpan: 2, detailSpan: 2 },
      'model': { type: 'text', isCard: true, isDetail: true, label: 'Model', summarySpan: 2, detailSpan: 2 },
      'maxTokens': { type: 'metric', isCard: true, isDetail: true, label: 'Max Tokens', summarySpan: 2, detailSpan: 2 },
      'query': { type: 'markdown', isCard: false, isDetail: true, label: 'Query' },
      'response': { type: 'markdown', isCard: false, isDetail: true, label: 'Response' },
    }
  },

  Dataset: {
    cardColumns: 4,
    fields: {
      'chunksRetrieved': { type: 'metric', isCard: true, isDetail: true, label: 'Chunks Retrieved', summarySpan: 2, detailSpan: 2 },
      'avgSimilarity': { type: 'percentage', isCard: true, isDetail: true, label: 'Avg Similarity', summarySpan: 2, detailSpan: 2 },
      'confidence': { type: 'percentage', isCard: true, isDetail: true, label: 'Confidence', summarySpan: 2, detailSpan: 2 },
      'messageCount': { type: 'metric', isCard: true, isDetail: true, label: 'Messages', summarySpan: 2, detailSpan: 2 },
      'searchQuery': { type: 'text', isCard: false, isDetail: true, label: 'Search Query' },
      'resultCount': { type: 'metric', isCard: false, isDetail: true, label: 'Result Count' },
      'chunks': { type: 'chunk-list', isCard: false, isDetail: true, label: 'Retrieved Chunks' },
      'gapsAddressed': { type: 'list', isCard: false, isDetail: true, label: 'Gaps Addressed' },
    }
  },

  Media: {
    cardColumns: 4,
    fields: {
      'format': { type: 'badge', isCard: true, isDetail: true, label: 'Format', source: 'manifest.format', summarySpan: 2, detailSpan: 2 },
      'dimensions': { type: 'dimensions', isCard: true, isDetail: true, label: 'Dimensions', source: 'computed.dimensions', summarySpan: 2, detailSpan: 2 },
      'fileSize': { type: 'filesize', isCard: true, isDetail: true, label: 'File Size', source: 'content.size', summarySpan: 4, detailSpan: 4 },
      'mimeType': { type: 'text', isCard: false, isDetail: true, label: 'MIME Type', source: 'manifest.format' },
      'duration': { type: 'duration', isCard: false, isDetail: true, label: 'Duration', source: 'content.duration' },
    }
  },

  Result: {
    cardColumns: 4,
    fields: {
      'inputTokens': { type: 'metric', isCard: true, isDetail: true, label: 'Input Tokens', summarySpan: 2, detailSpan: 2 },
      'outputTokens': { type: 'metric', isCard: true, isDetail: true, label: 'Output Tokens', summarySpan: 2, detailSpan: 2 },
      'totalTokens': { type: 'metric', isCard: true, isDetail: true, label: 'Total Tokens', summarySpan: 4, detailSpan: 4 },
      // Evaluation fields (1-span each for compact display)
      'averageScore': { type: 'percentage', isCard: true, isDetail: true, label: 'Avg Score', summarySpan: 2, detailSpan: 1 },
      'documentCount': { type: 'metric', isCard: true, isDetail: true, label: 'Docs', summarySpan: 2, detailSpan: 1 },
      'documentsAboveThreshold': { type: 'metric', isCard: true, isDetail: true, label: 'Above Threshold', summarySpan: 2, detailSpan: 1 },
      'threshold': { type: 'percentage', isCard: true, isDetail: true, label: 'Threshold', summarySpan: 2, detailSpan: 1 },
      'topScore': { type: 'percentage', isCard: true, isDetail: true, label: 'Top Score', summarySpan: 2, detailSpan: 1 },
      // Detail-only fields
      'preview': { type: 'text-preview', isCard: false, isDetail: true, label: 'Preview', truncateAt: 100, source: 'content.preview' },
      'fullContent': { type: 'markdown', isCard: false, isDetail: true, label: 'Full Content', source: 'content.content' },
      'metadata': { type: 'key-value', isCard: false, isDetail: true, label: 'Metadata', source: 'content.metadata' },
    }
  },

  // Verification Types
  Attestation: {
    cardColumns: 4,
    fields: {
      'status': { type: 'status', isCard: true, isDetail: true, label: 'Status', source: 'computed.status', summarySpan: 2, detailSpan: 2 },
      'algorithm': { type: 'badge', isCard: true, isDetail: true, label: 'Algorithm', source: 'manifest.signatureInfo.alg', summarySpan: 2, detailSpan: 2 },
      'issuer': { type: 'text', isCard: false, isDetail: true, label: 'Issuer', source: 'manifest.signatureInfo.issuer' },
    }
  },

  Credential: {
    cardColumns: 4,
    fields: {
      'status': { type: 'status', isCard: true, isDetail: true, label: 'Status', source: 'computed.status', summarySpan: 2, detailSpan: 2 },
      'issuer': { type: 'text', isCard: true, isDetail: true, label: 'Issuer', source: 'manifest.signatureInfo.issuer', summarySpan: 2, detailSpan: 2 },
      'validFrom': { type: 'datetime', isCard: false, isDetail: true, label: 'Valid From', source: 'content.validFrom' },
      'validUntil': { type: 'datetime', isCard: false, isDetail: true, label: 'Valid Until', source: 'content.validUntil' },
      'subject': { type: 'text', isCard: false, isDetail: true, label: 'Subject', source: 'content.subject' },
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
 */
export const getCardFields = (config: AssetDisplayConfig): [string, FieldDisplayConfig][] => {
  return Object.entries(config.fields).filter(([, field]) => field.isCard);
};

/**
 * Get only detail-only fields (not shown in cards) from a config.
 */
export const getDetailOnlyFields = (config: AssetDisplayConfig): [string, FieldDisplayConfig][] => {
  return Object.entries(config.fields).filter(([, field]) => field.isDetail && !field.isCard);
};

/**
 * Get all detail fields (card + detail-only) from a config.
 */
export const getAllDetailFields = (config: AssetDisplayConfig): [string, FieldDisplayConfig][] => {
  return Object.entries(config.fields).filter(([, field]) => field.isDetail);
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
