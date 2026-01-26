<script lang="ts">
  /**
   * Aggregate view for a selected step.
   * Shows Inputs → Processing → Outputs using the app's card-based design system.
   */
  import type { TraceEdgeData, TraceNodeData, Phase } from '../../config/types.js';
  import { extractAssertionData, formatDuration } from '../../services/dataviewer/parsing/assertionParsers.js';
  import DetailSection from './DetailSection.svelte';
  import DataCard from './cards/DataCard.svelte';
  import NodeCard from './detail/NodeCard.svelte';

  export let nodes: TraceNodeData[];
  export let edges: TraceEdgeData[];

  // Derive phase from the first node (all nodes in a step share the same phase)
  $: phase = nodes[0]?.phase as Phase | undefined;

  // Get total duration from process nodes
  function getTotalDurationMs(processNodes: TraceNodeData[]): number {
    let totalMs = 0;
    for (const node of processNodes) {
      const assertions = extractAssertionData(node.assetManifest?.assertions);
      const ms = assertions.action?.durationMs ?? assertions.execution?.executionDurationMs;
      if (ms) totalMs += ms;
    }
    return totalMs;
  }

  $: nodeIds = new Set(nodes.map((n) => n.id));

  // Input nodes: nodes that receive edges from outside this step
  $: incomingEdges = edges.filter((e) => !nodeIds.has(e.source) && nodeIds.has(e.target));
  $: inputNodeIds = new Set(incomingEdges.map((e) => e.target));
  $: inputNodes = nodes.filter((n) => inputNodeIds.has(n.id));

  // Output nodes: nodes that send edges outside this step
  $: outgoingEdges = edges.filter((e) => nodeIds.has(e.source) && !nodeIds.has(e.target));
  $: outputNodeIds = new Set(outgoingEdges.map((e) => e.source));
  $: outputNodes = nodes.filter((n) => outputNodeIds.has(n.id));

  // Process nodes
  $: processNodes = nodes.filter((n) => n.nodeType === 'process');
  $: totalDurationMs = getTotalDurationMs(processNodes);
  $: totalDuration = totalDurationMs > 0 ? formatDuration(totalDurationMs) : undefined;
</script>

<div class="step-overview">
  {#if inputNodes.length > 0}
    <DetailSection title="Inputs">
      <div class="node-list">
        {#each inputNodes as node (node.id)}
          <NodeCard
            title={node.title ?? node.label}
            assetType={node.assetType}
            phase={node.phase}
          />
        {/each}
      </div>
    </DetailSection>
  {/if}

  {#if processNodes.length > 0}
    <DetailSection title="Processing">
      <div class="metrics-grid">
        <DataCard
          value={processNodes.length}
          label={processNodes.length === 1 ? 'Process' : 'Processes'}
          type="number"
          span={totalDuration ? 1 : 2}
          size="compact"
          {phase}
        />
        {#if totalDuration}
          <DataCard
            value={totalDuration}
            label="Duration"
            type="duration"
            span={1}
            size="compact"
            {phase}
          />
        {/if}
      </div>
    </DetailSection>
  {/if}

  {#if outputNodes.length > 0}
    <DetailSection title="Outputs">
      <div class="node-list">
        {#each outputNodes as node (node.id)}
          <NodeCard
            title={node.title ?? node.label}
            assetType={node.assetType}
            phase={node.phase}
          />
        {/each}
      </div>
    </DetailSection>
  {/if}
</div>

<style>
  .step-overview {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }

  .node-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
</style>
