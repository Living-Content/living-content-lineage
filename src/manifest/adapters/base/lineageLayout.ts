import type { Stage, WorkflowPhase } from '../../../types.js';
import type { LineageManifest } from './lineageTypes.js';
import { measureLabels } from '../../../graph/textMeasure.js';

export interface LayoutResult {
  positions: Map<string, { x: number; y: number; stage: string }>;
  stages: Stage[];
}

// Consistent spacing constants
const HORIZONTAL_GAP = 0.06; // Gap between columns
const VERTICAL_SPACING = 0.07; // Vertical gap between stacked nodes
const AUX_VERTICAL_OFFSET = 0.08; // First aux node offset from main line
const COLUMN_WIDTH = 0.12; // Base column width

export function computeLayout(manifest: LineageManifest): LayoutResult {
  const positions = new Map<string, { x: number; y: number; stage: string }>();

  const attestOffset = -0.08; // Above the node (negative Y)

  // Measure all labels to get actual pill dimensions
  const allLabels = [
    ...manifest.assets.map((a) => ({ id: a.id, label: a.label })),
    ...manifest.computations.map((c) => ({ id: c.id, label: c.label })),
  ];
  const pillDimensions = measureLabels(allLabels);

  const compSet = new Set(manifest.computations.map((comp) => comp.id));

  const assetProducer = new Map<string, string>();
  manifest.computations.forEach((comp) => {
    comp.outputs.forEach((id) => assetProducer.set(id, comp.id));
  });

  const assetTypes = new Map<string, string>();
  manifest.assets.forEach((asset) => {
    assetTypes.set(asset.id, asset.asset_type);
  });

  // Calculate column width based on widest pill in each column
  function getColumnWidth(ids: string[]): number {
    if (ids.length === 0) return 0;
    let maxWidth = COLUMN_WIDTH;
    for (const id of ids) {
      const dims = pillDimensions.get(id);
      if (dims) {
        // Convert pixel width to normalized units (approximate)
        const normalizedWidth = dims.width / 800; // Assuming ~800px reference
        maxWidth = Math.max(maxWidth, normalizedWidth + HORIZONTAL_GAP);
      }
    }
    return Math.min(maxWidth, 0.20); // Cap at 0.20
  }

  let currentX = 0.08;
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

    // Place data source inputs in a column before the computation
    if (dataSourceInputs.length > 0) {
      const totalHeight = (dataSourceInputs.length - 1) * VERTICAL_SPACING;
      const startY = 0.5 - totalHeight / 2;

      dataSourceInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: startY + idx * VERTICAL_SPACING,
          stage: comp.stage,
        });
        placedAssets.add(inputId);
      });
      currentX += getColumnWidth(dataSourceInputs);
    }

    // Place computation node at center line
    positions.set(comp.id, {
      x: currentX,
      y: 0.5,
      stage: comp.stage,
    });

    // Place auxiliary inputs below the computation (stacked vertically)
    if (auxiliaryInputs.length > 0) {
      auxiliaryInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: 0.5 + AUX_VERTICAL_OFFSET + idx * VERTICAL_SPACING,
          stage: comp.stage,
        });
        placedAssets.add(inputId);
      });
    }

    currentX += getColumnWidth([comp.id]);

    // Place outputs in a column after the computation
    const outputs = comp.outputs.filter((id) => !placedAssets.has(id));
    if (outputs.length > 0) {
      const totalHeight = (outputs.length - 1) * VERTICAL_SPACING;
      const startY = 0.5 - totalHeight / 2;

      outputs.forEach((outputId, idx) => {
        positions.set(outputId, {
          x: currentX,
          y: startY + idx * VERTICAL_SPACING,
          stage: comp.stage,
        });
        placedAssets.add(outputId);
      });
      currentX += getColumnWidth(outputs);
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
}
