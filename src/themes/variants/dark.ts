/**
 * Dark theme variant - partial overrides only
 * Applied when [data-theme="dark"] is set on the document root.
 */
import type { CssVarName } from '../types.generated.js';

export const darkOverrides: Partial<Record<CssVarName, string>> = {
  // Text colors - inverted for dark backgrounds
  'color-text-primary': 'rgb(245, 245, 245)',
  'color-text-secondary': 'rgb(224, 224, 224)',
  'color-text-muted': 'rgb(160, 160, 160)',
  'color-text-light': 'rgb(128, 128, 128)',
  'color-text-faint': 'rgb(96, 96, 96)',
  'color-text-subtle': 'rgb(156, 163, 175)',

  // Background colors
  'color-bg-primary': 'rgb(10, 10, 10)',
  'color-bg-secondary': 'rgb(18, 18, 18)',
  'color-bg-tertiary': 'rgb(26, 26, 26)',
  'color-bg-elevated': 'rgb(30, 30, 30)',

  // Surface colors
  'color-surface': 'rgb(20, 20, 20)',
  'color-surface-hover': 'rgb(31, 31, 31)',
  'color-surface-active': 'rgb(42, 42, 42)',
  'color-surface-subtle': 'rgba(255, 255, 255, 0.03)',

  // Border colors
  'color-border': 'rgb(51, 51, 51)',
  'color-border-light': 'rgba(255, 255, 255, 0.04)',
  'color-border-soft': 'rgba(255, 255, 255, 0.06)',
  'color-border-hover': 'rgba(255, 255, 255, 0.1)',
  'color-border-strong': 'rgba(255, 255, 255, 0.15)',
  'color-divider': 'rgba(255, 255, 255, 0.2)',

  // Overlay colors
  'color-overlay': 'rgba(0, 0, 0, 0.5)',
  'color-overlay-strong': 'rgba(0, 0, 0, 0.75)',
  'color-overlay-soft': 'rgba(0, 0, 0, 0.6)',
  'color-overlay-border': 'rgba(0, 0, 0, 0.5)',
  'color-overlay-border-strong': 'rgba(0, 0, 0, 0.8)',

  // Code block colors
  'color-code-bg': 'rgba(255, 255, 255, 0.05)',
  'color-code-inline-bg': 'rgba(255, 255, 255, 0.08)',

  // Shadows - darker and more subtle
  'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
  'shadow-md': '0 1px 3px rgba(0, 0, 0, 0.4)',
  'shadow-lg': '0 4px 20px rgba(0, 0, 0, 0.4)',
  'shadow-xl': '0 8px 30px rgba(0, 0, 0, 0.5)',

  // Accent colors - slightly brighter for visibility
  'color-link': 'rgb(96, 165, 250)',
  'color-link-hover': 'rgb(147, 197, 253)',

  // Icon colors
  'color-icon-default': 'rgb(245, 245, 245)',
  'color-icon-muted': 'rgb(160, 160, 160)',

  // Node colors - brighter on dark
  'color-node-bg': 'rgba(30, 30, 30, 0.9)',
  'color-node-default': 'rgb(30, 30, 30)',
  'color-selection-ring': 'rgb(255, 255, 255)',

  // Title colors
  'color-title-primary': 'rgb(240, 240, 240)',
  'color-title-secondary': 'rgb(160, 160, 160)',

  // Component overrides
  'metric-card-bg': 'rgba(255, 255, 255, 0.03)',
  'metric-card-border': 'rgba(255, 255, 255, 0.08)',
  'code-block-bg': 'rgba(255, 255, 255, 0.03)',
  'code-block-border': 'rgba(255, 255, 255, 0.06)',
  'code-text-color': 'rgb(224, 224, 224)',
  'code-line-number-color': 'rgb(96, 96, 96)',
};
