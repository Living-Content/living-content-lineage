/**
 * Base theme tokens: layout, spacing, z-index, transitions
 */
export const baseTokens = {
  // Font families
  'font-sans':
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  'font-mono':
    "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Menlo, Consolas, monospace",

  // Layout dimensions
  'panel-margin': '25px',
  'panel-margin-mobile': '25px',
  'header-height': '48px',
  'panel-max-width': '800px',
  'logo-width': '126px',

  // Title overlay spacing
  'title-uuid-to-title': '14px',
  'title-title-to-date': '23px',
  'title-node-gap': '25px',

  // Title overlay typography
  'title-uuid-font-size': '11px',
  'title-uuid-letter-spacing': '0.5px',
  'title-main-font-size': '18px',
  'title-main-letter-spacing': '-0.3px',
  'title-date-font-size': '11px',
  'title-date-letter-spacing': '0.5px',
  'title-secondary-alpha': '0.5',

  // Breakpoints
  'mobile-breakpoint': '900px',

  // Graph edges
  'edge-width': '2px',
  'edge-dot-radius': '4px',
  'expanded-edge-gap': '100px',
  'collapsed-edge-gap': '200px',
  'workflow-edge-width': '8px',
  'workflow-dot-radius': '12px',
  'faded-node-alpha': '0.25',
  'faded-node-blur': '4',

  // Step labels (for step view)
  'step-label-font-size': '20px',
  'step-label-letter-spacing': '-0.5px',
  'step-label-top-padding': '100px',
  'step-label-line-start': '30px',
  'step-label-dot-size': '2px',
  'step-label-dot-gap': '4px',
  'phase-badge-top': '160px',

  // Node sizing
  'default-node-size': '14px',
  'claim-icon-size': '56px',
  'icon-node-size': '40px',
  'icon-node-ring-padding': '6px',
  'icon-node-ring-width': '3px',
  'selection-ring-gap': '6px',
  'selection-ring-width': '3px',
  'title-left-gap': '9px',

  // Border radius scale
  'radius-sm': '4px',
  'radius-md': '8px',
  'radius-lg': '12px',
  'radius-xl': '16px',
  'radius-full': '9999px',

  // Spacing scale
  'space-xs': '4px',
  'space-sm': '8px',
  'space-md': '12px',
  'space-lg': '16px',
  'space-xl': '20px',
  'space-2xl': '24px',
  'space-3xl': '32px',

  // Transition durations
  'duration-fast': '0.1s',
  'duration-normal': '0.2s',
  'duration-slow': '0.3s',

  // Z-index layers
  'z-base': '0',
  'z-dropdown': '100',
  'z-sticky': '200',
  'z-overlay': '300',
  'z-modal': '400',
  'z-tooltip': '500',

} as const;

export type BaseTokenName = keyof typeof baseTokens;
