<script lang="ts">
  // Summary view for a selected workflow.
  import type { LineageEdgeData, LineageNodeData } from '../../config/types.js';
  import { formatAssetTypeLabel } from '../../config/labels.js';

  export let nodes: LineageNodeData[];
  export let edges: LineageEdgeData[];

  $: processNodes = nodes.filter((node) => node.nodeType === 'process');
  $: dataNodes = nodes.filter((node) => node.nodeType === 'data');
  $: attestNodes = nodes.filter((node) => node.nodeType === 'attestation');

  $: groups = [
    { label: 'Processes', nodes: processNodes },
    { label: 'Data', nodes: dataNodes },
    { label: 'Attestations', nodes: attestNodes },
  ];

  $: nodeIds = new Set(nodes.map((node) => node.id));
  $: internalEdges = edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target) && !edge.isGate
  );
  $: incomingEdges = edges.filter(
    (edge) => !nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
  $: outgoingEdges = edges.filter(
    (edge) => nodeIds.has(edge.source) && !nodeIds.has(edge.target)
  );
</script>

<div class="sidebar-type-badge">Workflow</div>
<div class="workflow-summary">
  {nodes.length} node{nodes.length !== 1 ? 's' : ''}
</div>

{#each groups as group (group.label)}
  {#if group.nodes.length > 0}
    <div class="workflow-group">
      <div class="workflow-group-header">{group.label}</div>
      <div class="workflow-node-list">
        {#each group.nodes as node (node.id)}
          <div class="workflow-node-item">
            <span class={`workflow-node-icon ${node.nodeType}`}></span>
            <span class="workflow-node-label">{node.label}</span>
            {#if node.duration}
              <span class="workflow-node-meta">{node.duration}</span>
            {:else if node.assetType}
              <span class="workflow-node-meta">
                {formatAssetTypeLabel(node.assetType)}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/each}

{#if internalEdges.length || incomingEdges.length || outgoingEdges.length}
  <div class="workflow-group">
    <div class="workflow-group-header">Flow</div>
    <div class="workflow-flow">
      {#if incomingEdges.length}
        <div class="flow-item">
          <span class="flow-arrow">→</span>
          {incomingEdges.length} incoming
        </div>
      {/if}
      {#if internalEdges.length}
        <div class="flow-item">
          <span class="flow-arrow">⟷</span>
          {internalEdges.length} internal
        </div>
      {/if}
      {#if outgoingEdges.length}
        <div class="flow-item">
          <span class="flow-arrow">→</span>
          {outgoingEdges.length} outgoing
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sidebar-type-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: var(--color-text-muted);
    background: var(--color-border-soft);
    padding: 3px 10px;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .workflow-summary {
    font-size: 13px;
    color: var(--color-text-muted);
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .workflow-group {
    margin-bottom: 20px;
  }

  .workflow-group-header {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--color-text-light);
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .workflow-node-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .workflow-node-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--color-surface-subtle);
    border-radius: 6px;
  }

  .workflow-node-icon {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .workflow-node-icon.process {
    background: var(--color-workflow-compute);
  }

  .workflow-node-icon.data {
    background: var(--color-workflow-data);
  }

  .workflow-node-icon.attestation {
    background: var(--color-workflow-attestation);
  }

  .workflow-node-label {
    flex: 1;
    font-size: 13px;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .workflow-node-meta {
    font-size: 11px;
    color: var(--color-text-light);
    font-family: var(--font-mono);
  }

  .workflow-flow {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .flow-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .flow-arrow {
    color: var(--color-text-light);
    font-size: 14px;
  }
</style>
