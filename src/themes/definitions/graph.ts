/**
 * Graph-specific theme tokens
 */
export const graphTokens = {
  // Graph canvas background
  'color-graph-bg-1': 'rgb(0, 0, 0)',
  'color-graph-bg-2': 'rgb(0, 0, 0)',
  'color-graph-bg-3': 'rgb(0, 0, 0)',

  // Edge color
  'color-edge': 'rgb(255, 255, 255)',

  // Port colors
  'color-port': 'rgb(75, 85, 99)',

  // Node base colors
  'color-node-default': 'rgb(255, 255, 255)',
  'color-node-bg': 'rgba(255, 255, 255, 1)',
  'color-node-border-default': 'rgb(77, 150, 255)',
  'color-node-icon-default': 'rgb(77, 150, 255)',
  'color-hover-ring': 'rgb(77, 150, 255)',
  'color-node-selected': 'rgb(77, 150, 255)',
  'color-selection-ring': 'rgb(255, 255, 255)',

  // Node type: Data
  'node-data-color': 'rgb(77, 150, 255)',
  'node-data-border': 'rgb(77, 150, 255)',
  'node-data-icon': 'rgb(77, 150, 255)',

  // Node type: Claim
  'node-claim-color': 'rgb(107, 203, 119)',
  'node-claim-border': 'rgb(107, 203, 119)',
  'node-claim-icon': 'rgb(107, 203, 119)',
  'claim-icon-color': 'rgb(255, 255, 255)',

  // Node type: Store
  'node-store-color': 'rgb(255, 217, 61)',
  'node-store-border': 'rgb(255, 217, 61)',
  'node-store-icon': 'rgb(255, 217, 61)',

  // Node type: Media
  'node-media-color': 'rgb(77, 150, 255)',
  'node-media-border': 'rgb(77, 150, 255)',
  'node-media-icon': 'rgb(77, 150, 255)',

  // Node type: Workflow
  'node-workflow-color': 'rgb(77, 150, 255)',
  'node-workflow-border': 'rgb(77, 150, 255)',
  'node-workflow-icon': 'rgb(77, 150, 255)',

  // Workflow title colors
  'color-title-primary': 'rgb(51, 51, 51)',
  'color-title-secondary': 'rgb(136, 136, 136)',
} as const;

export type GraphTokenName = keyof typeof graphTokens;
