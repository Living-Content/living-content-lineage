<script lang="ts">
  /**
   * Vertical key-value display.
   * LABEL on top, value below.
   * Handles unknown value types:
   * - Simple values: inline display
   * - Conversation arrays: chat-style display
   * - JSON/code: full-width block with title (like CodeBlock)
   */
  import DetailValue from './detail/DetailValue.svelte';
  import HighlightedCode from './detail/HighlightedCode.svelte';
  import ConversationHistory from './detail/ConversationHistory.svelte';
  import PropertyGroup from './detail/PropertyGroup.svelte';
  import { isRecord } from '../../config/utils.js';
  import { parseJson } from '../../services/dataviewer/parsing/valueParsing.js';

  export let label: string;
  export let value: unknown;

  // Convert camelCase to spaced words: "inputTokens" → "Input Tokens"
  function formatLabel(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/^./, (c) => c.toUpperCase());
  }

  // Check if a string looks like JSON (starts with { or [)
  function looksLikeJson(str: string): boolean {
    const trimmed = str.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  }

  // Detect if array looks like conversation messages (has role/content structure)
  function isConversationArray(arr: unknown[]): boolean {
    if (arr.length === 0) return false;
    return arr.every(item =>
      typeof item === 'object' && item !== null &&
      ('role' in item || 'content' in item)
    );
  }

  $: displayLabel = formatLabel(label);
  $: isEmpty = value === null || value === undefined;

  // Detect conversation arrays first
  $: isConversation = Array.isArray(value) && isConversationArray(value);

  // Detect if value should render as a code block (but not conversations)
  $: isJsonString = typeof value === 'string' && looksLikeJson(value);
  $: isObject = (isRecord(value) || Array.isArray(value)) && !isConversation;
  $: isCodeBlock = isJsonString || isObject;

  // Parse JSON string for display
  $: jsonCode = isJsonString
    ? JSON.stringify(parseJson(value as string) ?? value, null, 2)
    : isObject
      ? JSON.stringify(value, null, 2)
      : '';

  // Simple values are non-string primitives OR short strings that don't look like JSON
  $: isSimpleValue = typeof value === 'number' || typeof value === 'boolean' ||
    (typeof value === 'string' && !looksLikeJson(value) && value.length <= 120 && !value.includes('\n'));
</script>

{#if isEmpty}
  <div class="property-row">
    <div class="property-label">{displayLabel}</div>
    <div class="property-value">
      <span class="simple-value">-</span>
    </div>
  </div>
{:else if isConversation}
  <div class="code-block-row">
    <div class="code-block-label">{displayLabel}</div>
    <ConversationHistory messages={value} />
  </div>
{:else if isCodeBlock}
  <div class="code-block-row">
    <div class="code-block-label">{displayLabel}</div>
    <HighlightedCode code={jsonCode} language="json" />
  </div>
{:else if isSimpleValue}
  <div class="property-row">
    <div class="property-label">{displayLabel}</div>
    <div class="property-value">
      <span class="simple-value">{value}</span>
    </div>
  </div>
{:else}
  <div class="property-row">
    <div class="property-label">{displayLabel}</div>
    <div class="property-value">
      <DetailValue {value} />
    </div>
  </div>
{/if}

<style>
  .property-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .property-label {
    font-size: 12px;
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-light);
  }

  .property-value {
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    word-break: break-word;
  }

  /* Code block with inline label */
  .code-block-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .code-block-label {
    font-size: 10px;
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    padding-left: var(--space-md);
  }
</style>
