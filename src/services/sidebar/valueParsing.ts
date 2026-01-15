import JSON5 from 'json5';

/**
 * Returns true when a value string looks like JSON.
 */
export function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

/**
 * Parses strict JSON when it appears to be valid.
 */
export function parseJson(value: string): unknown | null {
  if (!looksLikeJson(value)) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Parses JSON5 input if possible.
 */
export function parseLooseJson(value: string): unknown | null {
  try {
    return JSON5.parse(value);
  } catch {
    return null;
  }
}

/**
 * Extracts and parses the first JSON fragment in a string.
 */
export function tryParseJsonFragment(
  value: string
): {
  parsed: unknown;
  prefix: string;
  suffix: string;
} | null {
  const openings = new Set(['{', '[']);
  const closings: Record<string, string> = { '{': '}', '[': ']' };

  for (let i = 0; i < value.length; i += 1) {
    const startChar = value[i];
    if (!openings.has(startChar)) continue;

    const stack: string[] = [startChar];
    for (let j = i + 1; j < value.length; j += 1) {
      const ch = value[j];
      if (openings.has(ch)) {
        stack.push(ch);
        continue;
      }
      const last = stack[stack.length - 1];
      if (last && ch === closings[last]) {
        stack.pop();
        if (stack.length === 0) {
          const fragment = value.slice(i, j + 1);
          try {
            const parsed = JSON5.parse(fragment);
            return {
              parsed,
              prefix: value.slice(0, i),
              suffix: value.slice(j + 1),
            };
          } catch {
            break;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Detects URLs so they can be rendered as links.
 */
export function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

/**
 * Detects if a string likely contains Markdown.
 */
export function looksLikeMarkdown(value: string): boolean {
  if (value.includes('```')) return true;
  if (/^#{1,6}\s/m.test(value)) return true;
  if (/(\n|^)[*-]\s+/m.test(value)) return true;
  if (/(\n|^)\d+\.\s+/m.test(value)) return true;
  if (/\[[^\]]+]\([^)]+\)/.test(value)) return true;
  if (/\*\*[^*]+\*\*/.test(value)) return true;
  return false;
}
