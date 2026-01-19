/**
 * Data card type definitions for consistent data display across views.
 * Each type determines how a field value is rendered in cards and detail views.
 */

/**
 * Available card display types.
 * Each type corresponds to a specific rendering strategy.
 */
export type DataCardType =
  | 'metric'       // Numeric value with label (tokens, counts, scores)
  | 'text'         // Simple text value
  | 'text-preview' // Truncated text with expand option
  | 'badge'        // Small label/tag (format, status, type)
  | 'status'       // Verified/Valid/Error state indicator
  | 'duration'     // Time duration (formatted)
  | 'datetime'     // Date/time display
  | 'percentage'   // 0-100% with visual indicator
  | 'dimensions'   // width×height
  | 'filesize'     // Bytes formatted (KB, MB)
  | 'hash'         // Truncated hash with copy
  | 'number'       // Generic number display
  | 'code'         // Code block with syntax highlighting
  | 'markdown'     // Rendered markdown content
  | 'list'         // Array of strings
  | 'link-pair'    // Previous/next navigation
  | 'asset-list'   // List of related assets
  | 'chunk-list'   // RAG chunks with scores
  | 'key-value';   // Flexible pairs (for unspecified detail data)

/**
 * Type guard to check if a value is a valid DataCardType.
 */
export const isDataCardType = (value: unknown): value is DataCardType => {
  const validTypes: DataCardType[] = [
    'metric', 'text', 'text-preview', 'badge', 'status', 'duration',
    'datetime', 'percentage', 'dimensions', 'filesize', 'hash', 'number',
    'code', 'markdown', 'list', 'link-pair', 'asset-list', 'chunk-list', 'key-value'
  ];
  return typeof value === 'string' && validTypes.includes(value as DataCardType);
};

/**
 * Format utilities for different card types.
 */

/**
 * Format a file size in bytes to a human-readable string.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/**
 * Format dimensions as width×height.
 */
export const formatDimensions = (width: number, height: number): string => {
  return `${width}×${height}`;
};

/**
 * Truncate a hash for display with optional copy support.
 */
export const formatHash = (hash: string, length = 12): string => {
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length)}...`;
};

/**
 * Truncate text for preview with ellipsis.
 */
export const truncateText = (text: string, maxLength = 100): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

/**
 * Format a percentage value (0-1 to 0-100%).
 */
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(0)}%`;
};

/**
 * Format a duration in milliseconds.
 */
export const formatDuration = (ms: number): string => {
  return `${ms.toFixed(0)}ms`;
};

/**
 * Format a datetime string for display.
 */
export const formatDatetime = (datetime: string): string => {
  try {
    const date = new Date(datetime);
    return date.toLocaleString();
  } catch {
    return datetime;
  }
};

/**
 * Get the appropriate formatter for a card type.
 */
export const getFormatter = (type: DataCardType): ((value: unknown) => string) => {
  switch (type) {
    case 'filesize':
      return (v) => typeof v === 'number' ? formatFileSize(v) : String(v);
    case 'percentage':
      return (v) => typeof v === 'number' ? formatPercentage(v) : String(v);
    case 'duration':
      return (v) => typeof v === 'number' ? formatDuration(v) : String(v);
    case 'datetime':
      return (v) => typeof v === 'string' ? formatDatetime(v) : String(v);
    case 'hash':
      return (v) => typeof v === 'string' ? formatHash(v) : String(v);
    case 'text-preview':
      return (v) => typeof v === 'string' ? truncateText(v) : String(v);
    case 'metric':
    case 'number':
      return (v) => typeof v === 'number' ? v.toLocaleString() : String(v);
    default:
      return (v) => String(v ?? '-');
  }
};
