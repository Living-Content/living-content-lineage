# Spatial Culling System

Efficient viewport-based visibility culling using a spatial hash. Designed to handle thousands of off-screen nodes while only ~50 are visible on screen.

## Problem

PixiJS's built-in `Culler.shared.cull()` iterates through **all** objects to check if they're in the viewport. With thousands of nodes, this is O(n) per frame during pan/zoom, causing performance degradation.

## Solution

A spatial hash divides world space into fixed-size cells. Each node is stored in the cell(s) it occupies. To find visible nodes, we only check cells that overlap the viewport.

```
┌─────┬─────┬─────┬─────┐
│     │     │  •  │     │
├─────┼─────┼─────┼─────┤
│     │ ┌───────┐ │     │   • = node
├─────┼─│VIEWPORT│─┼─────┤   Only cells overlapping
│  •  │ │   •   │ │     │   the viewport are checked
├─────┼─└───────┘─┼─────┤
│     │     │  •  │     │
└─────┴─────┴─────┴─────┘
```

**Performance**:
- Total nodes: O(n) where n = thousands
- Per-frame work: O(v) where v = visible nodes (~50)

## Architecture

### spatialHash.ts

Generic spatial hash data structure.

```typescript
interface SpatialHash<T extends SpatialObject> {
  insert: (obj: T) => void;
  remove: (obj: T) => void;
  update: (obj: T) => void;  // Remove + insert with new bounds
  query: (bounds: Bounds) => Set<T>;
  clear: () => void;
}
```

**Cell size**: Default 512px. Smaller = more cells, faster queries for small viewports. Larger = fewer cells, more objects per cell.

### spatialCuller.ts

PixiJS integration layer.

```typescript
interface SpatialCuller {
  add: (node: GraphNode) => void;
  remove: (node: GraphNode) => void;
  cull: (viewportState: ViewportState, container: Container) => void;
  clear: () => void;
}
```

The `cull()` method:
1. Converts viewport bounds to world space
2. Adds 100px padding to prevent edge popping
3. Queries spatial hash for visible nodes
4. Sets `visible = true` on visible nodes
5. Sets `visible = false` on nodes that were visible but now aren't

### Integration (compose.ts)

```typescript
// Create after nodes are added to nodeMap
const spatialCuller = createSpatialCuller();
nodeMap.forEach((node) => spatialCuller.add(node));

// Called on every pan/zoom
const onViewportUpdate = (): void => {
  // ... other updates ...
  if (viewLevel.current === 'workflow-detail') {
    spatialCuller.cull(viewportState, containers.workflowDetail);
  }
};
```

Only the `workflow-detail` view uses spatial culling (it has the nodes). The card views (`workflow-overview`, `content-session`) have few objects and use PixiJS default culling.

## Dynamic Nodes

For static layouts loaded at init, no additional work is needed. If nodes are added/removed/moved dynamically:

```typescript
spatialCuller.add(newNode);      // New node
spatialCuller.remove(oldNode);   // Deleted node

// If a node moves, update its bounds in the hash
node.position.set(newX, newY);
spatialCuller.remove(node);
spatialCuller.add(node);
```

## Tuning

| Parameter | Default | Effect |
|-----------|---------|--------|
| Cell size | 512px | Smaller = more cells, faster small-viewport queries |
| Padding | 100px | Increase if nodes pop in at edges during fast pan |

## Files

- `src/services/trace/layout/spatialHash.ts` - Generic spatial hash
- `src/services/trace/layout/spatialCuller.ts` - PixiJS integration
- `src/services/trace/core/compose.ts` - Integration point
