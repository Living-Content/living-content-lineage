import type { AssetManifest, ManifestSignatureInfo, ClaimType, ClaimProvider } from '../../../../config/types.js';
import { isRecord } from '../../../../config/utils.js';

function normalizeClaim(raw: Record<string, unknown>): ManifestSignatureInfo | undefined {
  // Read from 'claim' with fallback to 'signature_info' for backwards compatibility
  const claimSource = isRecord(raw.claim) ? raw.claim : (isRecord(raw.signature_info) ? raw.signature_info : undefined);
  if (!claimSource) return undefined;

  return {
    alg: String(claimSource.alg ?? ''),
    issuer: String(claimSource.issuer ?? ''),
    time: String(claimSource.time ?? ''),
    type: claimSource.type as ClaimType | undefined,
    provider: claimSource.provider as ClaimProvider | undefined,
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
    signatureInfo: normalizeClaim(raw),
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
