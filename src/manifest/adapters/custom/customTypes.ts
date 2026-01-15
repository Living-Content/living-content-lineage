function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isCustomManifest(raw: unknown): raw is Record<string, unknown> {
  if (!isRecord(raw)) return false;
  if (raw.manifest_type !== 'custom') return false;
  return true;
}
