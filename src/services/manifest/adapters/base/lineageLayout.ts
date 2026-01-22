import type { StepUI } from '../../../../config/types.js';
import { validatePhase } from '../../../../config/utils.js';
import type { Asset, Manifest } from './lineageTypes.js';

export interface LayoutResult {
  positions: Map<string, { x: number; y: number; step: string }>;
  steps: StepUI[];
}

const HORIZONTAL_GAP = 0.15;
const VERTICAL_GAP = 0.08;

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

  groupOrder.forEach((group) => {
    const assets = nodeGroups.get(group) ?? [];
    if (assets.length === 0) return;

    // Separate into input assets (Code/Model/Action) and output assets (Result/Data/etc)
    const inputAssets: Asset[] = [];
    const outputAssets: Asset[] = [];

    assets.forEach((asset) => {
      const type = asset.assetType;
      if (type === 'Code' || type === 'Model' || type === 'Action') {
        inputAssets.push(asset);
      } else {
        outputAssets.push(asset);
      }
    });

    // Sort input assets: Action first, then Code, then Model
    const typeOrder: Record<string, number> = { Action: 0, Code: 1, Model: 2 };
    inputAssets.sort((a, b) => (typeOrder[a.assetType] ?? 99) - (typeOrder[b.assetType] ?? 99));

    // Position input assets (left column of group)
    inputAssets.forEach((asset, idx) => {
      positions.set(asset.id, {
        x: currentX,
        y: idx === 0 ? 0.5 : 0.5 + idx * VERTICAL_GAP,
        step: asset.step ?? 'unknown',
      });
    });

    // Position output assets (right column of group)
    const outputX = currentX + HORIZONTAL_GAP;
    outputAssets.forEach((asset, idx) => {
      positions.set(asset.id, {
        x: outputX,
        y: idx === 0 ? 0.5 : 0.5 + idx * VERTICAL_GAP,
        step: asset.step ?? 'unknown',
      });
    });

    // Move to next group (skip past both columns)
    currentX = outputX + HORIZONTAL_GAP;
  });

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

  const padding = 0.04;
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
        xStart: minX - padding,
        xEnd: maxX + padding,
      };
    })
    .sort((a, b) => a.xStart - b.xStart);

  return { positions, steps };
};
