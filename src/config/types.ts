// Re-export display config types for convenience
export type { DataCardType } from './cardTypes.js';
export type { FieldDisplayConfig, AssetDisplayConfig } from './displayConfig.js';

/**
 * High-level phase categorizing groups of workflows.
 * Phases represent logical pipeline segments from input to output.
 */
export type Phase =
  | "Acquisition"
  | "Preparation"
  | "Retrieval"
  | "Reasoning"
  | "Generation"
  | "Persistence";

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

/**
 * High-level category grouping related asset types.
 */
export type AssetCategory = "Content" | "Process" | "Verification";

/**
 * Specific asset content or process type.
 * - Content: Data flowing through the pipeline (Media, Document, Data)
 * - Process: Transformations/computations (Code, Model, Action)
 * - Verification: Trust/claims (Claim)
 *
 * Note: Result and Dataset are removed. Use Document, Data, or Media instead.
 */
export type AssetType =
  // Content
  | "Media" | "Document" | "Data"
  // Process
  | "Code" | "Model" | "Action"
  // Verification
  | "Claim";

/**
 * Visual node category for rendering in the trace graph.
 */
export type NodeType =
  | "data"
  | "process"
  | "claim"
  | "store"
  | "media"
  | "workflow";

export type NodeRole = "source" | "sink" | "intermediate" | "process";

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
  nodeType: NodeType;
  assetType?: AssetType;
  shape: NodeShape;
  step?: string;
  phase: Phase;
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
  isGate?: boolean;
}

export interface StepUI {
  id: string;
  label: string;
  phase: Phase;
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

/**
 * Maps an asset type to its corresponding node type for rendering.
 */
export const assetTypeToNodeType = (assetType: AssetType): NodeType => {
  switch (assetType) {
    case "Model":
    case "Code":
    case "Action":
      return "process";
    case "Document":
      return "data";
    case "Data":
      return "store";
    case "Media":
      return "media";
    case "Claim":
      return "claim";
  }
};

/**
 * Maps a step to its parent phase.
 */
export const stepToPhase = (step: Step): Phase => {
  switch (step) {
    case "ingest":
      return "Acquisition";
    case "select":
    case "transform":
    case "validate":
      return "Preparation";
    case "retrieve":
    case "search":
      return "Retrieval";
    case "reflect":
    case "plan":
    case "evaluate":
      return "Reasoning";
    case "generate":
      return "Generation";
    case "store":
    case "publish":
      return "Persistence";
  }
};

/**
 * Maps an asset type to its category.
 */
export const assetTypeToCategory = (assetType: AssetType): AssetCategory => {
  switch (assetType) {
    case "Media":
    case "Document":
    case "Data":
      return "Content";
    case "Code":
    case "Model":
    case "Action":
      return "Process";
    case "Claim":
      return "Verification";
  }
};
