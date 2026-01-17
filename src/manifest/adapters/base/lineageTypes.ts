/**
 * A workflow stage as defined in the manifest.
 * Stages represent processing steps in the workflow pipeline.
 */
export interface LineageStage {
  id: string;
  label: string;
  type?: string;
  phase?: string;
}

export interface LineageComputation {
  id: string;
  label: string;
  stage: string;
  description?: string;
  duration?: string;
  inputs: string[];
  outputs: string[];
}

export interface Asset {
  id: string;
  label: string;
  asset_type: string;
  description?: string;
  manifest_url?: string;
  tokens?: { input: number; output: number };
}

export interface LineageAttestation {
  id: string;
  label: string;
  stage: string;
  verifies: string[];
  description?: string;
}

export interface LineageManifestRecord {
  claim_generator: string;
  claim_generator_info: Array<{ name: string; version: string }>;
  title: string;
  format: string;
  instance_id: string;
  assertions: Array<{ label: string; data: unknown }>;
  signature_info: {
    alg: string;
    issuer: string;
    time: string;
  };
}

export interface LineageManifest {
  manifest_type?: string;
  active_manifest: string;
  manifests: Record<string, LineageManifestRecord>;
  stages: LineageStage[];
  computations: LineageComputation[];
  assets: Asset[];
  attestations: LineageAttestation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isLineageManifest(raw: unknown): raw is LineageManifest {
  if (!isRecord(raw)) return false;
  if (!Array.isArray(raw.stages)) return false;
  if (!Array.isArray(raw.computations)) return false;
  if (!Array.isArray(raw.assets)) return false;
  if (!Array.isArray(raw.attestations)) return false;
  if (!isRecord(raw.manifests)) return false;
  if (typeof raw.active_manifest !== 'string') return false;
  return true;
}
