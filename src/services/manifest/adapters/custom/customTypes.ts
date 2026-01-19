import { isRecord } from '../../../../config/utils.js';

export function isCustomManifest(raw: unknown): raw is Record<string, unknown> {
  if (!isRecord(raw)) return false;
  if (raw.manifest_type !== 'custom') return false;
  return true;
}
