<script lang="ts">
  // Summary view for a selected stage.
  import type { LineageEdgeData, LineageNodeData } from '../../types.js';

  export let nodes: LineageNodeData[];
  export let edges: LineageEdgeData[];

  $: computeNodes = nodes.filter((node) => node.nodeType === 'compute');
  $: dataNodes = nodes.filter((node) => node.nodeType === 'data');
  $: attestNodes = nodes.filter((node) => node.nodeType === 'attestation');

  $: groups = [
    { label: 'Computations', nodes: computeNodes },
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
              <span class="stage-node-meta">{node.assetType}</span>
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
