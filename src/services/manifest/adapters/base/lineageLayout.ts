import type { Stage, WorkflowPhase } from '../../../../config/types.js';
import type { LineageManifest } from './lineageTypes.js';

export interface LayoutResult {
  positions: Map<string, { x: number; y: number; stage: string }>;
  stages: Stage[];
}

// Initial spacing (will be adjusted after render based on actual bounds)
const HORIZONTAL_GAP = 0.2;
const VERTICAL_GAP = 0.08;

export const computeLayout = (manifest: LineageManifest): LayoutResult => {
  const positions = new Map<string, { x: number; y: number; stage: string }>();

  const compSet = new Set(manifest.computations.map((comp) => comp.id));

  const assetProducer = new Map<string, string>();
  manifest.computations.forEach((comp) => {
    comp.outputs.forEach((id) => assetProducer.set(id, comp.id));
  });

  const assetTypes = new Map<string, string>();
  manifest.assets.forEach((asset) => {
    assetTypes.set(asset.id, asset.asset_type);
  });

  let currentX = 0.1;
  const placedAssets = new Set<string>();

  manifest.computations.forEach((comp) => {
    const dataInputs = comp.inputs.filter((id) => !compSet.has(id));
    const sourceInputs = dataInputs.filter(
      (id) => !assetProducer.has(id) && !placedAssets.has(id)
    );

    const auxiliaryInputs = sourceInputs.filter((id) => {
      const type = assetTypes.get(id);
      return type === 'Code' || type === 'Model';
    });
    const dataSourceInputs = sourceInputs.filter((id) => {
      const type = assetTypes.get(id);
      return type !== 'Code' && type !== 'Model';
    });

    // Place data source inputs
    if (dataSourceInputs.length > 0) {
      const totalHeight = (dataSourceInputs.length - 1) * VERTICAL_GAP;
      const startY = 0.5 - totalHeight / 2;

      dataSourceInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: startY + idx * VERTICAL_GAP,
          stage: comp.stage,
        });
        placedAssets.add(inputId);
      });
      currentX += HORIZONTAL_GAP;
    }

    // Place computation
    positions.set(comp.id, {
      x: currentX,
      y: 0.5,
      stage: comp.stage,
    });

    // Place auxiliary inputs below
    if (auxiliaryInputs.length > 0) {
      auxiliaryInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: 0.5 + VERTICAL_GAP + idx * VERTICAL_GAP,
          stage: comp.stage,
        });
        placedAssets.add(inputId);
      });
    }

    currentX += HORIZONTAL_GAP;

    // Place outputs
    const outputs = comp.outputs.filter((id) => !placedAssets.has(id));
    if (outputs.length > 0) {
      const totalHeight = (outputs.length - 1) * VERTICAL_GAP;
      const startY = 0.5 - totalHeight / 2;

      outputs.forEach((outputId, idx) => {
        positions.set(outputId, {
          x: currentX,
          y: startY + idx * VERTICAL_GAP,
          stage: comp.stage,
        });
        placedAssets.add(outputId);
      });
      currentX += HORIZONTAL_GAP;
    }
  });

  // Place attestations above verified nodes
  manifest.attestations.forEach((attest) => {
    const verifiedId = attest.verifies[0];
    const verifiedPos = verifiedId ? positions.get(verifiedId) : undefined;
    if (verifiedPos) {
      positions.set(attest.id, {
        x: verifiedPos.x,
        y: verifiedPos.y - VERTICAL_GAP,
        stage: attest.stage,
      });
    }
  });

  // Calculate stage bounds from node positions
  const stageMinX = new Map<string, number>();
  const stageMaxX = new Map<string, number>();

  positions.forEach((pos) => {
    const stage = pos.stage;
    if (!stageMinX.has(stage) || pos.x < stageMinX.get(stage)!) {
      stageMinX.set(stage, pos.x);
    }
    if (!stageMaxX.has(stage) || pos.x > stageMaxX.get(stage)!) {
      stageMaxX.set(stage, pos.x);
    }
  });

  const padding = 0.04;
  const stages: Stage[] = manifest.stages.map((stage) => {
    const minX = stageMinX.get(stage.id) ?? 0;
    const maxX = stageMaxX.get(stage.id) ?? 0;
    return {
      id: stage.id,
      label: stage.label,
      phase: stage.phase as WorkflowPhase | undefined,
      xStart: minX - padding,
      xEnd: maxX + padding,
    };
  });

  return { positions, stages };
};
