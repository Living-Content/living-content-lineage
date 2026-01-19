# Color System

The color system uses semantic variables organized by purpose. Colors are defined in TypeScript and auto-generated to CSS.

## Phase Colors

Workflow phases have distinct accent colors for visual identification:

| Phase       | Color     | Variable                                |
| ----------- | --------- | --------------------------------------- |
| Acquisition | Red       | `--phase-acquisition: rgb(239, 45, 45)` |
| Preparation | Coral     | `--phase-preparation: rgb(255, 89, 94)` |
| Retrieval   | Yellow    | `--phase-retrieval: rgb(255, 202, 58)`  |
| Reasoning   | Green     | `--phase-reasoning: rgb(138, 201, 38)`  |
| Generation  | Blue      | `--phase-generation: rgb(25, 130, 196)` |
| Persistence | Dark Blue | `--phase-persistence: rgb(0, 84, 175)`  |

### Variants

Each phase has background and muted variants:

```css
--phase-acquisition-bg: rgba(239, 45, 45, 0.1);
--phase-acquisition-muted: rgba(239, 45, 45, 0.6);
```

## Text Colors

Hierarchical text colors from most to least prominent:

```css
--color-text-primary: #1a1a1a;   /* Headings, important text */
--color-text-secondary: #333333; /* Body text */
--color-text-muted: #666666;     /* Secondary info */
--color-text-light: #888888;     /* Labels */
--color-text-faint: #999999;     /* Disabled, hints */
--color-text-subtle: #6b7280;    /* Subtle annotations */
```

## Surface Colors

Background and panel colors:

```css
--color-bg-primary: #ffffff;   /* Main background */
--color-bg-secondary: #fafafa; /* Subtle separation */
--color-bg-tertiary: #f5f5f5;  /* Stronger separation */
--color-bg-elevated: #ffffff;  /* Elevated panels */

--color-surface: #ffffff;              /* Card background */
--color-surface-hover: #f5f5f5;        /* Hover state */
--color-surface-active: #ebebeb;       /* Active state */
--color-surface-subtle: rgba(0, 0, 0, 0.03);
```

## Border Colors

```css
--color-border: #dddddd;              /* Standard borders */
--color-border-light: rgba(0, 0, 0, 0.04);
--color-border-soft: rgba(0, 0, 0, 0.06);
--color-border-hover: rgba(0, 0, 0, 0.08);
--color-border-strong: rgba(0, 0, 0, 0.1);
--color-divider: rgba(0, 0, 0, 0.2);
```

## Status Colors

```css
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;
```

## Using Colors in TypeScript

```typescript
import { getCssVar, getCssVarColorHex, type CssVar } from '../themes';

// Get color as CSS string
const textColor = getCssVar('--color-text-primary');

// Get color as hex number (for Pixi.js)
const pixiColor = getCssVarColorHex('--color-text-primary');

// Dynamic phase colors
const phaseColor = getCssVarColorHex(`--phase-${phase.toLowerCase()}` as CssVar);
```

## Using Colors in CSS

Reference variables with fallbacks:

```css
.my-component {
  color: var(--color-text-primary, #1a1a1a);
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border-soft, rgba(0, 0, 0, 0.06));
}
```

For phase-aware components:

```css
.phase-generation {
  border-left: 3px solid var(--phase-generation);
}
```

## Files

Color definitions:

- `src/themes/definitions/colors.ts` - Semantic colors
- `src/themes/definitions/phases.ts` - Phase accent colors
- `src/themes/definitions/graph.ts` - Graph-specific colors
