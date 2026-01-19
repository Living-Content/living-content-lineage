import type { AssetManifest } from '../../../../config/types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  );
}

function normalizeAssetContent(
  raw: unknown
): AssetManifest['content'] | undefined {
  if (!isRecord(raw)) return undefined;
  const normalized: Record<string, unknown> = {};
  Object.entries(raw).forEach(([key, value]) => {
    normalized[toCamelCase(key)] = value;
  });
  return normalized as AssetManifest['content'];
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
    signatureInfo: isRecord(raw.signature_info)
      ? {
          alg: String(raw.signature_info.alg ?? ''),
          issuer: String(raw.signature_info.issuer ?? ''),
          time: String(raw.signature_info.time ?? ''),
        }
      : undefined,
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
  };
}
