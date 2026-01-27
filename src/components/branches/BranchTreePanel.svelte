<script lang="ts">
  /**
   * Branch tree visualization panel.
   * Shows all branches from the root workflow as a tree structure.
   */
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { logger } from '../../lib/logger.js';
  import { api } from '../../lib/api.js';
  import { configStore } from '../../stores/configStore.svelte.js';

  interface BranchTreeNode {
    workflowId: string;
    branchPointNodeId: string | null;
    branchDepth: number;
    createdAt: string | null;
    modificationsCount: number;
    title: string | null;
    children: BranchTreeNode[];
  }

  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
  }

  let { isOpen = false, onClose }: Props = $props();

  let tree = $state<BranchTreeNode | null>(null);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  let currentWorkflowId = $derived(configStore.current.workflowId);

  $effect(() => {
    if (isOpen && !tree) {
      loadTree();
    }
  });

  async function loadTree(): Promise<void> {
    const { apiUrl, workflowId } = configStore.current;
    if (!apiUrl || !workflowId) return;

    isLoading = true;
    error = null;

    try {
      const response = await api.fetch(
        `${apiUrl}/replay/trace/${workflowId}/tree`
      );

      if (!response.ok) {
        error = `Failed to load tree: ${response.status}`;
        return;
      }

      tree = await response.json();
      logger.debug('Branch: Loaded tree');
    } catch (e) {
      logger.error('Branch: Error loading tree', e);
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      isLoading = false;
    }
  }

  function navigateToWorkflow(workflowId: string): void {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('workflowId', workflowId);
    window.location.href = newUrl.toString();
  }

  function formatDate(isoString: string | null): string {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
</script>

{#if isOpen}
  <aside class="branch-tree-panel" transition:slide={{ duration: 200, axis: 'x' }}>
    <header class="panel-header">
      <h2 class="panel-title">Branch Tree</h2>
      {#if onClose}
        <button class="close-btn" onclick={onClose} aria-label="Close panel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </header>

    <div class="panel-content">
      {#if isLoading}
        <div class="loading">Loading branches...</div>
      {:else if error}
        <div class="error">{error}</div>
      {:else if tree}
        <ul class="tree-root">
          {#snippet treeNode(node: BranchTreeNode, depth: number)}
            <li class="tree-node" style:--depth={depth}>
              <button
                class="node-btn"
                class:current={node.workflowId === currentWorkflowId}
                onclick={() => navigateToWorkflow(node.workflowId)}
              >
                <span class="node-icon">{node.branchDepth === 0 ? '◉' : '◎'}</span>
                <span class="node-label">
                  {#if node.branchDepth === 0}
                    Original
                  {:else}
                    Branch {node.branchDepth}
                  {/if}
                </span>
                {#if node.modificationsCount > 0}
                  <span class="mod-count">{node.modificationsCount}</span>
                {/if}
              </button>
              {#if node.createdAt}
                <span class="node-date">{formatDate(node.createdAt)}</span>
              {/if}
              {#if node.children.length > 0}
                <ul class="tree-children">
                  {#each node.children as child (child.workflowId)}
                    {@render treeNode(child, depth + 1)}
                  {/each}
                </ul>
              {/if}
            </li>
          {/snippet}
          {@render treeNode(tree, 0)}
        </ul>
      {:else}
        <div class="empty">No branch history available</div>
      {/if}
    </div>
  </aside>
{/if}

<style>
  .branch-tree-panel {
    position: fixed;
    top: var(--header-height, 60px);
    right: 0;
    bottom: 0;
    width: 280px;
    background: var(--color-surface);
    border-left: 1px solid var(--color-border);
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
    z-index: var(--z-panel, 100);
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .panel-title {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .close-btn {
    padding: var(--space-xs);
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md);
  }

  .loading,
  .error,
  .empty {
    padding: var(--space-lg);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-small);
  }

  .error {
    color: var(--color-error, #c00);
  }

  .tree-root,
  .tree-children {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tree-children {
    margin-left: var(--space-lg);
    padding-left: var(--space-sm);
    border-left: 1px solid var(--color-border-soft);
  }

  .tree-node {
    padding: var(--space-xs) 0;
  }

  .node-btn {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    width: 100%;
    padding: var(--space-xs) var(--space-sm);
    background: none;
    border: none;
    border-radius: var(--radius-xs);
    font-size: var(--font-size-small);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .node-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  .node-btn.current {
    background: var(--color-primary-soft, rgba(0, 0, 255, 0.1));
    color: var(--color-primary);
    font-weight: 500;
  }

  .node-icon {
    flex-shrink: 0;
    font-size: 12px;
  }

  .node-label {
    flex: 1;
  }

  .mod-count {
    flex-shrink: 0;
    padding: 1px 6px;
    background: var(--color-text-muted);
    border-radius: 10px;
    font-size: 10px;
    color: white;
  }

  .node-date {
    display: block;
    padding-left: calc(var(--space-sm) + 16px);
    font-size: 10px;
    color: var(--color-text-muted);
  }
</style>
