/**
 * Text measurement utilities for pill node layout.
 * Uses canvas to accurately measure text width for positioning.
 */

const PILL_FONT = '500 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const PILL_PADDING_X = 48;
const PILL_HEIGHT = 80;

export interface LabelDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Measures all labels and returns their pill dimensions.
 * Used for layout calculations before rendering.
 */
export function measureLabels(
  labels: Array<{ id: string; label: string }>
): Map<string, LabelDimensions> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = PILL_FONT;

  const measurements = new Map<string, LabelDimensions>();

  for (const { id, label } of labels) {
    const textWidth = Math.ceil(ctx.measureText(label).width);
    const width = textWidth + PILL_PADDING_X * 2;
    measurements.set(id, {
      width,
      height: PILL_HEIGHT,
      aspectRatio: width / PILL_HEIGHT,
    });
  }

  return measurements;
}
