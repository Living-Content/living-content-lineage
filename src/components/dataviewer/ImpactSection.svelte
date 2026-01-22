<script lang="ts">
  /**
   * Displays environmental impact metrics.
   * Uses impact data from asset manifest when available.
   */
  import type { AssetType, TraceNodeData } from '../../config/types.js';
  import { extractAssertionData } from '../../services/dataviewer/parsing/assertionParsers.js';

  export let node: TraceNodeData;
  export let assetType: AssetType | undefined = undefined;

  interface ImpactData {
    co2Grams?: number;
    energyKwh?: number;
  }

  function formatImpactDetail(impact: ImpactData | undefined, totalTokens: number | undefined): string {
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
    if (totalTokens !== undefined) {
      return `${totalTokens.toLocaleString()} tokens · Impact data unavailable`;
    }
    return 'Impact data unavailable';
  }

  $: effectiveAssetType = assetType ?? node.assetType;
  $: impact = node.environmentalImpact ?? node.assetManifest?.environmentalImpact;
  $: assertions = extractAssertionData(node.assetManifest?.assertions);
  $: totalTokens = effectiveAssetType === 'Model' ? assertions.usage?.totalTokens : undefined;
  $: hasImpactData = impact?.co2Grams !== undefined || impact?.energyKwh !== undefined;
  $: impactClass = hasImpactData ? 'impact-available' : 'impact-unknown';
  $: detailText = formatImpactDetail(impact, totalTokens);
  $: showSection = impact || (effectiveAssetType === 'Model' && totalTokens !== undefined);
</script>

{#if showSection}
  <div class="impact-section">
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

<style>
  .impact-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-soft);
  }

  .impact-icon {
    width: 20px;
    height: 20px;
  }

  .impact-icon.impact-minimal {
    filter: var(--filter-impact-minimal);
  }

  .impact-icon.impact-available {
    filter: var(--filter-impact-available);
  }

  .impact-icon.impact-unknown {
    filter: var(--filter-impact-unknown);
  }

  .impact-icon.impact-low {
    filter: var(--filter-impact-low);
  }

  .impact-icon.impact-moderate {
    filter: var(--filter-impact-moderate);
  }

  .impact-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .impact-label {
    font-size: 12px;
    font-weight: 500;
  }

  .impact-label.impact-minimal {
    color: var(--color-impact-minimal);
  }

  .impact-label.impact-available {
    color: var(--color-impact-available);
  }

  .impact-label.impact-unknown {
    color: var(--color-impact-unknown);
  }

  .impact-label.impact-low {
    color: var(--color-impact-low);
  }

  .impact-label.impact-moderate {
    color: var(--color-impact-moderate);
  }

  .impact-detail {
    font-size: 11px;
    color: var(--color-text-light);
    font-family: var(--font-mono);
  }
</style>
