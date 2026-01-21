import { isRecord } from '../../../../config/utils.js';

/**
 * Type guard for LCO (Living Content) manifest format.
 */
export function isLcoManifest(raw: unknown): raw is Record<string, unknown> {
  if (!isRecord(raw)) return false;
  if (raw.manifest_type !== 'lco') return false;
  return true;
}
