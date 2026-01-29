/**
 * Display configuration utilities for asset types.
 * Bridge between generated catalog and rendering components.
 */
import type { DataCardType } from './cardTypes.js';
import type { AssetType, FieldDefinition, DisplayType, EditCapability } from './types.js';
import { FIELD_CATALOG, getFieldsByAssetType, getCardColumns } from './types.js';

// Content parsing
export const SUMMARY_VALUE_MAX_LENGTH = 100;

/**
 * Edit type for editable fields.
 */
export type EditType = 'text' | 'json' | 'select' | 'number' | 'textarea';

/**
 * Configuration for how a single field should be displayed.
 * Bridge interface between generated FieldDefinition and component expectations.
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
  /** Whether this field can be edited for replay */
  isEditable?: boolean;
  /** Type of editor to show for editable fields */
  editType?: EditType;
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
 * Convert generated FieldDefinition to FieldDisplayConfig
 */
function fieldDefinitionToDisplayConfig(field: FieldDefinition): FieldDisplayConfig {
  // Map DisplayType to DataCardType (they're compatible strings)
  const displayTypeToCardType: Record<DisplayType, DataCardType> = {
    'metric': 'metric',
    'text': 'text',
    'text-preview': 'text-preview',
    'badge': 'badge',
    'status': 'status',
    'duration': 'duration',
    'datetime': 'datetime',
    'percentage': 'percentage',
    'dimensions': 'dimensions',
    'filesize': 'filesize',
    'hash': 'hash',
    'number': 'number',
    'code': 'code',
    'markdown': 'markdown',
    'list': 'list',
    'link-pair': 'link-pair',
    'asset-list': 'asset-list',
    'chunk-list': 'chunk-list',
    'key-value': 'key-value',
  };

  // Map EditCapability to EditType
  const editCapabilityToType: Record<EditCapability, EditType | undefined> = {
    'none': undefined,
    'text': 'text',
    'textarea': 'textarea',
    'number': 'number',
    'json': 'json',
    'select': 'select',
  };

  const editType = editCapabilityToType[field.editCapability];

  return {
    type: displayTypeToCardType[field.displayType],
    isCard: field.isCard,
    label: field.label,
    span: field.span as 1 | 2 | 3 | 4 | undefined,
    truncateAt: field.truncateAt,
    unit: field.unit,
    source: field.sourcePath,
    isEditable: field.editCapability !== 'none',
    editType,
  };
}

/**
 * Build AssetDisplayConfig from generated catalog for an asset type.
 */
function buildDisplayConfig(assetType: string): AssetDisplayConfig {
  const fields = getFieldsByAssetType(assetType);
  const cardColumns = getCardColumns(assetType);

  const fieldsRecord: Record<string, FieldDisplayConfig> = {};
  for (const field of fields) {
    fieldsRecord[field.name] = fieldDefinitionToDisplayConfig(field);
  }

  return {
    fields: fieldsRecord,
    cardColumns: cardColumns as 2 | 3 | 4,
  };
}

// Cache for display configs
const displayConfigCache = new Map<string, AssetDisplayConfig>();

/**
 * Get display config for an asset type.
 * Returns the config if found, or a default empty config.
 */
export const getDisplayConfig = (assetType: AssetType | string | undefined): AssetDisplayConfig => {
  if (!assetType) {
    return { fields: {}, cardColumns: 4 };
  }

  // Check cache first
  let config = displayConfigCache.get(assetType);
  if (!config) {
    config = buildDisplayConfig(assetType);
    displayConfigCache.set(assetType, config);
  }
  return config;
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

/**
 * Get editable fields from a config.
 */
export const getEditableFieldsFromConfig = (config: AssetDisplayConfig): [string, FieldDisplayConfig][] => {
  return Object.entries(config.fields).filter(([, field]) => field.isEditable);
};

/**
 * Check if a field is editable.
 */
export const isFieldEditable = (config: AssetDisplayConfig, fieldPath: string): boolean => {
  const field = config.fields[fieldPath];
  return field?.isEditable ?? false;
};
