import type { Stage } from '../../../types.js';
import type { LineageManifest } from './lineageTypes.js';

export interface LayoutResult {
  positions: Map<string, { x: number; y: number; stage: string }>;
  stages: Stage[];
}

export function computeLayout(manifest: LineageManifest): LayoutResult {
  const positions = new Map<string, { x: number; y: number; stage: string }>();

  const nodeSpacingX = 0.08;
  const nodeSpacingY = 0.06;
  const attestOffset = 0.1;

  const compSet = new Set(manifest.computations.map((comp) => comp.id));

  const assetProducer = new Map<string, string>();
  manifest.computations.forEach((comp) => {
    comp.outputs.forEach((id) => assetProducer.set(id, comp.id));
  });

  const assetTypes = new Map<string, string>();
  manifest.assets.forEach((asset) => {
    assetTypes.set(asset.id, asset.asset_type);
  });

  let currentX = 0.05;
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

    if (dataSourceInputs.length > 0) {
      const totalHeight = (dataSourceInputs.length - 1) * nodeSpacingY;
      const startY = 0.5 - totalHeight / 2;

      dataSourceInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: startY + idx * nodeSpacingY,
          stage: comp.stage,
        });
        placedAssets.add(inputId);
      });
      currentX += nodeSpacingX;
    }

    if (auxiliaryInputs.length > 0) {
      const auxSpacing = 0.04;
      auxiliaryInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: 0.5 - 0.05 - idx * auxSpacing,
          stage: comp.stage,
        });
        placedAssets.add(inputId);
      });
    }

    positions.set(comp.id, {
      x: currentX,
      y: 0.5,
      stage: comp.stage,
    });
    currentX += nodeSpacingX;

    const outputs = comp.outputs.filter((id) => !placedAssets.has(id));
    if (outputs.length > 0) {
      const totalHeight = (outputs.length - 1) * nodeSpacingY;
      const startY = 0.5 - totalHeight / 2;

      outputs.forEach((outputId, idx) => {
        positions.set(outputId, {
          x: currentX,
          y: startY + idx * nodeSpacingY,
          stage: comp.stage,
        });
        placedAssets.add(outputId);
      });
      currentX += nodeSpacingX;
    }
  });

  manifest.attestations.forEach((attest) => {
    const verifiedId = attest.verifies[0];
    const verifiedPos = verifiedId ? positions.get(verifiedId) : undefined;
    if (verifiedPos) {
      positions.set(attest.id, {
        x: verifiedPos.x,
        y: verifiedPos.y + attestOffset,
        stage: attest.stage,
      });
    }
  });

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

  const padding = nodeSpacingX / 2;
  const stages: Stage[] = manifest.stages.map((stage) => {
    const minX = stageMinX.get(stage.id) ?? 0;
    const maxX = stageMaxX.get(stage.id) ?? 0;
    return {
      id: stage.id,
      label: stage.label,
      xStart: minX - padding,
      xEnd: maxX + padding,
    };
  });

  return { positions, stages };
}
