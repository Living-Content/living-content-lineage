import { isRecord } from '../../../../config/utils.js';

export function isEqtyManifest(raw: unknown): raw is Record<string, unknown> {
  if (!isRecord(raw)) return false;
  if (raw.manifest_type !== 'eqty') return false;
  return true;
}
