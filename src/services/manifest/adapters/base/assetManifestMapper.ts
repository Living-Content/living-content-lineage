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

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase()
  );
}

function normalizeAssetContent(
  raw: unknown
): AssetManifest['content'] | undefined {
  if (!isRecord(raw)) return undefined;
  const normalized: AssetManifest['content'] = {};
  Object.entries(raw).forEach(([key, value]) => {
    normalized[toCamelCase(key)] = value;
  });
  return normalized;
}

function normalizeIngredients(raw: unknown): AssetManifest['ingredients'] {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((ingredient) => isRecord(ingredient))
    .map((ingredient) => ({
      title: String(ingredient.title ?? ''),
      instanceId: String(ingredient.instance_id ?? ''),
      relationship: String(ingredient.relationship ?? ''),
      format: ingredient.format ? String(ingredient.format) : undefined,
    }))
    .filter((ingredient) => ingredient.title && ingredient.instanceId);
}

/**
 * Normalizes inline asset data from bundled manifests.
 *
 * Handles the `data` field on assets in manifest-bundle.json.
 */
export function normalizeInlineData(data: Record<string, unknown>): AssetManifest | undefined {
  if (!data || Object.keys(data).length === 0) return undefined;
  return {
    sourceCode: data.source_code ? String(data.source_code) : undefined,
    content: normalizeAssetContent(data.content ?? data),
  };
}

/**
 * Normalizes external asset manifests loaded from separate files.
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
    claimGenerator: raw.claim_generator ? String(raw.claim_generator) : undefined,
    claimGeneratorInfo: Array.isArray(raw.claim_generator_info)
      ? raw.claim_generator_info.map((info) => ({
          name: String((info as { name?: string }).name ?? ''),
          version: String((info as { version?: string }).version ?? ''),
        }))
      : undefined,
    title: raw.title ? String(raw.title) : undefined,
    format: raw.format ? String(raw.format) : undefined,
    instanceId: raw.instance_id ? String(raw.instance_id) : undefined,
    assertions,
    attestation: normalizeAttestation(raw),
    sourceCode: raw.source_code ? String(raw.source_code) : undefined,
    content: normalizeAssetContent(raw.content),
    ingredients: normalizeIngredients(raw.ingredients),
    environmentalImpact: isRecord(raw.environmental_impact)
      ? {
          co2Grams:
            typeof raw.environmental_impact.co2_grams === 'number'
              ? raw.environmental_impact.co2_grams
              : undefined,
          energyKwh:
            typeof raw.environmental_impact.energy_kwh === 'number'
              ? raw.environmental_impact.energy_kwh
              : undefined,
          methodology: raw.environmental_impact.methodology
            ? String(raw.environmental_impact.methodology)
            : undefined,
          source: raw.environmental_impact.source
            ? String(raw.environmental_impact.source)
            : undefined,
          updatedAt: raw.environmental_impact.updated_at
            ? String(raw.environmental_impact.updated_at)
            : undefined,
        }
      : undefined,
    inputs: Array.isArray(raw.inputs) ? raw.inputs.map(String) : undefined,
    outputs: Array.isArray(raw.outputs) ? raw.outputs.map(String) : undefined,
  };
}
