/**
 * Builds a merged dataSource object for consistent field access in views.
 * Consolidates node data, assertions, and computed values into a single object.
 */
import type { TraceNodeData } from '../../../config/types.js';
import { extractAssertionData, formatDuration } from './assertionParsers.js';

export interface DataSource {
  [key: string]: unknown;
}

/**
 * Format dimensions from width/height fields.
 */
function formatDimensions(data: Record<string, unknown>): string | undefined {
  const width = data.width as number | undefined;
  const height = data.height as number | undefined;
  if (width && height) return `${width}×${height}`;
  return undefined;
}

/**
 * Build a merged dataSource for a node.
 * Used by both SummaryView and DetailView for consistent field access.
 */
export function buildDataSource(node: TraceNodeData): DataSource {
  const assetManifest = node.assetManifest;
  const data = assetManifest?.data ?? {};
  const assertions = extractAssertionData(assetManifest?.assertions);

  // Type-safe data access for nested objects
  type DataWithNested = Record<string, unknown> & {
    executionResult?: Record<string, unknown>;
    executionPlan?: Record<string, unknown>;
  };
  const typedData = data as DataWithNested;

  // Duration: prefer lco.action (Actions), fall back to lco.execution (Code)
  const durationMs = assertions.action?.durationMs ?? assertions.execution?.executionDurationMs;

  return {
    // Spread data first so explicit fields can override
    ...data,
    // Flatten nested objects from result data
    ...(typedData.executionResult ?? {}),
    ...(typedData.executionPlan ?? {}),
    // Node-level fields
    ...node,
    // Model-specific fields (tokens from lco.usage assertion)
    modelId: assertions.model?.modelId,
    provider: assertions.model?.provider,
    'tokens.input': assertions.usage?.inputTokens,
    'tokens.output': assertions.usage?.outputTokens,
    // Code-specific fields
    function: assertions.code?.function ?? assertions.action?.function,
    module: assertions.code?.module,
    hash: assertions.code?.hash,
    // Duration: unified for both Action and Code
    duration: formatDuration(durationMs),
    // Action-specific fields
    actionType: assertions.c2paActions?.actions?.[0]?.action?.replace('c2pa.', ''),
    agent: assertions.c2paActions?.actions?.[0]?.softwareAgent?.name,
    agentVersion: assertions.c2paActions?.actions?.[0]?.softwareAgent?.version,
    startTime: assertions.action?.startTime ?? assertions.execution?.executionStartTime,
    endTime: assertions.action?.endTime ?? assertions.execution?.executionEndTime,
    // Attestation/Credential fields
    status: assetManifest?.attestation ? 'Verified' : undefined,
    algorithm: assetManifest?.attestation?.alg,
    issuer: assetManifest?.attestation?.issuer,
    // Media fields
    format: assetManifest?.format,
    dimensions: formatDimensions(data as Record<string, unknown>),
    fileSize: (data as Record<string, unknown>).size,
    // Source code
    sourceCode: assetManifest?.sourceCode,
  };
}
