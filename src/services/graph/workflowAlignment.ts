/**
 * Step column alignment across workflows.
 * Ensures nodes in the same step column align vertically.
 */
import type { GraphNode } from './rendering/nodeRenderer.js';

/**
 * Get step column positions from a workflow's nodes.
 * Returns map of step ID to center X position.
 */
export const getStepColumnPositions = (
  nodeMap: Map<string, GraphNode>
): Map<string, number> => {
  const stepBounds = new Map<string, { minX: number; maxX: number }>();

  for (const node of nodeMap.values()) {
    const step = node.nodeData.step ?? 'unknown';
    const x = node.position.x;

    const existing = stepBounds.get(step);
    if (existing) {
      existing.minX = Math.min(existing.minX, x);
      existing.maxX = Math.max(existing.maxX, x);
    } else {
      stepBounds.set(step, { minX: x, maxX: x });
    }
  }

  const positions = new Map<string, number>();
  for (const [step, bounds] of stepBounds) {
    positions.set(step, (bounds.minX + bounds.maxX) / 2);
  }

  return positions;
};

/**
 * Align a workflow's nodes to target step column positions.
 * Offsets nodes in each step to match the target center X.
 */
export const alignNodesToStepColumns = (
  nodeMap: Map<string, GraphNode>,
  targetPositions: Map<string, number>
): void => {
  // Calculate current step column centers
  const currentBounds = new Map<string, { minX: number; maxX: number }>();

  for (const node of nodeMap.values()) {
    const step = node.nodeData.step ?? 'unknown';
    const x = node.position.x;

    const existing = currentBounds.get(step);
    if (existing) {
      existing.minX = Math.min(existing.minX, x);
      existing.maxX = Math.max(existing.maxX, x);
    } else {
      currentBounds.set(step, { minX: x, maxX: x });
    }
  }

  // Calculate offsets needed per step
  const offsets = new Map<string, number>();
  for (const [step, bounds] of currentBounds) {
    const targetX = targetPositions.get(step);
    if (targetX !== undefined) {
      const currentCenterX = (bounds.minX + bounds.maxX) / 2;
      offsets.set(step, targetX - currentCenterX);
    }
  }

  // Apply offsets to nodes
  for (const node of nodeMap.values()) {
    const step = node.nodeData.step ?? 'unknown';
    const offset = offsets.get(step);
    if (offset !== undefined) {
      node.position.x += offset;
    }
  }
};

/**
 * Get all step column data from multiple workflows.
 * Finds the union of all steps and their positions.
 */
export const getMergedStepPositions = (
  nodeMaps: Map<string, GraphNode>[]
): Map<string, number> => {
  const allBounds = new Map<string, { minX: number; maxX: number }>();

  for (const nodeMap of nodeMaps) {
    for (const node of nodeMap.values()) {
      const step = node.nodeData.step ?? 'unknown';
      const x = node.position.x;

      const existing = allBounds.get(step);
      if (existing) {
        existing.minX = Math.min(existing.minX, x);
        existing.maxX = Math.max(existing.maxX, x);
      } else {
        allBounds.set(step, { minX: x, maxX: x });
      }
    }
  }

  const positions = new Map<string, number>();
  for (const [step, bounds] of allBounds) {
    positions.set(step, (bounds.minX + bounds.maxX) / 2);
  }

  return positions;
};
