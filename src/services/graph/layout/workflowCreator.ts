/**
 * Step bounds calculation and node position utilities.
 */
import type { StepUI } from '../../../config/types.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';

/**
 * Recalculates step bounds based on the positioned nodes within each step.
 */
export const recalculateStepBounds = (
  steps: StepUI[],
  nodeMap: Map<string, GraphNode>,
  graphScale: number
): void => {
  const stepPadding = 0.04 * graphScale;

  for (const step of steps) {
    let minX = Infinity;
    let maxX = -Infinity;

    nodeMap.forEach((node) => {
      if (node.nodeData.step === step.id) {
        const halfW = node.nodeWidth / 2;
        minX = Math.min(minX, node.position.x - halfW);
        maxX = Math.max(maxX, node.position.x + halfW);
      }
    });

    if (minX !== Infinity) {
      step.xStart = (minX - stepPadding) / graphScale + 0.5;
      step.xEnd = (maxX + stepPadding) / graphScale + 0.5;
    }
  }
};

/**
 * Calculates info about the topmost node for step label positioning.
 */
export const calculateTopNodeInfo = (
  nodeMap: Map<string, GraphNode>
): { worldY: number; halfHeight: number } | null => {
  let minWorldY = Infinity;
  let halfHeight = 0;

  nodeMap.forEach((node) => {
    if (node.position.y < minWorldY) {
      minWorldY = node.position.y;
      halfHeight = node.nodeHeight / 2;
    }
  });

  return minWorldY === Infinity ? null : { worldY: minWorldY, halfHeight };
};

/**
 * Calculates info about the bottommost node for viewport bounds.
 */
export const calculateBottomNodeInfo = (
  nodeMap: Map<string, GraphNode>
): { worldY: number; halfHeight: number } | null => {
  let maxWorldY = -Infinity;
  let halfHeight = 0;

  nodeMap.forEach((node) => {
    if (node.position.y > maxWorldY) {
      maxWorldY = node.position.y;
      halfHeight = node.nodeHeight / 2;
    }
  });

  return maxWorldY === -Infinity ? null : { worldY: maxWorldY, halfHeight };
};
