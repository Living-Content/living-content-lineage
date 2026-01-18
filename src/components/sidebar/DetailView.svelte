<script lang="ts">
  // Full detail panel content for a selected node.
  import type { LineageNodeData } from '../../types.js';
  import {
    shouldDisplayKey,
    formatKeyLabel,
    isSummaryValue
  } from '../../services/sidebar/contentKeys.js';
  import DetailSection from './DetailSection.svelte';
  import DetailValue from './detail/DetailValue.svelte';
  import MetaRow from './MetaRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: contentEntries = assetManifest?.content
    ? Object.entries(assetManifest.content).filter(
        ([key, value]) =>
          shouldDisplayKey(key) && !isSummaryValue(value) && value !== undefined && value !== null
      )
    : [];
</script>

{#if assetManifest}
  {#if contentEntries.length}
    <DetailSection title="Content">
      <div class="detail-fields">
        {#each contentEntries as [key, value] (key)}
          <div class="detail-field">
            <span class="detail-field-key">{formatKeyLabel(key)}</span>
            <DetailValue {value} />
          </div>
        {/each}
      </div>
    </DetailSection>
  {/if}

  {#if assetManifest.sourceCode}
    <DetailSection title="Source Code">
      <pre class="code-block"><code>{assetManifest.sourceCode}</code></pre>
    </DetailSection>
  {/if}

  {#if assetManifest.assertions?.length}
    <DetailSection title="Assertions">
      <div class="detail-fields">
        {#each assetManifest.assertions as assertion (assertion.label)}
          <div class="assertion-block">
            <div class="assertion-label">{assertion.label}</div>
            <div class="assertion-data">
              <DetailValue value={assertion.data} />
            </div>
          </div>
        {/each}
      </div>
    </DetailSection>
  {/if}

  {#if assetManifest.ingredients?.length}
    <DetailSection title="Ingredients">
      <div class="ingredients-list">
        {#each assetManifest.ingredients as ingredient (ingredient.instanceId)}
          <div class="ingredient-item">
            <span class="ingredient-title">{ingredient.title}</span>
            <span class="ingredient-rel">{ingredient.relationship}</span>
          </div>
        {/each}
      </div>
    </DetailSection>
  {/if}

  {#if assetManifest.signatureInfo}
    <DetailSection title="Signature">
      <div class="detail-fields">
        <MetaRow label="algorithm" value={assetManifest.signatureInfo.alg} />
        <MetaRow label="issuer" value={assetManifest.signatureInfo.issuer} />
        <MetaRow label="time" value={assetManifest.signatureInfo.time} />
      </div>
    </DetailSection>
  {/if}

  {#if assetManifest.format || assetManifest.instanceId || assetManifest.claimGenerator}
    <DetailSection title="Manifest">
      <div class="detail-fields">
        {#if assetManifest.format}
          <MetaRow label="format" value={assetManifest.format} />
        {/if}
        {#if assetManifest.instanceId}
          <MetaRow label="instance_id" value={assetManifest.instanceId} />
        {/if}
        {#if assetManifest.claimGenerator}
          <MetaRow label="generator" value={assetManifest.claimGenerator} />
        {/if}
      </div>
    </DetailSection>
  {/if}
{/if}
