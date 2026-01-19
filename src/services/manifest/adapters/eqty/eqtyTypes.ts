function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isEqtyManifest(raw: unknown): raw is Record<string, unknown> {
  if (!isRecord(raw)) return false;
  if (raw.manifest_type !== 'eqty') return false;
  return true;
}
