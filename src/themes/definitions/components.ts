/**
 * Component-scoped theme tokens
 *
 * Note: Values starting with 'var(' are CSS variable references
 * and will be preserved as-is in the generated CSS.
 */
export const componentTokens = {
  // Icon colors
  'color-icon-default': 'rgb(26, 26, 26)',
  'color-icon-muted': 'rgb(102, 102, 102)',
  'color-icon-accent-blue': 'rgb(59, 130, 246)',
  'color-icon-accent-amber': 'rgb(245, 158, 11)',

  // Icon filters (SVG coloring via CSS filters)
  'filter-icon-blue':
    'invert(45%) sepia(67%) saturate(2000%) hue-rotate(203deg) brightness(97%) contrast(96%)',
  'filter-icon-amber':
    'invert(62%) sepia(83%) saturate(1500%) hue-rotate(16deg) brightness(97%) contrast(95%)',

  // Workflow colors
  'color-workflow-compute': 'rgb(99, 102, 241)',
  'color-workflow-data': 'rgb(26, 26, 26)',
  'color-workflow-attestation': 'rgb(34, 197, 94)',

  // Impact indicator colors
  'color-impact-minimal': 'rgb(74, 222, 128)',
  'color-impact-available': 'rgb(75, 85, 99)',
  'color-impact-unknown': 'rgb(156, 163, 175)',
  'color-impact-low': 'rgb(163, 230, 53)',
  'color-impact-moderate': 'rgb(251, 191, 36)',

  // Impact indicator filters (SVG coloring)
  'filter-impact-minimal':
    'invert(75%) sepia(50%) saturate(500%) hue-rotate(80deg) brightness(95%)',
  'filter-impact-available':
    'invert(55%) sepia(10%) saturate(700%) hue-rotate(180deg) brightness(95%)',
  'filter-impact-unknown': 'grayscale(100%) brightness(90%)',
  'filter-impact-low':
    'invert(70%) sepia(60%) saturate(600%) hue-rotate(50deg) brightness(90%)',
  'filter-impact-moderate':
    'invert(60%) sepia(70%) saturate(700%) hue-rotate(10deg) brightness(95%)',

  // Node/Badge colors
  'color-node-text': 'rgb(255, 255, 255)',
  'color-pill-bg': 'var(--color-text-muted)',

  // Detail panel metric card
  'metric-card-bg': 'var(--color-surface-subtle)',
  'metric-card-border': 'var(--color-border-soft)',
  'metric-value-color': 'var(--color-text-primary)',
  'metric-label-color': 'var(--color-text-light)',
  'metric-unit-color': 'var(--color-text-muted)',

  // Code block styling
  'code-block-bg': 'var(--color-code-bg)',
  'code-block-border': 'var(--color-border-light)',
  'code-text-color': 'var(--color-text-secondary)',
  'code-line-number-color': 'var(--color-text-faint)',

  // Collapsible sections
  'section-header-color': 'var(--color-text-secondary)',
  'section-border-color': 'var(--color-border-soft)',
} as const;

export type ComponentTokenName = keyof typeof componentTokens;
