import type { LineageNodeData } from '../../types.js';

export function buildImpactSection(
  nodeData: LineageNodeData,
  container: HTMLElement
): void {
  const impact =
    nodeData.environmentalImpact ?? nodeData.assetManifest?.environmentalImpact;
  const tokens = nodeData.tokens;
  if (!impact && !tokens) return;

  const hasImpactData =
    impact?.co2Grams !== undefined || impact?.energyKwh !== undefined;
  const impactClass = hasImpactData ? 'impact-available' : 'impact-unknown';

  const impactWrapper = document.createElement('div');
  impactWrapper.className = 'sidebar-impact';

  const icon = document.createElement('img');
  icon.src = '/icons/leaf.svg';
  icon.alt = 'Environmental impact';
  icon.className = `impact-icon ${impactClass}`;

  const content = document.createElement('div');
  content.className = 'impact-content';

  const label = document.createElement('span');
  label.className = `impact-label ${impactClass}`;
  label.textContent = hasImpactData ? 'Impact' : 'Impact pending';
  content.appendChild(label);

  const details = document.createElement('span');
  details.className = 'impact-detail';

  if (impact?.co2Grams !== undefined || impact?.energyKwh !== undefined) {
    const parts: string[] = [];
    if (impact.co2Grams !== undefined) {
      parts.push(`${impact.co2Grams.toFixed(3)}g CO2`);
    }
    if (impact.energyKwh !== undefined) {
      parts.push(`${impact.energyKwh.toFixed(4)} kWh`);
    }
    details.textContent = parts.join(' · ');
  } else if (tokens) {
    const totalTokens = tokens.input + tokens.output;
    details.textContent = `${totalTokens.toLocaleString()} tokens · Impact data unavailable`;
  } else {
    details.textContent = 'Impact data unavailable';
  }

  content.appendChild(details);
  impactWrapper.appendChild(icon);
  impactWrapper.appendChild(content);
  container.appendChild(impactWrapper);
}
