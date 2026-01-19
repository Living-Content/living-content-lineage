/**
 * Centralized shape geometry for graph nodes.
 * Single source of truth for pill and chevron shape calculations.
 */

export type NodeShapeType = 'pill' | 'chevron';

export interface ShapeGeometry {
  /** Draw the shape path on a canvas context */
  drawPath: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  /** Get vertices for selection ring (null = use path tracing for curves) */
  getVertices: (width: number, height: number) => Array<{ x: number; y: number }> | null;
  /** Extra width needed beyond base content width */
  getExtraWidth: (height: number) => number;
  /** Extra left offset for icon/text placement (to avoid notch) */
  getContentOffset: (height: number) => number;
}

/**
 * Pill shape: rounded rectangle with semicircle ends.
 * No extra width or content offset needed.
 */
const pillShape: ShapeGeometry = {
  drawPath(ctx, width, height) {
    const radius = height / 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
  },

  getVertices() {
    // Pill uses curved path tracing, not vertices
    return null;
  },

  getExtraWidth() {
    return 0;
  },

  getContentOffset() {
    return 0;
  },
};

/**
 * Chevron shape: arrow-like with angled edges.
 * Left side has inward notch (concave), right side has outward arrow (convex).
 *
 * Shape diagram:
 *   0,0 ─────────────────── W-D,0
 *      ╲                        ╲
 *     D,H/2                    W,H/2
 *      ╱                        ╱
 *   0,H ─────────────────── W-D,H
 *
 * D = H * 0.35 for a balanced angle (~35°)
 * Left notch tip at (D, H/2) cuts INTO shape
 * Right arrow tip at (W, H/2) extends OUT of shape
 */
const CHEVRON_DEPTH_RATIO = 0.35;

const chevronShape: ShapeGeometry = {
  drawPath(ctx, width, height) {
    const d = height * CHEVRON_DEPTH_RATIO;

    ctx.beginPath();
    // Start at top-left corner
    ctx.moveTo(0, 0);
    // Top edge to arrow start
    ctx.lineTo(width - d, 0);
    // Right arrow point (extends outward)
    ctx.lineTo(width, height / 2);
    // Arrow back to bottom-right
    ctx.lineTo(width - d, height);
    // Bottom edge to bottom-left corner
    ctx.lineTo(0, height);
    // Left notch inward (concave - cuts into shape)
    ctx.lineTo(d, height / 2);
    ctx.closePath();
  },

  getVertices(width, height) {
    const d = height * CHEVRON_DEPTH_RATIO;
    // Vertices clockwise from top-left
    return [
      { x: 0, y: 0 },               // Top-left corner
      { x: width - d, y: 0 },       // Top-right before arrow
      { x: width, y: height / 2 },  // Right arrow tip (outward)
      { x: width - d, y: height },  // Bottom-right
      { x: 0, y: height },          // Bottom-left corner
      { x: d, y: height / 2 },      // Left notch tip (inward)
    ];
  },

  getExtraWidth(height) {
    // Only the right arrow extends beyond base width
    return height * CHEVRON_DEPTH_RATIO;
  },

  getContentOffset(height) {
    // Content must shift right to avoid left notch
    return height * CHEVRON_DEPTH_RATIO;
  },
};

export const SHAPES: Record<NodeShapeType, ShapeGeometry> = {
  pill: pillShape,
  chevron: chevronShape,
};

/**
 * Get shape geometry for a given shape type.
 */
export function getShape(shapeType: NodeShapeType): ShapeGeometry {
  return SHAPES[shapeType];
}
