/**
 * C2PA-aligned lineage data types for graph visualization.
 * Based on C2PA (Coalition for Content Provenance and Authenticity) standard.
 * See: https://c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html
 */

export type AssetType =
  | "Model"
  | "Code"
  | "Computation"
  | "Data"
  | "Document"
  | "Dataset"
  | "Media";

export type NodeType =
  | "data"
  | "compute"
  | "attestation"
  | "filter"
  | "join"
  | "store"
  | "media";

export type NodeRole = "source" | "sink" | "intermediate" | "compute";

export type NodeShape = "circle" | "square" | "dashed-circle" | "connector";

/**
 * C2PA Action - describes a transformation or operation performed on content.
 */
export interface C2PAAction {
  action: string;
  digitalSourceType?: string;
  softwareAgent?: { name: string; version: string };
  when?: string;
  parameters?: Record<string, unknown>;
}

/**
 * C2PA Assertion - a statement about the asset.
 */
export interface C2PAAssertion {
  label: string;
  data: unknown;
}

/**
 * C2PA Ingredient - reference to a parent asset used in creation.
 */
export interface C2PAIngredient {
  title: string;
  format?: string;
  instance_id: string;
  relationship: "parentOf" | "componentOf" | "inputTo";
}

/**
 * C2PA Manifest for visualization purposes.
 */
export interface C2PAManifest {
  claim_generator_info: {
    name: string;
    version: string;
  };
  title: string;
  format?: string;
  instance_id: string;
  assertions: C2PAAssertion[];
  signature?: {
    alg: string;
    issuer: string;
    time: string;
  };
}

/**
 * Rich asset data loaded from individual asset manifests.
 */
export interface AssetManifest {
  claim_generator: string;
  claim_generator_info: Array<{ name: string; version: string }>;
  title: string;
  format: string;
  instance_id: string;
  assertions: C2PAAssertion[];
  signature_info?: {
    alg: string;
    issuer: string;
    time: string;
  };
  // Code assets
  source_code?: string;
  // Document/Data assets
  content?: {
    query?: string;
    response?: string;
    response_length?: number;
    tool_id?: string;
    model?: string;
    candidates?: string[];
    llm_response?: string;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    temperature?: number;
    max_tokens?: number;
    duration_ms?: number;
    [key: string]: unknown;
  };
  // Model assets
  ingredients?: Array<{
    title: string;
    instance_id: string;
    relationship: string;
  }>;
}

/**
 * Node data for sigma.js graph rendering.
 */
export interface LineageNodeData {
  id: string;
  label: string;
  nodeType: NodeType;
  assetType?: AssetType;
  shape: NodeShape;
  stage?: string;
  manifest?: C2PAManifest;
  assetManifest?: AssetManifest;
  description?: string;
  x?: number;
  y?: number;
  role?: NodeRole;
  // Human-readable metadata
  humanDescription?: string;
  humanInputs?: string[];
  humanOutputs?: string[];
  verifiedBy?: string;
  verifiedAt?: string;
  duration?: string;
  // Token usage for environmental impact
  tokens?: { input: number; output: number };
}

/**
 * Edge data for sigma.js graph rendering.
 */
export interface LineageEdgeData {
  id: string;
  source: string;
  target: string;
  color?: string;
  isSimple?: boolean;
  isGate?: boolean; // Gate edges connect data to attestation nodes
}

/**
 * Stage definition for visual grouping.
 */
export interface Stage {
  id: string;
  label: string;
  xStart: number;
  xEnd: number;
}

/**
 * Complete lineage graph structure.
 */
export interface LineageGraph {
  nodes: LineageNodeData[];
  edges: LineageEdgeData[];
  stages: Stage[];
}

/**
 * Maps assetType to visual nodeType.
 */
export function assetTypeToNodeType(assetType: AssetType): NodeType {
  switch (assetType) {
    case "Model":
    case "Code":
    case "Computation":
      return "compute";
    case "Data":
    case "Document":
      return "data";
    case "Dataset":
      return "store";
    case "Media":
      return "media";
    default:
      return "data";
  }
}
