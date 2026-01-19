/**
 * Semantic color palette tokens
 */
export const colorTokens = {
  // Base colors
  'color-white': 'rgb(255, 255, 255)',
  'color-black': 'rgb(0, 0, 0)',

  // Text colors (prominence hierarchy)
  'color-text-primary': 'rgb(26, 26, 26)',
  'color-text-secondary': 'rgb(51, 51, 51)',
  'color-text-muted': 'rgb(102, 102, 102)',
  'color-text-light': 'rgb(136, 136, 136)',
  'color-text-faint': 'rgb(153, 153, 153)',
  'color-text-subtle': 'rgb(107, 114, 128)',

  // Background colors
  'color-bg-primary': 'rgb(255, 255, 255)',
  'color-bg-secondary': 'rgb(250, 250, 250)',
  'color-bg-tertiary': 'rgb(245, 245, 245)',
  'color-bg-elevated': 'rgb(255, 255, 255)',

  // Surface colors (for cards, panels)
  'color-surface': 'rgb(255, 255, 255)',
  'color-surface-hover': 'rgb(245, 245, 245)',
  'color-surface-active': 'rgb(235, 235, 235)',
  'color-surface-subtle': 'rgba(0, 0, 0, 0.03)',

  // Border colors
  'color-border': 'rgb(221, 221, 221)',
  'color-border-light': 'rgba(0, 0, 0, 0.04)',
  'color-border-soft': 'rgba(0, 0, 0, 0.06)',
  'color-border-hover': 'rgba(0, 0, 0, 0.08)',
  'color-border-strong': 'rgba(0, 0, 0, 0.1)',
  'color-divider': 'rgba(0, 0, 0, 0.2)',

  // Overlay colors
  'color-overlay': 'rgba(255, 255, 255, 0.5)',
  'color-overlay-strong': 'rgba(255, 255, 255, 0.75)',
  'color-overlay-soft': 'rgba(255, 255, 255, 0.6)',
  'color-overlay-border': 'rgba(255, 255, 255, 0.5)',
  'color-overlay-border-strong': 'rgba(255, 255, 255, 0.8)',

  // Code block colors
  'color-code-bg': 'rgba(0, 0, 0, 0.04)',
  'color-code-inline-bg': 'rgba(0, 0, 0, 0.05)',

  // Shadows
  'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
  'shadow-md': '0 1px 3px rgba(0, 0, 0, 0.1)',
  'shadow-lg': '0 4px 20px rgba(0, 0, 0, 0.08)',
  'shadow-xl': '0 8px 30px rgba(0, 0, 0, 0.12)',

  // Accent colors
  'color-link': 'rgb(37, 99, 235)',
  'color-link-hover': 'rgb(29, 78, 216)',

  // Status colors
  'color-success': 'rgb(34, 197, 94)',
  'color-warning': 'rgb(245, 158, 11)',
  'color-error': 'rgb(239, 68, 68)',
  'color-info': 'rgb(59, 130, 246)',
} as const;

export type ColorTokenName = keyof typeof colorTokens;
