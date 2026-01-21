import type { AssetManifest, StepUI } from '../../../../config/types.js';
import { validatePhase } from '../../../../config/utils.js';
import type { Manifest } from './lineageTypes.js';

export interface LayoutResult {
  positions: Map<string, { x: number; y: number; step: string }>;
  steps: StepUI[];
}

const HORIZONTAL_GAP = 0.2;
const VERTICAL_GAP = 0.08;

/**
 * Computes layout positions for all assets.
 * Groups assets by step and lays them out horizontally.
 */
export const computeLayout = (
  manifest: Manifest,
  _assetManifests: Map<string, AssetManifest>
): LayoutResult => {
  const positions = new Map<string, { x: number; y: number; step: string }>();

  // Group assets by step
  const assetsByStep = new Map<string, typeof manifest.assets>();
  manifest.assets.forEach((asset) => {
    if (!asset.step) {
      throw new Error(`Asset ${asset.id} missing step`);
    }
    if (!assetsByStep.has(asset.step)) {
      assetsByStep.set(asset.step, []);
    }
    assetsByStep.get(asset.step)!.push(asset);
  });

  // Process steps in order
  let currentX = 0.1;
  manifest.steps.forEach((step) => {
    const stepAssets = assetsByStep.get(step.id) ?? [];
    if (stepAssets.length === 0) return;

    const totalHeight = (stepAssets.length - 1) * VERTICAL_GAP;
    const startY = 0.5 - totalHeight / 2;

    stepAssets.forEach((asset, idx) => {
      positions.set(asset.id, {
        x: currentX,
        y: startY + idx * VERTICAL_GAP,
        step: step.id,
      });
    });

    currentX += HORIZONTAL_GAP;
  });

  // Place claims above verified nodes
  manifest.claims.forEach((attest) => {
    const verifiedId = attest.verifies[0];
    const verifiedPos = verifiedId ? positions.get(verifiedId) : undefined;
    if (verifiedPos) {
      positions.set(attest.id, {
        x: verifiedPos.x,
        y: verifiedPos.y - VERTICAL_GAP,
        step: attest.step,
      });
    }
  });

  // Calculate step bounds from node positions
  const stepMinX = new Map<string, number>();
  const stepMaxX = new Map<string, number>();

  positions.forEach((pos) => {
    const stepId = pos.step;
    if (!stepMinX.has(stepId) || pos.x < stepMinX.get(stepId)!) {
      stepMinX.set(stepId, pos.x);
    }
    if (!stepMaxX.has(stepId) || pos.x > stepMaxX.get(stepId)!) {
      stepMaxX.set(stepId, pos.x);
    }
  });

  const padding = 0.04;
  const steps: StepUI[] = manifest.steps.map((step) => {
    const phase = validatePhase(step.phase, `step ${step.id}`);
    const minX = stepMinX.get(step.id) ?? 0;
    const maxX = stepMaxX.get(step.id) ?? 0;
    return {
      id: step.id,
      label: step.label,
      phase,
      xStart: minX - padding,
      xEnd: maxX + padding,
    };
  });

  return { positions, steps };
};
