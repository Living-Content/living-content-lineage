// Re-export display config types for convenience
export type { DataCardType } from './cardTypes.js';

// Import types from generated catalog for local use
import type {
  AssetType as GeneratedAssetType,
  AssetCategory as GeneratedAssetCategory,
  NodeType as GeneratedNodeType,
  Phase as GeneratedPhase,
  FieldDefinition as GeneratedFieldDefinition,
  AssetTypeFields as GeneratedAssetTypeFields,
  AssetTypeConfig as GeneratedAssetTypeConfig,
  StepDefinition as GeneratedStepDefinition,
  NodeDefinition as GeneratedNodeDefinition,
  WorkflowCatalog as GeneratedWorkflowCatalog,
  FieldCatalog as GeneratedFieldCatalog,
  DisplayType as GeneratedDisplayType,
  EditCapability as GeneratedEditCapability,
  FieldType as GeneratedFieldType,
} from './field_catalog.generated.js';

// Re-export types from generated catalog
export type AssetType = GeneratedAssetType;
export type AssetCategory = GeneratedAssetCategory;
export type NodeType = GeneratedNodeType;
export type Phase = GeneratedPhase;
export type FieldDefinition = GeneratedFieldDefinition;
export type AssetTypeFields = GeneratedAssetTypeFields;
export type AssetTypeConfig = GeneratedAssetTypeConfig;
export type StepDefinition = GeneratedStepDefinition;
export type NodeDefinition = GeneratedNodeDefinition;
export type WorkflowCatalog = GeneratedWorkflowCatalog;
export type FieldCatalog = GeneratedFieldCatalog;
export type DisplayType = GeneratedDisplayType;
export type EditCapability = GeneratedEditCapability;
export type FieldType = GeneratedFieldType;

// Re-export helper functions from generated catalog
export {
  isValidAssetType,
  getAssetTypeNodeType as assetTypeToNodeType,
  getAssetTypeCategory as assetTypeToCategory,
  getAssetTypeLabel,
  getAssetTypeIconName,
  getAllAssetTypes,
  stepToPhase,
  ASSET_TYPE_CONFIG,
  FIELD_CATALOG,
  WORKFLOW_CATALOG,
  getFieldsByAssetType,
  getFieldByName,
  getCardColumns,
  getEditableFields,
  getAllSteps,
  getStepByName,
  getStepsByPhase,
  getPhases,
} from './field_catalog.generated.js';

/**
 * Specific step operation type within a workflow.
 * Each step belongs to a single phase.
 */
export type Step =
  // Acquisition - Getting input data into the pipeline
  | "ingest"
  // Preparation - Selecting, transforming, validating inputs
  | "select" | "transform" | "validate"
  // Retrieval - Fetching additional context/data
  | "retrieve"  // internal: getting known data
  | "search"    // external: finding data outside
  // Reasoning - AI/ML processing and analysis
  | "reflect" | "plan" | "evaluate"
  // Generation - Creating new content/outputs
  | "generate"
  // Persistence - Storing/publishing results
  | "store"     // internal persistence
  | "publish";  // external distribution

export type NodeRole = "source" | "sink" | "intermediate" | "process";

/**
 * View level for 3-tier zoom hierarchy.
 * - content-session: Highest zoom out (scale < 0.15), shows session cards
 * - workflow-overview: Middle (scale 0.15 - 0.35), shows workflow cards
 * - workflow-detail: Zoomed in (scale > 0.35), shows full node/edge graph
 */
export type ViewLevel = 'content-session' | 'workflow-overview' | 'workflow-detail';

export type NodeShape = "circle" | "square" | "dashed-circle" | "connector";

export interface ManifestGeneratorInfo {
  name: string;
  version: string;
}

export interface ManifestAssertion {
  label: string;
  data: unknown;
}

/** Attestation mechanism type */
export type AttestationType = 'merkle' | 'certificate' | 'tee';

/** Attestation provider/standard */
export type AttestationProvider = 'EQTY' | 'C2PA' | 'LCO';

export interface Attestation {
  alg: string;
  issuer: string;
  time: string;
  /** Type of attestation: merkle tree, certificate chain, or TEE */
  type?: AttestationType;
  /** Provider/standard that created the attestation */
  provider?: AttestationProvider;
}

export interface ManifestIngredient {
  title: string;
  instanceId: string;
  relationship: string;
  format?: string;
}

export interface EnvironmentalImpact {
  co2Grams?: number;
  energyKwh?: number;
  methodology?: string;
  source?: string;
  updatedAt?: string;
}

export interface AssetData {
  [key: string]: unknown;
}

export interface AssetManifest {
  claimGenerator?: string;
  claimGeneratorInfo?: ManifestGeneratorInfo[];
  title?: string;
  format?: string;
  instanceId?: string;
  assertions?: ManifestAssertion[];
  attestation?: Attestation;
  sourceCode?: string;
  data?: AssetData;
  ingredients?: ManifestIngredient[];
  environmentalImpact?: EnvironmentalImpact;
  inputs?: string[];
  outputs?: string[];
}

export interface TraceManifestSummary {
  claimGeneratorInfo?: ManifestGeneratorInfo[];
  title?: string;
  format?: string;
  instanceId?: string;
  assertions?: ManifestAssertion[];
  attestation?: Attestation;
}

export interface TraceNodeData {
  id: string;
  label: string;
  title?: string;
  nodeType: GeneratedNodeType;
  assetType?: GeneratedAssetType;
  shape: NodeShape;
  step?: string;
  phase: GeneratedPhase;
  manifest?: TraceManifestSummary;
  assetManifest?: AssetManifest;
  claimManifest?: unknown;
  description?: string;
  x?: number;
  y?: number;
  role?: NodeRole;
  environmentalImpact?: EnvironmentalImpact;
  humanInputs?: string[];
  humanOutputs?: string[];
  verifiedBy?: string;
  verifiedAt?: string;
  badgeCount?: number;
}

export interface TraceEdgeData {
  id: string;
  source: string;
  target: string;
  color?: string;
  isSimple?: boolean;
  isClaim?: boolean;
}

export interface StepUI {
  id: string;
  label: string;
  phase: GeneratedPhase;
  xStart: number;
  xEnd: number;
}

export interface Trace {
  title?: string;
  workflowId?: string;
  contentSessionId?: string;
  nodes: TraceNodeData[];
  edges: TraceEdgeData[];
  steps: StepUI[];
}
