/**
 * Spatial culler for efficient viewport-based visibility.
 * Uses a spatial hash to quickly find visible objects instead of
 * iterating all objects (O(visible) vs O(all)).
 *
 * This replaces Culler.shared.cull() for scenarios with thousands of
 * off-screen objects but only ~50 on-screen.
 */
import type { Container } from 'pixi.js';
import { createSpatialHash, type SpatialHash, type Bounds, type SpatialObject } from './spatialHash.js';
import type { GraphNode } from '../rendering/nodeRenderer.js';
import type { ViewportState } from '../interaction/viewport.js';

interface TrackedNode extends SpatialObject {
  node: GraphNode;
}

export interface SpatialCuller {
  /** Register a node for spatial culling */
  add: (node: GraphNode) => void;
  /** Remove a node from spatial culling */
  remove: (node: GraphNode) => void;
  /** Update visibility based on current viewport - call on pan/zoom */
  cull: (viewportState: ViewportState, container: Container) => void;
  /** Clear all tracked nodes */
  clear: () => void;
}

/**
 * Creates a spatial culler for efficient viewport culling.
 *
 * @param cellSize - Spatial hash cell size in world units (default 512)
 */
export function createSpatialCuller(cellSize: number = 512): SpatialCuller {
  const hash: SpatialHash<TrackedNode> = createSpatialHash(cellSize);
  const trackedNodes = new Map<string, TrackedNode>();
  const previouslyVisible = new Set<string>();

  const add = (node: GraphNode): void => {
    const id = node.nodeData.id;
    const tracked: TrackedNode = {
      id,
      bounds: {
        x: node.position.x - node.nodeWidth / 2,
        y: node.position.y - node.nodeHeight / 2,
        width: node.nodeWidth,
        height: node.nodeHeight,
      },
      node,
    };
    trackedNodes.set(id, tracked);
    hash.insert(tracked);
  };

  const remove = (node: GraphNode): void => {
    const id = node.nodeData.id;
    const tracked = trackedNodes.get(id);
    if (tracked) {
      hash.remove(tracked);
      trackedNodes.delete(id);
      previouslyVisible.delete(id);
    }
  };

  const cull = (viewportState: ViewportState, container: Container): void => {
    // Calculate world-space viewport bounds
    // viewport position (x, y) is where world origin (0,0) appears on screen
    // so world bounds are: screen bounds transformed to world space
    const scale = container.scale.x; // Assume uniform scale
    const worldBounds: Bounds = {
      x: -viewportState.x / scale,
      y: -viewportState.y / scale,
      width: viewportState.width / scale,
      height: viewportState.height / scale,
    };

    // Add padding to prevent popping at edges
    const padding = 100;
    const paddedBounds: Bounds = {
      x: worldBounds.x - padding,
      y: worldBounds.y - padding,
      width: worldBounds.width + padding * 2,
      height: worldBounds.height + padding * 2,
    };

    // Query spatial hash for visible nodes
    const visibleNodes = hash.query(paddedBounds);
    const nowVisible = new Set<string>();

    // Make visible nodes visible
    for (const tracked of visibleNodes) {
      tracked.node.visible = true;
      tracked.node.culled = false;
      nowVisible.add(tracked.id);
    }

    // Hide nodes that were visible but now aren't
    for (const id of previouslyVisible) {
      if (!nowVisible.has(id)) {
        const tracked = trackedNodes.get(id);
        if (tracked) {
          tracked.node.visible = false;
          tracked.node.culled = true;
        }
      }
    }

    // Update tracking for next frame
    previouslyVisible.clear();
    for (const id of nowVisible) {
      previouslyVisible.add(id);
    }
  };

  const clear = (): void => {
    hash.clear();
    trackedNodes.clear();
    previouslyVisible.clear();
  };

  return { add, remove, cull, clear };
}
