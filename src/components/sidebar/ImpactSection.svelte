<script lang="ts">
  // Displays environmental impact and token metadata.
  import type { LineageNodeData } from '../../types.js';

  export let node: LineageNodeData;

  $: impact = node.environmentalImpact ?? node.assetManifest?.environmentalImpact;
  $: tokens = node.tokens;
  $: hasImpactData =
    impact?.co2Grams !== undefined || impact?.energyKwh !== undefined;
  $: impactClass = hasImpactData ? 'impact-available' : 'impact-unknown';

  $: detailText = (() => {
    if (impact?.co2Grams !== undefined || impact?.energyKwh !== undefined) {
      const parts: string[] = [];
      if (impact.co2Grams !== undefined) {
        parts.push(`${impact.co2Grams.toFixed(3)}g CO2`);
      }
      if (impact.energyKwh !== undefined) {
        parts.push(`${impact.energyKwh.toFixed(4)} kWh`);
      }
      return parts.join(' · ');
    }
    if (tokens) {
      const totalTokens = tokens.input + tokens.output;
      return `${totalTokens.toLocaleString()} tokens · Impact data unavailable`;
    }
    return 'Impact data unavailable';
  })();
</script>

{#if impact || tokens}
  <div class="sidebar-impact">
    <img
      src="/icons/leaf.svg"
      alt="Environmental impact"
      class={`impact-icon ${impactClass}`}
    />
    <div class="impact-content">
      <span class={`impact-label ${impactClass}`}>
        {hasImpactData ? 'Impact' : 'Impact pending'}
      </span>
      <span class="impact-detail">{detailText}</span>
    </div>
  </div>
{/if}
