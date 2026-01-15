/**
 * Content key classification used for sidebar summary vs detail sections.
 */
export type ContentKeyGroup = 'primary' | 'secondary';

export const CONTENT_KEY_GROUPS: Record<string, ContentKeyGroup> = {
  query: 'primary',
  response: 'primary',
  responseLength: 'primary',
  model: 'primary',
  inputTokens: 'primary',
  outputTokens: 'primary',
  temperature: 'primary',
  maxTokens: 'primary',
  durationMs: 'primary',
  description: 'primary',
  totalTokens: 'primary',
  apiDurationMs: 'primary',
  totalDurationMs: 'primary',
  promptLength: 'primary',
  systemLength: 'primary',
  candidates: 'primary',
  llmResponse: 'primary',
  length: 'primary',
};

export function isPrimaryContentKey(key: string): boolean {
  return CONTENT_KEY_GROUPS[key] === 'primary';
}

export function isSecondaryContentKey(key: string): boolean {
  return (
    CONTENT_KEY_GROUPS[key] === 'secondary' || !(key in CONTENT_KEY_GROUPS)
  );
}
