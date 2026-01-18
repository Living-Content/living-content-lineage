<script lang="ts">
  /**
   * Detail view for Dataset assets.
   * Displays retrieval metrics, search results, and chunk previews.
   */
  import type { LineageNodeData } from '../../../../types.js';
  import { formatPercent, formatNumber } from '../../../../services/sidebar/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import MetaRow from '../../MetaRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: content = assetManifest?.content as DatasetContent | undefined;

  interface Chunk {
    id?: string;
    content?: string;
    score?: number;
    source?: string;
    type?: string;
  }

  interface SearchResult {
    query_text?: string;
    result_count?: number;
    avg_score?: number;
  }

  interface ExecutionResult {
    success?: boolean;
    gaps_addressed?: string[];
    chunks_retrieved?: number;
    confidence?: number;
  }

  interface DatasetContent {
    description?: string;
    execution_result?: ExecutionResult;
    search_results?: SearchResult[];
    chunks?: Chunk[];
    total_chunks?: number;
  }

  $: executionResult = content?.execution_result;
  $: searchResults = content?.search_results ?? [];
  $: chunks = content?.chunks ?? [];

  $: chunksRetrieved = executionResult?.chunks_retrieved ?? chunks.length;
  $: confidence = formatPercent(executionResult?.confidence);
  $: avgScore = searchResults[0]?.avg_score !== undefined
    ? formatNumber(searchResults[0].avg_score, 3)
    : '-';
  $: gapsAddressed = executionResult?.gaps_addressed ?? [];

  let chunksCollapsed = true;
</script>

<div class="dataset-detail-view">
  <PropertyGroup title="Retrieval Stats" collapsible={false}>
    <MetaRow label="Chunks Retrieved" value={String(chunksRetrieved)} />
    <MetaRow label="Confidence" value={confidence} />
    <MetaRow label="Avg Score" value={avgScore} />
  </PropertyGroup>

  {#if searchResults.length > 0}
    <PropertyGroup title="Search Query" collapsible={false}>
      {#each searchResults as result}
        {#if result.query_text}
          <p class="query-text">{result.query_text}</p>
        {/if}
        {#if result.result_count !== undefined}
          <MetaRow label="Results" value={String(result.result_count)} />
        {/if}
      {/each}
    </PropertyGroup>
  {/if}

  {#if gapsAddressed.length > 0}
    <PropertyGroup title="Gaps Addressed" collapsed>
      {#each gapsAddressed as gap}
        <div class="gap-item">{gap}</div>
      {/each}
    </PropertyGroup>
  {/if}

  {#if chunks.length > 0}
    <PropertyGroup title="Retrieved Chunks ({chunks.length})" bind:collapsed={chunksCollapsed}>
      <div class="chunks-list">
        {#each chunks as chunk, i}
          <div class="chunk-item">
            <div class="chunk-header">
              <span class="chunk-index">#{i + 1}</span>
              {#if chunk.score !== undefined}
                <span class="chunk-score">Score: {formatNumber(chunk.score, 4)}</span>
              {/if}
            </div>
            {#if chunk.content}
              <p class="chunk-content">{chunk.content}</p>
            {/if}
          </div>
        {/each}
      </div>
    </PropertyGroup>
  {/if}
</div>

<style>
  .dataset-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }

  .query-text {
    margin: 0 0 var(--space-sm, 8px) 0;
    font-size: var(--font-size-body, 14px);
    color: var(--color-text-primary);
    line-height: var(--line-height-normal, 1.5);
    font-style: italic;
  }

  .gap-item {
    font-size: var(--font-size-small, 12px);
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
    padding: var(--space-xs, 4px) 0;
  }

  .chunks-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 12px);
  }

  .chunk-item {
    padding: var(--space-md, 12px);
    background: var(--color-surface-subtle, rgba(0, 0, 0, 0.03));
    border-radius: var(--radius-md, 8px);
  }

  .chunk-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm, 8px);
  }

  .chunk-index {
    font-size: var(--font-size-tiny, 10px);
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .chunk-score {
    font-size: var(--font-size-tiny, 10px);
    font-family: var(--font-mono);
    color: var(--color-text-light);
  }

  .chunk-content {
    margin: 0;
    font-size: var(--font-size-small, 12px);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed, 1.6);
  }
</style>
