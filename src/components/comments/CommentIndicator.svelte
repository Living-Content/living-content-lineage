<script lang="ts">
  /**
   * Badge showing comment count on a node.
   */
  let { count }: { count: number } = $props();
</script>

{#if count > 0}
  <div class="indicator">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="count">{count > 99 ? '99+' : count}</span>
  </div>
{/if}

<style>
  .indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--color-surface, #fff);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary, #666);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .icon {
    width: 14px;
    height: 14px;
  }

  .count {
    min-width: 16px;
    text-align: center;
  }
</style>
