import { isRecord } from '../../../../config/utils.js';
import type { Attestation } from '../../../../config/types.js';

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
 * Claim node definition in the manifest.
 * Represents a verification point in the lineage graph.
 */
export interface Claim {
  id: string;
  label: string;
  title?: string;
  step: string;
  verifies: string[];
  description?: string;
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
  attestation: Attestation;
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
  claims: Claim[];
}

// Type Guards

export function isStep(raw: unknown): raw is Step {
  if (!isRecord(raw)) return false;
  if (typeof raw.id !== 'string') return false;
  if (typeof raw.label !== 'string') return false;
  return true;
}

export function isAsset(raw: unknown): raw is Asset {
  if (!isRecord(raw)) return false;
  if (typeof raw.id !== 'string') return false;
  if (typeof raw.label !== 'string') return false;
  if (typeof raw.asset_type !== 'string') return false;
  return true;
}

export function isClaim(raw: unknown): raw is Claim {
  if (!isRecord(raw)) return false;
  if (typeof raw.id !== 'string') return false;
  if (typeof raw.label !== 'string') return false;
  if (typeof raw.step !== 'string') return false;
  if (!Array.isArray(raw.verifies)) return false;
  return true;
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
  if (!Array.isArray(raw.claims)) return false;
  return true;
}
