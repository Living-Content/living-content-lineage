/**
 * Workflow definition in the lineage manifest.
 * Workflows group related nodes within a phase.
 */
export interface LineageWorkflow {
  id: string;
  label: string;
  type?: string;
  phase?: string;
}

export interface Asset {
  id: string;
  label: string;
  title?: string;
  asset_type: string;
  description?: string;
  manifest_url?: string;
  workflowId?: string;
}

/**
 * Asset manifest loaded from manifest_url.
 * For Action assets, includes inputs/outputs for edge building.
 */
export interface LineageAssetManifest {
  claim_generator?: string;
  claim_generator_info?: Array<{ name: string; version: string }>;
  title?: string;
  format?: string;
  instance_id?: string;
  assertions?: Array<{ label: string; data: unknown }>;
  signature_info?: {
    alg: string;
    issuer: string;
    time: string;
  };
  source_code?: string;
  content?: Record<string, unknown>;
  inputs?: string[];
  outputs?: string[];
}

export interface LineageAttestation {
  id: string;
  label: string;
  title?: string;
  workflowId: string;
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
  manifest_type: string;
  title: string;
  description: string;
  lineage_id: string;
  active_manifest: string;
  manifests: Record<string, LineageManifestRecord>;
  workflows: LineageWorkflow[];
  assets: Asset[];
  attestations: LineageAttestation[];
}

import { isRecord } from '../../../../config/utils.js';

export function isLineageManifest(raw: unknown): raw is LineageManifest {
  if (!isRecord(raw)) return false;
  if (typeof raw.manifest_type !== 'string') return false;
  if (typeof raw.title !== 'string') return false;
  if (typeof raw.description !== 'string') return false;
  if (typeof raw.lineage_id !== 'string') return false;
  if (typeof raw.active_manifest !== 'string') return false;
  if (!isRecord(raw.manifests)) return false;
  if (!Array.isArray(raw.workflows)) return false;
  if (!Array.isArray(raw.assets)) return false;
  if (!Array.isArray(raw.attestations)) return false;
  return true;
}
