/**
 * Renders dashed bezier connectors between workflow cards in overview mode.
 * Shows parent-child relationships between workflows.
 */
import { Graphics, Container } from 'pixi.js';
import type { Phase } from '../../../config/types.js';
import { getCssVarColorHex, type CssVar } from '../../../themes/index.js';

export interface WorkflowConnection {
  parentWorkflowId: string;
  childWorkflowId: string;
  parentX: number;
  parentY: number;
  childX: number;
  childY: number;
  phase: Phase;
}

export interface WorkflowCardConnectorRenderer {
  render: (connections: WorkflowConnection[]) => void;
  clear: () => void;
  destroy: () => void;
}

const CONNECTOR_WIDTH = 2;
const CONNECTOR_ALPHA = 0.7;
const DASH_LENGTH = 10;
const GAP_LENGTH = 6;

/**
 * Gets the phase color as a hex number for Pixi.js.
 */
const getPhaseColorHex = (phase: Phase): number => {
  const varName = `--phase-${phase.toLowerCase()}` as CssVar;
  return getCssVarColorHex(varName);
};

/**
 * Draws a dashed bezier curve between two points.
 */
const drawDashedBezier = (
  graphics: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: number
): void => {
  // Calculate bezier control points (vertical curve)
  const midY = (y1 + y2) / 2;
  const cp1x = x1;
  const cp1y = midY;
  const cp2x = x2;
  const cp2y = midY;

  // Sample points along the bezier curve
  const numSamples = 100;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const x = mt3 * x1 + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * x2;
    const y = mt3 * y1 + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * y2;
    points.push({ x, y });
  }

  // Draw dashed line along sampled points
  let accumulatedLength = 0;
  let drawing = true;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

    if (drawing) {
      if (accumulatedLength === 0) {
        graphics.moveTo(p1.x, p1.y);
      }
      graphics.lineTo(p2.x, p2.y);
    }

    accumulatedLength += segmentLength;

    const threshold = drawing ? DASH_LENGTH : GAP_LENGTH;
    if (accumulatedLength >= threshold) {
      if (drawing) {
        graphics.stroke({ width: CONNECTOR_WIDTH, color, alpha: CONNECTOR_ALPHA });
      }
      accumulatedLength = 0;
      drawing = !drawing;
    }
  }

  // Finish any remaining stroke
  if (drawing && accumulatedLength > 0) {
    graphics.stroke({ width: CONNECTOR_WIDTH, color, alpha: CONNECTOR_ALPHA });
  }
};

/**
 * Creates a connector renderer for workflow cards.
 */
export const createWorkflowCardConnectorRenderer = (
  container: Container
): WorkflowCardConnectorRenderer => {
  const graphics = new Graphics();
  container.addChild(graphics);

  const render = (connections: WorkflowConnection[]): void => {
    graphics.clear();

    for (const conn of connections) {
      const color = getPhaseColorHex(conn.phase);
      drawDashedBezier(
        graphics,
        conn.parentX,
        conn.parentY,
        conn.childX,
        conn.childY,
        color
      );
    }
  };

  const clear = (): void => {
    graphics.clear();
  };

  const destroy = (): void => {
    graphics.destroy();
  };

  return { render, clear, destroy };
};
