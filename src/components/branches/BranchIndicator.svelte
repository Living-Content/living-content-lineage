<script lang="ts">
  /**
   * Branch indicator badge for nodes.
   * Shows when a node is the branch point for one or more replay branches.
   */
  import { fade } from 'svelte/transition';

  interface Props {
    branchCount: number;
    isModified?: boolean;
  }

  let { branchCount, isModified = false }: Props = $props();

  let hasBranches = $derived(branchCount > 0);
</script>

{#if hasBranches || isModified}
  <div
    class="branch-indicator"
    class:modified={isModified}
    transition:fade={{ duration: 150 }}
    title={isModified
      ? 'Modified for replay'
      : `${branchCount} branch${branchCount === 1 ? '' : 'es'} from this node`}
  >
    {#if isModified}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    {:else}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="6" cy="6" r="3" />
        <path d="M6 21V9a9 9 0 0 0 9 9" />
        <circle cx="18" cy="18" r="3" />
      </svg>
      {#if branchCount > 1}
        <span class="count">{branchCount}</span>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .branch-indicator {
    position: absolute;
    top: -6px;
    right: -6px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px;
    background: var(--color-primary);
    border-radius: 10px;
    color: white;
    font-size: 10px;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .branch-indicator.modified {
    background: var(--color-warning, #f59e0b);
  }

  .count {
    line-height: 1;
  }
</style>
