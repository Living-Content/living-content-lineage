import type { Workflow } from '../../../../config/types.js';
import { validatePhase } from '../../../../config/utils.js';
import type { LineageManifest } from './lineageTypes.js';

export interface LayoutResult {
  positions: Map<string, { x: number; y: number; workflowId: string }>;
  workflows: Workflow[];
}

// Initial spacing (will be adjusted after render based on actual bounds)
const HORIZONTAL_GAP = 0.2;
const VERTICAL_GAP = 0.08;

export const computeLayout = (manifest: LineageManifest): LayoutResult => {
  const positions = new Map<string, { x: number; y: number; workflowId: string }>();

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
          workflowId: comp.workflowId,
        });
        placedAssets.add(inputId);
      });
      currentX += HORIZONTAL_GAP;
    }

    // Place computation
    positions.set(comp.id, {
      x: currentX,
      y: 0.5,
      workflowId: comp.workflowId,
    });

    // Place auxiliary inputs below
    if (auxiliaryInputs.length > 0) {
      auxiliaryInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: 0.5 + VERTICAL_GAP + idx * VERTICAL_GAP,
          workflowId: comp.workflowId,
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
          workflowId: comp.workflowId,
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
        workflowId: attest.workflowId,
      });
    }
  });

  // Calculate workflow bounds from node positions
  const workflowMinX = new Map<string, number>();
  const workflowMaxX = new Map<string, number>();

  positions.forEach((pos) => {
    const wfId = pos.workflowId;
    if (!workflowMinX.has(wfId) || pos.x < workflowMinX.get(wfId)!) {
      workflowMinX.set(wfId, pos.x);
    }
    if (!workflowMaxX.has(wfId) || pos.x > workflowMaxX.get(wfId)!) {
      workflowMaxX.set(wfId, pos.x);
    }
  });

  const padding = 0.04;
  const workflows: Workflow[] = manifest.workflows.map((workflow) => {
    const phase = validatePhase(workflow.phase, `workflow ${workflow.id}`);
    const minX = workflowMinX.get(workflow.id) ?? 0;
    const maxX = workflowMaxX.get(workflow.id) ?? 0;
    return {
      id: workflow.id,
      label: workflow.label,
      phase,
      xStart: minX - padding,
      xEnd: maxX + padding,
    };
  });

  return { positions, workflows };
};
