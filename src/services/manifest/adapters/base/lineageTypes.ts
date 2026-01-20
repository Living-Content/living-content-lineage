import { isRecord } from '../../../../config/utils.js';

/**
 * Step definition - a specific operation within a workflow phase.
 */
export interface Step {
  id: string;
  label: string;
  type?: string;
  phase?: string;
}

/**
 * Asset definition in the manifest.
 */
export interface Asset {
  id: string;
  label: string;
  title?: string;
  asset_type: string;
  description?: string;
  manifest_url?: string;
  step?: string;
}

/**
 * Attestation definition in the manifest.
 */
export interface Attestation {
  id: string;
  label: string;
  title?: string;
  step: string;
  verifies: string[];
  description?: string;
}

/**
 * Claim - the proof/attestation attached to a signed manifest.
 * Can be TEE attestation, certificate (VC), or merkle hash.
 */
export interface Claim {
  type?: 'merkle' | 'certificate' | 'tee';
  provider?: 'EQTY' | 'C2PA' | 'LCO';
  alg: string;
  issuer: string;
  time: string;
}

/**
 * SignedManifest - a manifest record with an executed claim attached.
 */
export interface SignedManifest {
  claim_generator: string;
  claim_generator_info: Array<{ name: string; version: string }>;
  title: string;
  format: string;
  instance_id: string;
  assertions: Array<{ label: string; data: unknown }>;
  claim: Claim;
}

/**
 * The complete workflow manifest file structure.
 */
export interface Manifest {
  manifest_type: string;
  title: string;
  description: string;
  workflow_id: string;
  content_session_id?: string;
  active_manifest: string;
  manifests: Record<string, SignedManifest>;
  steps: Step[];
  assets: Asset[];
  attestations: Attestation[];
}

export function isManifest(raw: unknown): raw is Manifest {
  if (!isRecord(raw)) return false;
  if (typeof raw.manifest_type !== 'string') return false;
  if (typeof raw.title !== 'string') return false;
  if (typeof raw.description !== 'string') return false;
  if (typeof raw.workflow_id !== 'string') return false;
  if (typeof raw.active_manifest !== 'string') return false;
  if (!isRecord(raw.manifests)) return false;
  if (!Array.isArray(raw.steps)) return false;
  if (!Array.isArray(raw.assets)) return false;
  if (!Array.isArray(raw.attestations)) return false;
  return true;
}
