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
 * Actions drive the layout - they have inputs and outputs that determine flow.
 */
export const computeLayout = (
  manifest: Manifest,
  assetManifests: Map<string, AssetManifest>
): LayoutResult => {
  const positions = new Map<string, { x: number; y: number; step: string }>();

  // Build maps for asset types and Action inputs/outputs
  const assetTypes = new Map<string, string>();
  const actionInputs = new Map<string, string[]>();
  const actionOutputs = new Map<string, string[]>();
  const actionSteps = new Map<string, string>();

  manifest.assets.forEach((asset) => {
    assetTypes.set(asset.id, asset.asset_type);
    if (asset.asset_type === 'Action') {
      const actionManifest = assetManifests.get(asset.id);
      actionInputs.set(asset.id, actionManifest?.inputs ?? []);
      actionOutputs.set(asset.id, actionManifest?.outputs ?? []);
      actionSteps.set(asset.id, asset.step ?? 'unknown');
    }
  });

  // Build a set of Action IDs
  const actionSet = new Set(actionInputs.keys());

  // Track which assets are produced by Actions
  const assetProducer = new Map<string, string>();
  actionOutputs.forEach((outputs, actionId) => {
    outputs.forEach((outputId) => assetProducer.set(outputId, actionId));
  });

  let currentX = 0.1;
  const placedAssets = new Set<string>();

  // Process Actions in order (they maintain the step order from manifest)
  const orderedActions = manifest.assets.filter((a) => a.asset_type === 'Action');

  orderedActions.forEach((action) => {
    const inputs = actionInputs.get(action.id) ?? [];
    const outputs = actionOutputs.get(action.id) ?? [];
    const step = actionSteps.get(action.id) ?? 'unknown';

    // Filter inputs that aren't Actions
    const dataInputs = inputs.filter((id) => !actionSet.has(id));

    // Source inputs: not produced by other Actions and not yet placed
    const sourceInputs = dataInputs.filter(
      (id) => !assetProducer.has(id) && !placedAssets.has(id)
    );

    // Auxiliary inputs (Models, Code) stack below the Action
    const auxiliaryInputs = sourceInputs.filter((id) => {
      const type = assetTypes.get(id);
      return type === 'Code' || type === 'Model';
    });

    // Data source inputs (Documents, etc.)
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
          step,
        });
        placedAssets.add(inputId);
      });
      currentX += HORIZONTAL_GAP;
    }

    // Place the Action
    positions.set(action.id, {
      x: currentX,
      y: 0.5,
      step,
    });

    // Place auxiliary inputs to the LEFT of the Action (fan-in pattern)
    if (auxiliaryInputs.length > 0) {
      const inputX = currentX - HORIZONTAL_GAP;
      const startY = 0.5 + VERTICAL_GAP;

      auxiliaryInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: inputX,
          y: startY + idx * VERTICAL_GAP,
          step,
        });
        placedAssets.add(inputId);
      });
    }

    currentX += HORIZONTAL_GAP;

    // Place outputs
    const unplacedOutputs = outputs.filter((id) => !placedAssets.has(id));
    if (unplacedOutputs.length > 0) {
      const totalHeight = (unplacedOutputs.length - 1) * VERTICAL_GAP;
      const startY = 0.5 - totalHeight / 2;

      unplacedOutputs.forEach((outputId, idx) => {
        positions.set(outputId, {
          x: currentX,
          y: startY + idx * VERTICAL_GAP,
          step,
        });
        placedAssets.add(outputId);
      });
      currentX += HORIZONTAL_GAP;
    }
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
