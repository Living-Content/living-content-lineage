/**
 * Renders dashed orthogonal connectors between workflow cards in overview mode.
 * Uses A* pathfinding to route around card obstacles.
 */
import { Graphics, Container } from 'pixi.js';
import type { Phase } from '../../../../config/types.js';
import { getCssVarColorHex } from '../../../../themes/theme.js';
import type { CssVar } from '../../../../themes/types.generated.js';
import { CONNECTOR_WIDTH, CONNECTOR_ALPHA } from '../../../../config/edges.js';

export interface WorkflowConnection {
  parentWorkflowId: string;
  childWorkflowId: string;
  parentX: number;
  parentY: number;
  childX: number;
  childY: number;
  phase: Phase;
}

export interface CardObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

const GRID_SIZE = 20; // Grid cell size for pathfinding
const OBSTACLE_PADDING = 10; // Padding around cards

export interface WorkflowCardConnectorRenderer {
  render: (connections: WorkflowConnection[], obstacles: CardObstacle[]) => void;
  clear: () => void;
  destroy: () => void;
}

/**
 * Gets the phase color as a hex number for Pixi.js.
 */
const getPhaseColorHex = (phase: Phase): number => {
  const varName = `--phase-${phase.toLowerCase()}` as CssVar;
  return getCssVarColorHex(varName);
};

const CORNER_RADIUS = 12;

// A* Node for pathfinding
interface AStarNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost
  parent: AStarNode | null;
}

/**
 * Check if a point is inside any obstacle (with padding).
 */
const isBlocked = (
  x: number,
  y: number,
  obstacles: CardObstacle[],
  excludeIds: string[]
): boolean => {
  for (const obs of obstacles) {
    if (excludeIds.includes(obs.id)) continue;
    const left = obs.x - OBSTACLE_PADDING;
    const right = obs.x + obs.width + OBSTACLE_PADDING;
    const top = obs.y - OBSTACLE_PADDING;
    const bottom = obs.y + obs.height + OBSTACLE_PADDING;
    if (x >= left && x <= right && y >= top && y <= bottom) {
      return true;
    }
  }
  return false;
};

/**
 * A* pathfinding for orthogonal paths.
 */
const findPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  obstacles: CardObstacle[],
  excludeIds: string[]
): { x: number; y: number }[] => {
  // Snap to grid
  const toGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;
  const sx = toGrid(startX);
  const sy = toGrid(startY);
  const ex = toGrid(endX);
  const ey = toGrid(endY);

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  const heuristic = (x: number, y: number) => Math.abs(x - ex) + Math.abs(y - ey);

  const startNode: AStarNode = { x: sx, y: sy, g: 0, h: heuristic(sx, sy), f: heuristic(sx, sy), parent: null };
  openSet.push(startNode);

  // Direction preferences: down, horizontal, up (prefer going down first)
  const directions = [
    { dx: 0, dy: GRID_SIZE },   // down
    { dx: GRID_SIZE, dy: 0 },   // right
    { dx: -GRID_SIZE, dy: 0 },  // left
    { dx: 0, dy: -GRID_SIZE },  // up
  ];

  let iterations = 0;
  const maxIterations = 2000;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest f
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = key(current.x, current.y);

    if (current.x === ex && current.y === ey) {
      // Reconstruct grid-aligned path
      const gridPath: { x: number; y: number }[] = [];
      let node: AStarNode | null = current;
      while (node) {
        gridPath.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }

      // Find where the path first goes horizontal (changes X)
      let firstHorizontalY = gridPath.length > 0 ? gridPath[gridPath.length - 1].y : endY;
      for (let i = 1; i < gridPath.length; i++) {
        if (gridPath[i].x !== gridPath[i - 1].x) {
          firstHorizontalY = gridPath[i - 1].y;
          break;
        }
      }

      // Find where the path last goes horizontal before the end
      let lastHorizontalY = gridPath.length > 0 ? gridPath[gridPath.length - 1].y : endY;
      for (let i = gridPath.length - 1; i > 0; i--) {
        if (gridPath[i].x !== gridPath[i - 1].x) {
          lastHorizontalY = gridPath[i].y;
          break;
        }
      }

      // Build clean orthogonal path:
      // 1. Go straight down from parent card
      // 2. Go horizontal to align with child card
      // 3. Go straight into child card
      const finalPath: { x: number; y: number }[] = [];

      finalPath.push({ x: startX, y: startY });
      finalPath.push({ x: startX, y: lastHorizontalY });
      finalPath.push({ x: endX, y: lastHorizontalY });
      finalPath.push({ x: endX, y: endY });

      return finalPath;
    }

    closedSet.add(currentKey);

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nkey = key(nx, ny);

      if (closedSet.has(nkey)) continue;
      if (isBlocked(nx, ny, obstacles, excludeIds)) continue;

      const g = current.g + GRID_SIZE;
      const h = heuristic(nx, ny);
      const f = g + h;

      const existing = openSet.find(n => n.x === nx && n.y === ny);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        openSet.push({ x: nx, y: ny, g, h, f, parent: current });
      }
    }
  }

  // Fallback: orthogonal path if no A* path found
  // Go vertically first, then horizontally, then vertically to end
  const midY = (startY + endY) / 2;
  return [
    { x: startX, y: startY },
    { x: startX, y: midY },
    { x: endX, y: midY },
    { x: endX, y: endY },
  ];
};

/**
 * Simplify path by removing collinear points.
 */
const simplifyPath = (path: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (path.length <= 2) return path;

  const result: { x: number; y: number }[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = path[i];
    const next = path[i + 1];

    // Check if direction changes
    const dx1 = Math.sign(curr.x - prev.x);
    const dy1 = Math.sign(curr.y - prev.y);
    const dx2 = Math.sign(next.x - curr.x);
    const dy2 = Math.sign(next.y - curr.y);

    if (dx1 !== dx2 || dy1 !== dy2) {
      result.push(curr);
    }
  }

  result.push(path[path.length - 1]);
  return result;
};

/**
 * Add rounded corners to a path (except first and last corners, for clean card exit/entry).
 */
const addRoundedCorners = (
  path: { x: number; y: number }[],
  radius: number
): { x: number; y: number }[] => {
  if (path.length <= 2) return path;

  const result: { x: number; y: number }[] = [path[0]];

  // Skip rounding on first corner (i=1) and last corner (i=path.length-2)
  // so connector exits/enters cards straight
  for (let i = 1; i < path.length - 1; i++) {
    const isFirstCorner = i === 1;
    const isLastCorner = i === path.length - 2;

    // Don't round first or last corners
    if (isFirstCorner || isLastCorner) {
      result.push(path[i]);
      continue;
    }

    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    // Calculate directions
    const d1x = Math.sign(curr.x - prev.x);
    const d1y = Math.sign(curr.y - prev.y);
    const d2x = Math.sign(next.x - curr.x);
    const d2y = Math.sign(next.y - curr.y);

    // Distance to prev and next corners
    const distPrev = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
    const distNext = Math.sqrt(Math.pow(next.x - curr.x, 2) + Math.pow(next.y - curr.y, 2));
    const r = Math.min(radius, distPrev / 2, distNext / 2);

    if (r < 2) {
      result.push(curr);
      continue;
    }

    // Point before corner
    const beforeX = curr.x - d1x * r;
    const beforeY = curr.y - d1y * r;
    result.push({ x: beforeX, y: beforeY });

    // Arc points
    const steps = 6;
    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      // Quadratic bezier for smooth corner
      const x = (1 - t) * (1 - t) * beforeX + 2 * (1 - t) * t * curr.x + t * t * (curr.x + d2x * r);
      const y = (1 - t) * (1 - t) * beforeY + 2 * (1 - t) * t * curr.y + t * t * (curr.y + d2y * r);
      result.push({ x, y });
    }
  }

  result.push(path[path.length - 1]);
  return result;
};

/**
 * Draw a solid path through all points.
 */
const drawPath = (
  graphics: Graphics,
  points: { x: number; y: number }[],
  color: number
): void => {
  if (points.length < 2) return;

  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.stroke({ width: CONNECTOR_WIDTH, color, alpha: CONNECTOR_ALPHA });
};

/**
 * Creates a connector renderer for workflow cards.
 */
export const createWorkflowCardConnectorRenderer = (
  container: Container
): WorkflowCardConnectorRenderer => {
  const graphics = new Graphics();
  container.addChild(graphics);

  const render = (connections: WorkflowConnection[], obstacles: CardObstacle[]): void => {
    graphics.clear();

    for (const conn of connections) {
      const color = getPhaseColorHex(conn.phase);

      // Exclude parent and child cards from obstacles for this connection
      const excludeIds = [conn.parentWorkflowId, conn.childWorkflowId];

      // Find path using A*
      const rawPath = findPath(
        conn.parentX,
        conn.parentY,
        conn.childX,
        conn.childY,
        obstacles,
        excludeIds
      );

      // Simplify and add rounded corners
      const simplified = simplifyPath(rawPath);
      const rounded = addRoundedCorners(simplified, CORNER_RADIUS);

      // Draw the path
      drawPath(graphics, rounded, color);
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
