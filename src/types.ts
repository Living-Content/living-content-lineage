export type ManifestType = "c2pa" | "eqty" | "custom";

export type AssetType =
  | "Model"
  | "Code"
  | "Action"
  | "Data"
  | "Document"
  | "Dataset"
  | "Media";

export type NodeType =
  | "data"
  | "process"
  | "attestation"
  | "filter"
  | "join"
  | "store"
  | "media"
  | "meta";

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

export interface ManifestSignatureInfo {
  alg: string;
  issuer: string;
  time: string;
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
  query?: string;
  response?: string;
  responseLength?: number;
  toolId?: string;
  model?: string;
  candidates?: string[];
  llmResponse?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  temperature?: number;
  maxTokens?: number;
  durationMs?: number;
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
  nodeType: NodeType;
  assetType?: AssetType;
  shape: NodeShape;
  stage?: string;
  manifest?: LineageManifestSummary;
  assetManifest?: AssetManifest;
  description?: string;
  x?: number;
  y?: number;
  role?: NodeRole;
  environmentalImpact?: EnvironmentalImpact;
  tokens?: { input: number; output: number };
  humanDescription?: string;
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

export interface Stage {
  id: string;
  label: string;
  xStart: number;
  xEnd: number;
}

export interface LineageGraph {
  title?: string;
  nodes: LineageNodeData[];
  edges: LineageEdgeData[];
  stages: Stage[];
}

export function assetTypeToNodeType(assetType: AssetType): NodeType {
  switch (assetType) {
    case "Model":
    case "Code":
    case "Action":
      return "process";
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
