<script lang="ts">
  // Summary view for a selected stage.
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

<div class="sidebar-type-badge">Stage</div>
<div class="stage-summary">
  {nodes.length} node{nodes.length !== 1 ? 's' : ''}
</div>

{#each groups as group (group.label)}
  {#if group.nodes.length > 0}
    <div class="stage-group">
      <div class="stage-group-header">{group.label}</div>
      <div class="stage-node-list">
        {#each group.nodes as node (node.id)}
          <div class="stage-node-item">
            <span class={`stage-node-icon ${node.nodeType}`}></span>
            <span class="stage-node-label">{node.label}</span>
            {#if node.duration}
              <span class="stage-node-meta">{node.duration}</span>
            {:else if node.assetType}
              <span class="stage-node-meta">
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
  <div class="stage-group">
    <div class="stage-group-header">Flow</div>
    <div class="stage-flow">
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

  .stage-summary {
    font-size: 13px;
    color: var(--color-text-muted);
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .stage-group {
    margin-bottom: 20px;
  }

  .stage-group-header {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--color-text-light);
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .stage-node-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stage-node-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--color-surface-subtle);
    border-radius: 6px;
  }

  .stage-node-icon {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .stage-node-icon.process {
    background: var(--color-stage-compute);
  }

  .stage-node-icon.data {
    background: var(--color-stage-data);
  }

  .stage-node-icon.attestation {
    background: var(--color-stage-attestation);
  }

  .stage-node-label {
    flex: 1;
    font-size: 13px;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .stage-node-meta {
    font-size: 11px;
    color: var(--color-text-light);
    font-family: var(--font-mono);
  }

  .stage-flow {
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
