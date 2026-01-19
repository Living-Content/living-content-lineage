/**
 * Workflow phase color tokens
 */
export const phaseTokens = {
  // Phase accent colors (vibrant)
  'phase-acquisition': 'rgb(239, 45, 45)',
  'phase-preparation': 'rgb(255, 89, 94)',
  'phase-retrieval': 'rgb(255, 202, 58)',
  'phase-reasoning': 'rgb(138, 201, 38)',
  'phase-generation': 'rgb(25, 130, 196)',
  'phase-persistence': 'rgb(0, 84, 175)',

  // Phase background colors (10% opacity)
  'phase-acquisition-bg': 'rgba(239, 45, 45, 0.1)',
  'phase-preparation-bg': 'rgba(255, 89, 94, 0.1)',
  'phase-retrieval-bg': 'rgba(255, 202, 58, 0.1)',
  'phase-reasoning-bg': 'rgba(138, 201, 38, 0.1)',
  'phase-generation-bg': 'rgba(25, 130, 196, 0.1)',
  'phase-persistence-bg': 'rgba(0, 84, 175, 0.1)',

  // Phase muted colors (60% opacity)
  'phase-acquisition-muted': 'rgba(239, 45, 45, 0.6)',
  'phase-preparation-muted': 'rgba(255, 89, 94, 0.6)',
  'phase-retrieval-muted': 'rgba(255, 202, 58, 0.6)',
  'phase-reasoning-muted': 'rgba(138, 201, 38, 0.6)',
  'phase-generation-muted': 'rgba(25, 130, 196, 0.6)',
  'phase-persistence-muted': 'rgba(0, 84, 175, 0.6)',

  // Phase text colors
  'phase-text-light': 'rgb(255, 255, 255)',
  'phase-text-dark': 'rgb(26, 26, 26)',
} as const;

export type PhaseTokenName = keyof typeof phaseTokens;
