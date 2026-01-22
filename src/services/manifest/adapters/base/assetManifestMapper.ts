import type { AssetManifest, Attestation, AttestationType, AttestationProvider } from '../../../../config/types.js';
import { isRecord } from '../../../../config/utils.js';

function normalizeAttestation(raw: Record<string, unknown>): Attestation | undefined {
  // Read from 'attestation' with fallback to 'signature_info' for backwards compatibility
  const source = isRecord(raw.attestation) ? raw.attestation : (isRecord(raw.signature_info) ? raw.signature_info : undefined);
  if (!source) return undefined;

  return {
    alg: String(source.alg ?? ''),
    issuer: String(source.issuer ?? ''),
    time: String(source.time ?? ''),
    type: source.type as AttestationType | undefined,
    provider: source.provider as AttestationProvider | undefined,
  };
}

function normalizeIngredients(raw: unknown): AssetManifest['ingredients'] {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((ingredient) => isRecord(ingredient))
    .map((ingredient) => ({
      title: String(ingredient.title ?? ''),
      instanceId: String(ingredient.instanceId ?? ''),
      relationship: String(ingredient.relationship ?? ''),
      format: ingredient.format ? String(ingredient.format) : undefined,
    }))
    .filter((ingredient) => ingredient.title && ingredient.instanceId);
}

/**
 * Normalizes inline asset data from bundled manifests.
 *
 * Handles the `data` field on assets in manifest-bundle.json.
 * Data is expected to already be camelCase from the backend.
 */
export function normalizeInlineData(data: Record<string, unknown>): AssetManifest | undefined {
  if (!data || Object.keys(data).length === 0) return undefined;
  return {
    sourceCode: data.sourceCode ? String(data.sourceCode) : undefined,
    content: isRecord(data.content) ? data.content : data,
  };
}

/**
 * Normalizes external asset manifests loaded from separate files.
 * Data is expected to already be camelCase from the backend.
 */
export function normalizeAssetManifest(raw: unknown): AssetManifest | undefined {
  if (!isRecord(raw)) return undefined;
  const assertions = Array.isArray(raw.assertions)
    ? raw.assertions.map((assertion) => ({
        label: String((assertion as { label?: string }).label ?? ''),
        data: (assertion as { data?: unknown }).data,
      }))
    : undefined;

  return {
    claimGenerator: raw.claimGenerator ? String(raw.claimGenerator) : undefined,
    claimGeneratorInfo: Array.isArray(raw.claimGeneratorInfo)
      ? raw.claimGeneratorInfo.map((info) => ({
          name: String((info as { name?: string }).name ?? ''),
          version: String((info as { version?: string }).version ?? ''),
        }))
      : undefined,
    title: raw.title ? String(raw.title) : undefined,
    format: raw.format ? String(raw.format) : undefined,
    instanceId: raw.instanceId ? String(raw.instanceId) : undefined,
    assertions,
    attestation: normalizeAttestation(raw),
    sourceCode: raw.sourceCode ? String(raw.sourceCode) : undefined,
    content: isRecord(raw.content) ? raw.content : undefined,
    ingredients: normalizeIngredients(raw.ingredients),
    environmentalImpact: isRecord(raw.environmentalImpact)
      ? {
          co2Grams:
            typeof raw.environmentalImpact.co2Grams === 'number'
              ? raw.environmentalImpact.co2Grams
              : undefined,
          energyKwh:
            typeof raw.environmentalImpact.energyKwh === 'number'
              ? raw.environmentalImpact.energyKwh
              : undefined,
          methodology: raw.environmentalImpact.methodology
            ? String(raw.environmentalImpact.methodology)
            : undefined,
          source: raw.environmentalImpact.source
            ? String(raw.environmentalImpact.source)
            : undefined,
          updatedAt: raw.environmentalImpact.updatedAt
            ? String(raw.environmentalImpact.updatedAt)
            : undefined,
        }
      : undefined,
    inputs: Array.isArray(raw.inputs) ? raw.inputs.map(String) : undefined,
    outputs: Array.isArray(raw.outputs) ? raw.outputs.map(String) : undefined,
  };
}
