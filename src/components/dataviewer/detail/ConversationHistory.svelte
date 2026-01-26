<script lang="ts">
  /**
   * Chat-style display for conversation message arrays.
   * User messages align left, assistant messages align right.
   * Dotted line separates each query pair.
   */
  type Message = { role?: string; content?: string; [key: string]: unknown };

  export let messages: Message[];

  function getRoleClass(role: string | undefined): string {
    switch (role?.toLowerCase()) {
      case 'user': return 'role-user';
      case 'assistant': return 'role-assistant';
      case 'system': return 'role-system';
      default: return 'role-other';
    }
  }

  function getContent(message: Message): string {
    if (typeof message.content === 'string') return message.content;
    return JSON.stringify(message, null, 2);
  }

  // Check if we should show a separator after this message
  // Separator appears after assistant responses (end of a query pair)
  function showSeparator(index: number, role: string | undefined): boolean {
    if (index >= messages.length - 1) return false;
    const isAssistant = role?.toLowerCase() === 'assistant';
    const nextIsUser = messages[index + 1]?.role?.toLowerCase() === 'user';
    return isAssistant && nextIsUser;
  }
</script>

<div class="conversation-history">
  {#each messages as message, i (i)}
    <div class="message {getRoleClass(message.role)}">
      <div class="message-role">{message.role ?? 'unknown'}</div>
      <div class="message-content">{getContent(message)}</div>
    </div>
    {#if showSeparator(i, message.role)}
      <div class="pair-separator"></div>
    {/if}
  {/each}
</div>

<style>
  .conversation-history {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
    padding: 0 var(--space-md);
  }

  .message {
    padding: var(--space-sm, 8px) var(--space-md, 12px);
    border-radius: var(--radius-md, 8px);
    font-family: var(--font-mono);
    font-size: 12px;
    max-width: 85%;
  }

  .message-role {
    font-size: 10px;
    font-weight: var(--font-weight-medium, 500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
    color: var(--color-text-muted);
  }

  .message-content {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
    color: var(--color-text-primary);
  }

  .role-user {
    align-self: flex-end;
    background: var(--color-surface-secondary, #f5f5f5);
  }

  .role-assistant {
    align-self: flex-start;
    background: var(--color-surface-tertiary, #eaeaea);
  }

  .role-system {
    align-self: center;
    background: transparent;
    border: 1px dashed var(--color-text-muted, #888);
    font-style: italic;
    max-width: 100%;
  }

  .role-other {
    align-self: flex-start;
    background: var(--color-surface-secondary, #f5f5f5);
  }

  .pair-separator {
    border-top: 1px dashed var(--color-text-faint, #ccc);
    margin: var(--space-sm, 8px) 0;
  }
</style>
