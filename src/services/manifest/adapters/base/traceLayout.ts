import type { StepUI } from '../../../../config/types.js';
import { validatePhase } from '../../../../config/utils.js';
import type { Asset, Manifest } from './traceTypes.js';

// Initial layout spacing - actual spacing is controlled by --edge-gap CSS variable
// via repositionNodesWithGaps() which overrides these positions
const HORIZONTAL_GAP = 0.15;
const VERTICAL_GAP = 0.05;
const STEP_PADDING = 0.04;

export interface LayoutResult {
  positions: Map<string, { x: number; y: number; step: string }>;
  steps: StepUI[];
}

/**
 * Extract node group ID from asset ID.
 * Asset IDs follow pattern: "type-nodeId" (e.g., "code-abc123", "action-abc123")
 * Assets from the same workflow node share the same suffix.
 */
const getNodeGroup = (assetId: string): string => {
  const dashIdx = assetId.indexOf('-');
  return dashIdx > 0 ? assetId.slice(dashIdx + 1) : assetId;
};

/**
 * Computes layout positions for all assets.
 *
 * Layout groups assets by their workflow node (shared ID suffix):
 * - Each node group gets two columns: inputs (Code/Model/Action) and output (Result)
 * - Groups are ordered by workflow sequence (order they appear in manifest)
 * - Within a group: Action at center, Code/Model stacked below, Result to the right
 */
export const computeLayout = (manifest: Manifest): LayoutResult => {
  const positions = new Map<string, { x: number; y: number; step: string }>();

  // Group assets by their workflow node
  const nodeGroups = new Map<string, Asset[]>();
  const groupOrder: string[] = [];

  manifest.assets.forEach((asset) => {
    const group = getNodeGroup(asset.id);
    if (!nodeGroups.has(group)) {
      nodeGroups.set(group, []);
      groupOrder.push(group);
    }
    nodeGroups.get(group)!.push(asset);
  });

  // Position each node group
  let currentX = 0.1;
  let prevOutputX = 0.1; // Track where the previous output was placed

  // Collect orphan Code/Model from groups without Actions - they'll attach to next Action
  let pendingSupportingAssets: Asset[] = [];

  groupOrder.forEach((group) => {
    const assets = nodeGroups.get(group) ?? [];
    if (assets.length === 0) return;

    // Separate into: Action (connector), supporting (Code/Model), and outputs
    let actionAsset: Asset | undefined;
    const supportingAssets: Asset[] = [];
    const outputAssets: Asset[] = [];

    assets.forEach((asset) => {
      const type = asset.assetType;
      if (type === 'Action') {
        actionAsset = asset;
      } else if (type === 'Code' || type === 'Model') {
        supportingAssets.push(asset);
      } else {
        outputAssets.push(asset);
      }
    });

    // Sort supporting assets: Code first, then Model
    const typeOrder: Record<string, number> = { Code: 0, Model: 1 };
    supportingAssets.sort((a, b) => (typeOrder[a.assetType] ?? 99) - (typeOrder[b.assetType] ?? 99));

    // Position Action at currentX (on main timeline)
    if (actionAsset) {
      positions.set(actionAsset.id, {
        x: currentX,
        y: 0.5,
        step: actionAsset.step ?? 'unknown',
      });

      // Combine this group's Code/Model with any pending ones
      const allSupporting = [...pendingSupportingAssets, ...supportingAssets];
      allSupporting.sort((a, b) => (typeOrder[a.assetType] ?? 99) - (typeOrder[b.assetType] ?? 99));
      pendingSupportingAssets = [];

      // Output to the right of action
      const outputX = currentX + HORIZONTAL_GAP;

      // Code/Model go below PREVIOUS output (they feed into this action)
      // For first step (no previous output), place to the LEFT of the action at same Y
      const isFirstStep = prevOutputX === 0.1;
      const supportingX = isFirstStep ? currentX - HORIZONTAL_GAP : prevOutputX;
      allSupporting.forEach((asset, idx) => {
        positions.set(asset.id, {
          x: supportingX,
          y: isFirstStep ? 0.5 + idx * VERTICAL_GAP : 0.5 + (idx + 1) * VERTICAL_GAP,
          step: asset.step ?? 'unknown',
        });
      });

      outputAssets.forEach((asset, idx) => {
        positions.set(asset.id, {
          x: outputX,
          y: idx === 0 ? 0.5 : 0.5 + idx * VERTICAL_GAP,
          step: asset.step ?? 'unknown',
        });
      });

      prevOutputX = outputX;
      currentX = outputX + HORIZONTAL_GAP;
    } else if (outputAssets.length > 0) {
      // No action but has outputs - source/ingest step
      // Output on timeline
      outputAssets.forEach((asset, idx) => {
        positions.set(asset.id, {
          x: currentX,
          y: idx === 0 ? 0.5 : 0.5 + idx * VERTICAL_GAP,
          step: asset.step ?? 'unknown',
        });
      });

      // Any Code/Model in this group go below the output
      supportingAssets.forEach((asset, idx) => {
        positions.set(asset.id, {
          x: currentX,
          y: 0.5 + (outputAssets.length + idx) * VERTICAL_GAP,
          step: asset.step ?? 'unknown',
        });
      });

      prevOutputX = currentX;
      currentX = currentX + HORIZONTAL_GAP;
    } else if (supportingAssets.length > 0) {
      // Only Code/Model, no action, no outputs - save for next Action
      pendingSupportingAssets.push(...supportingAssets);
    }
  });

  // Any remaining pending Code/Model go under the last output
  if (pendingSupportingAssets.length > 0) {
    const typeOrder: Record<string, number> = { Code: 0, Model: 1 };
    pendingSupportingAssets.sort((a, b) => (typeOrder[a.assetType] ?? 99) - (typeOrder[b.assetType] ?? 99));
    pendingSupportingAssets.forEach((asset, idx) => {
      positions.set(asset.id, {
        x: prevOutputX,
        y: 0.5 + (idx + 1) * VERTICAL_GAP,
        step: asset.step ?? 'unknown',
      });
    });
  }

  // Place claims above their verified nodes
  manifest.claims.forEach((claim) => {
    const verifiedId = claim.verifies[0];
    const verifiedPos = verifiedId ? positions.get(verifiedId) : undefined;
    if (verifiedPos) {
      positions.set(claim.id, {
        x: verifiedPos.x,
        y: verifiedPos.y - VERTICAL_GAP,
        step: claim.step,
      });
    }
  });

  // Calculate step bounds from positioned nodes
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

  const steps: StepUI[] = manifest.steps
    .filter((step) => stepMinX.has(step.id))
    .map((step) => {
      const phase = validatePhase(step.phase, `step ${step.id}`);
      const minX = stepMinX.get(step.id) ?? 0;
      const maxX = stepMaxX.get(step.id) ?? 0;
      return {
        id: step.id,
        label: step.label,
        phase,
        xStart: minX - STEP_PADDING,
        xEnd: maxX + STEP_PADDING,
      };
    })
    .sort((a, b) => a.xStart - b.xStart);

  return { positions, steps };
};
