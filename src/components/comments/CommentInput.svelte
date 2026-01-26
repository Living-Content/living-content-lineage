<script lang="ts">
  /**
   * Comment input with send button.
   * Styled to match /fe ChatInput.
   */
  let {
    onSubmit,
    disabled = false,
  }: {
    onSubmit: (content: string) => void;
    disabled?: boolean;
  } = $props();

  let content = $state('');
  let inputRef: HTMLTextAreaElement | null = $state(null);

  function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    onSubmit(trimmed);
    content = '';

    if (inputRef) {
      inputRef.style.height = 'auto';
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function autoResize() {
    if (inputRef) {
      inputRef.style.height = 'auto';
      inputRef.style.height = `${Math.min(inputRef.scrollHeight, 120)}px`;
    }
  }

  let canSubmit = $derived(content.trim().length > 0 && !disabled);
</script>

<div class="comment-input">
  <div class="input-container">
    <textarea
      bind:this={inputRef}
      bind:value={content}
      class="input"
      placeholder="Write a comment..."
      rows="1"
      maxlength="2000"
      {disabled}
      onkeydown={handleKeyDown}
      oninput={autoResize}
    ></textarea>
    <button
      class="send-btn"
      disabled={!canSubmit}
      onclick={handleSubmit}
      title="Send"
    ></button>
  </div>
</div>

<style>
  .comment-input {
    padding: var(--space-md);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border-soft);
  }

  .input-container {
    display: flex;
    align-items: center;
    padding: 8px;
    border: 1px solid var(--color-text-primary);
    border-radius: 24px;
    background: none;
  }

  .input-container:focus-within {
    border-color: var(--color-text-secondary);
  }

  .input {
    flex: 1;
    min-height: 24px;
    max-height: 100px;
    padding: 0 var(--space-md);
    background: transparent;
    border: none;
    font-size: var(--font-size-small);
    line-height: 24px;
    resize: none;
    outline: none;
    font-family: inherit;
    color: var(--color-text-primary);
  }

  .input:disabled {
    opacity: 0.5;
  }

  .input::placeholder {
    color: var(--color-text-faint);
  }

  .send-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    margin-left: var(--space-sm);
    background: transparent;
    background-image: url('https://assets.livingcontent.co/fe/images/icon-enter-black.svg');
    background-position: center;
    background-repeat: no-repeat;
    background-size: 70%;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    opacity: 0.8;
    transition: opacity 0.15s ease;
  }

  .send-btn:hover:not(:disabled) {
    opacity: 1;
  }

  .send-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
