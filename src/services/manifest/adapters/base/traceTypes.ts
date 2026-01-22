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
  assetType: string;
  description?: string;
  manifestUrl?: string;
  step?: string;
  data?: Record<string, unknown>;
  inputs?: string[];
  outputs?: string[];
}

/**
 * Claim node definition in the manifest.
 */
export interface Claim {
  id: string;
  label: string;
  title?: string;
  step: string;
  verifies: string[];
  description?: string;
  manifestUrl?: string;
  provider?: string;
  claimType?: string;
  attestation?: Record<string, unknown>;
  signature?: string;
  verificationUrl?: string;
}

/**
 * SignedManifest - a manifest record with an executed claim attached.
 */
export interface SignedManifest {
  claimGenerator: string;
  claimGeneratorInfo: Array<{ name: string; version: string }>;
  title: string;
  format: string;
  instanceId: string;
  assertions: Array<{ label: string; data: unknown }>;
  attestation: Attestation;
}

/**
 * The complete workflow manifest file structure.
 */
export interface Manifest {
  title: string;
  description: string;
  workflowId: string;
  contentSessionId?: string;
  activeManifest: string;
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
  if (typeof raw.assetType !== 'string') return false;
  if (raw.inputs !== undefined && !Array.isArray(raw.inputs)) return false;
  if (raw.outputs !== undefined && !Array.isArray(raw.outputs)) return false;
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
  if (typeof raw.title !== 'string') return false;
  if (typeof raw.description !== 'string') return false;
  if (typeof raw.workflowId !== 'string') return false;
  if (typeof raw.activeManifest !== 'string') return false;
  if (!isRecord(raw.manifests)) return false;
  if (!Array.isArray(raw.steps)) return false;
  if (!Array.isArray(raw.assets)) return false;
  if (!Array.isArray(raw.claims)) return false;
  return true;
}
