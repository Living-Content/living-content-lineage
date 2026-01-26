/**
 * Typography tokens: font sizes, weights, line heights
 */
export const typographyTokens = {
  // Font size scale
  'font-size-hero': '48px',
  'font-size-display': '36px',
  'font-size-large': '32px',
  'font-size-title': '24px',
  'font-size-heading': '18px',
  'font-size-body': '14px',
  'font-size-small': '12px',
  'font-size-tiny': '10px',

  // Font weights
  'font-weight-normal': '400',
  'font-weight-medium': '500',
  'font-weight-semibold': '600',
  'font-weight-bold': '700',

  // Line heights
  'line-height-tight': '1.1',
  'line-height-snug': '1.3',
  'line-height-normal': '1.5',
  'line-height-relaxed': '1.6',
  'line-height-loose': '1.8',

  // Letter spacing
  'letter-spacing-tight': '-0.02em',
  'letter-spacing-normal': '0',
  'letter-spacing-wide': '0.02em',
  'letter-spacing-wider': '0.05em',
  'letter-spacing-caps': '0.1em',
  'letter-spacing-section': '0.15em',
} as const;

export type TypographyTokenName = keyof typeof typographyTokens;
