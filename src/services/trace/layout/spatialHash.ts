/**
 * Spatial hash for efficient viewport culling.
 * Divides world space into cells, enabling O(1) lookup of objects in a region.
 *
 * For thousands of off-screen objects with ~50 on-screen, this is much faster
 * than iterating all objects to check bounds (which is what Culler.shared.cull does).
 */

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialObject {
  id: string;
  bounds: Bounds;
}

export interface SpatialHash<T extends SpatialObject> {
  insert: (obj: T) => void;
  remove: (obj: T) => void;
  update: (obj: T) => void;
  query: (bounds: Bounds) => Set<T>;
  clear: () => void;
}

/**
 * Creates a spatial hash with the given cell size.
 * Smaller cells = more memory, faster queries for small viewports.
 * Larger cells = less memory, slower queries but better for large viewports.
 *
 * @param cellSize - Size of each cell in world units (default 256)
 */
export function createSpatialHash<T extends SpatialObject>(cellSize: number = 256): SpatialHash<T> {
  // Map from cell key to set of objects in that cell
  const cells = new Map<string, Set<T>>();
  // Map from object id to the cells it occupies (for fast removal)
  const objectCells = new Map<string, Set<string>>();

  const getCellKey = (cellX: number, cellY: number): string => `${cellX},${cellY}`;

  const getCellsForBounds = (bounds: Bounds): string[] => {
    const keys: string[] = [];
    const minCellX = Math.floor(bounds.x / cellSize);
    const maxCellX = Math.floor((bounds.x + bounds.width) / cellSize);
    const minCellY = Math.floor(bounds.y / cellSize);
    const maxCellY = Math.floor((bounds.y + bounds.height) / cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        keys.push(getCellKey(cx, cy));
      }
    }
    return keys;
  };

  const insert = (obj: T): void => {
    const cellKeys = getCellsForBounds(obj.bounds);
    const objCellSet = new Set<string>();

    for (const key of cellKeys) {
      let cell = cells.get(key);
      if (!cell) {
        cell = new Set();
        cells.set(key, cell);
      }
      cell.add(obj);
      objCellSet.add(key);
    }

    objectCells.set(obj.id, objCellSet);
  };

  const remove = (obj: T): void => {
    const objCellSet = objectCells.get(obj.id);
    if (!objCellSet) return;

    for (const key of objCellSet) {
      const cell = cells.get(key);
      if (cell) {
        cell.delete(obj);
        if (cell.size === 0) {
          cells.delete(key);
        }
      }
    }

    objectCells.delete(obj.id);
  };

  const update = (obj: T): void => {
    remove(obj);
    insert(obj);
  };

  const query = (bounds: Bounds): Set<T> => {
    const result = new Set<T>();
    const cellKeys = getCellsForBounds(bounds);

    for (const key of cellKeys) {
      const cell = cells.get(key);
      if (cell) {
        for (const obj of cell) {
          result.add(obj);
        }
      }
    }

    return result;
  };

  const clear = (): void => {
    cells.clear();
    objectCells.clear();
  };

  return { insert, remove, update, query, clear };
}
