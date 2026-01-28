/**
 * Base theme tokens: layout, spacing, z-index, transitions
 */
export const baseTokens = {
  // Font families (IBM Plex primary, system fallbacks)
  'font-sans':
    "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  'font-mono':
    "'IBM Plex Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Menlo, Consolas, monospace",

  // Layout dimensions
  'panel-margin': '25px',
  'panel-margin-mobile': '25px',
  'header-height': '48px',
  'panel-max-width': '800px',
  'header-controls-width': '80px', // Width of header controls (menu + LOD icons + gaps)

  // Title overlay spacing (must clear header: 25px margin + 28px hamburger + 12px gap + 28px LOD + 12px gap = 105px)
  'title-content-left': '105px',
  'title-divider-gap': '12px',
  'title-line-gap': '4px',
  'title-uuid-to-title': '18px',
  'title-title-to-date': '22px',
  'title-node-gap': '25px',

  // Title overlay typography
  'title-uuid-font-size': '11px',
  'title-uuid-letter-spacing': '0.5px',
  'title-main-font-size': '32px',
  'title-main-letter-spacing': '-0.5px',
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
  'node-alpha': '0.8',
  'node-hover-alpha': '1',
  'node-faded-alpha': '0.6',
  'node-faded-blur': '4',

  // Step labels (for step view)
  'step-label-font-size': '20px',
  'step-label-letter-spacing': '-0.5px',
  'step-label-top-padding': '100px',
  'step-label-line-start': '30px',
  'step-label-dot-size': '2px',
  'step-label-dot-gap': '4px',
  'phase-badge-top': '160px',

  // Workflow connector (between parent/child workflows)
  'connector-text-size': '32px',

  // Node sizing and layout
  'node-vertical-gap': '2px',
  'default-node-size': '14px',
  'claim-icon-size': '56px',
  'icon-node-size': '40px',
  'icon-node-ring-padding': '6px',
  'icon-node-ring-width': '3px',
  'selection-ring-gap': '6px',
  'selection-ring-width': '3px',
  'title-left-gap': '9px',

  // Watermark icon (large semi-transparent icon behind node)
  'watermark-icon-scale': '2.5',
  'watermark-icon-alpha': '0.15',
  'watermark-icon-offset-x': '-0.3',

  // Border radius scale
  'radius-sm': '4px',
  'radius-md': '8px',
  'radius-lg': '12px',
  'radius-xl': '16px',
  'radius-full': '9999px',

  // Spacing scale (8px grid aligned)
  'space-xs': '4px',
  'space-sm': '8px',
  'space-md': '12px',
  'space-lg': '16px',
  'space-xl': '24px',
  'space-2xl': '32px',
  'space-3xl': '40px',
  'space-4xl': '48px',
  'space-5xl': '64px',

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

  // Overlay z-index layers (for embedded widget UI)
  'z-container': '9400',
  'z-controller': '9500',
  'z-menu': '9600',
  'z-menu-toggle': '9700',
  'z-loader': '9800',
  'z-toast': '9900',

} as const;

export type BaseTokenName = keyof typeof baseTokens;
