export type ManifestType = "c2pa" | "eqty" | "custom";

/**
 * High-level workflow phase grouping related stage types.
 * Phases represent logical workflow segments from input to output.
 */
export type WorkflowPhase =
  | "Acquisition"
  | "Preparation"
  | "Retrieval"
  | "Reasoning"
  | "Generation"
  | "Persistence";

/**
 * Specific workflow stage operation type.
 * Each stage type belongs to a single phase.
 */
export type WorkflowStageType =
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
 * A workflow stage definition.
 */
export interface WorkflowStage {
  id: string;
  type: WorkflowStageType;
  phase: WorkflowPhase;
  label: string;
}

/**
 * High-level category grouping related asset types.
 */
export type AssetCategory = "Content" | "Process" | "Verification";

/**
 * Specific asset content or process type.
 * - Content: Data flowing through the pipeline (Media, Document, DataObject, Dataset)
 * - Process: Transformations/computations (Code, Model, Action)
 * - Verification: Trust/attestation (Attestation, Credential)
 */
export type AssetType =
  // Content
  | "Media" | "Document" | "DataObject" | "Dataset"
  // Process
  | "Code" | "Model" | "Action"
  // Verification
  | "Attestation" | "Credential";

/**
 * Visual node category for rendering in the lineage graph.
 */
export type NodeType =
  | "data"
  | "process"
  | "attestation"
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

/** Signature mechanism type */
export type SignatureType = 'merkle' | 'certificate' | 'tee';

/** Signature provider/standard */
export type SignatureProvider = 'EQTY' | 'C2PA' | 'LCO';

export interface ManifestSignatureInfo {
  alg: string;
  issuer: string;
  time: string;
  /** Type of signature: merkle tree, certificate chain, or TEE attestation */
  type?: SignatureType;
  /** Provider/standard that created the signature */
  provider?: SignatureProvider;
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

export interface AssetContent {
  [key: string]: unknown;
}

export interface AssetManifest {
  claimGenerator?: string;
  claimGeneratorInfo?: ManifestGeneratorInfo[];
  title?: string;
  format?: string;
  instanceId?: string;
  assertions?: ManifestAssertion[];
  signatureInfo?: ManifestSignatureInfo;
  sourceCode?: string;
  content?: AssetContent;
  ingredients?: ManifestIngredient[];
  environmentalImpact?: EnvironmentalImpact;
}

export interface LineageManifestSummary {
  claimGeneratorInfo?: ManifestGeneratorInfo[];
  title?: string;
  format?: string;
  instanceId?: string;
  assertions?: ManifestAssertion[];
  signatureInfo?: ManifestSignatureInfo;
}

export interface LineageNodeData {
  id: string;
  label: string;
  title?: string;
  nodeType: NodeType;
  assetType?: AssetType;
  shape: NodeShape;
  workflowId?: string;
  phase?: WorkflowPhase;
  manifest?: LineageManifestSummary;
  assetManifest?: AssetManifest;
  description?: string;
  x?: number;
  y?: number;
  role?: NodeRole;
  environmentalImpact?: EnvironmentalImpact;
  tokens?: { input: number; output: number };
  humanInputs?: string[];
  humanOutputs?: string[];
  verifiedBy?: string;
  verifiedAt?: string;
  duration?: string;
  badgeCount?: number;
}

export interface LineageEdgeData {
  id: string;
  source: string;
  target: string;
  color?: string;
  isSimple?: boolean;
  isGate?: boolean;
}

export interface Workflow {
  id: string;
  label: string;
  phase?: WorkflowPhase;
  xStart: number;
  xEnd: number;
}

export interface LineageGraph {
  title?: string;
  lineageId?: string;
  nodes: LineageNodeData[];
  edges: LineageEdgeData[];
  workflows: Workflow[];
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
    case "DataObject":
    case "Document":
      return "data";
    case "Dataset":
      return "store";
    case "Media":
      return "media";
    case "Attestation":
    case "Credential":
      return "attestation";
  }
};

/**
 * Maps a workflow stage type to its workflow phase.
 */
export const workflowStageTypeToPhase = (stageType: WorkflowStageType): WorkflowPhase => {
  switch (stageType) {
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
    case "DataObject":
    case "Dataset":
      return "Content";
    case "Code":
    case "Model":
    case "Action":
      return "Process";
    case "Attestation":
    case "Credential":
      return "Verification";
  }
};
