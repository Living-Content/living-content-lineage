# Theming Guidelines

## Rules

1. **Component styles live in components** - all styles go in Svelte `<style>` blocks, never external CSS
2. **Use theme variables** - `var(--color-text-primary)` not `#1a1a1a`
3. **No hardcoded values** - spacing, colors, radius all come from theme tokens
4. **Scoped by default** - Svelte handles scoping automatically

## Architecture

The theme system uses TypeScript as the source of truth for CSS variables, with auto-generated CSS and compile-time type safety.

```plaintext
src/themes/
├── definitions/           # TypeScript source of truth
│   ├── index.ts          # Aggregates tokens, exports CssVar type
│   ├── base.ts           # Layout, spacing, z-index, transitions
│   ├── typography.ts     # Font sizes, weights, line heights
│   ├── colors.ts         # Semantic color palette
│   ├── phases.ts         # Workflow phase colors
│   ├── graph.ts          # Graph-specific variables
│   └── components.ts     # Component-scoped variables
├── variants/
│   └── dark.ts           # Dark theme overrides (partial)
├── generated/            # Auto-generated CSS (do not edit)
│   ├── default.css       # All variables in :root
│   ├── dark.css          # Dark overrides in [data-theme="dark"]
│   └── index.css         # Import aggregator
├── base.css              # Global resets
├── index.css             # CSS entry point
├── index.ts              # Public API
└── theme.ts              # Runtime utilities
```

## Using Theme Variables

### In Svelte Components

```svelte
<div class="panel">
  <header class="panel-header">...</header>
  <main class="panel-content">...</main>
</div>

<style>
  .panel {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
  }

  .panel-header {
    padding: var(--space-md) var(--space-lg);
  }

  .panel-content {
    padding: var(--space-lg);
  }
</style>
```

### In TypeScript

```typescript
import { getCssVar, getCssVarInt, getCssVarFloat, getCssVarColorHex, type CssVar } from '../themes';

// String value
const fontFamily = getCssVar('--font-sans');

// Parsed as integer (e.g., "48px" → 48)
const height = getCssVarInt('--header-height');

// Parsed as float (e.g., "0.25" → 0.25)
const alpha = getCssVarFloat('--faded-node-alpha');

// Parsed as hex number for Pixi.js (e.g., "rgb(255,0,0)" → 0xFF0000)
const color = getCssVarColorHex('--color-text-primary');

// Dynamic variables use type assertion
const phaseColor = getCssVar(`--phase-${phase.toLowerCase()}` as CssVar);
```

Invalid variable names cause compile-time errors:

```typescript
getCssVar('--typo-here');  // TS Error: not assignable to CssVar
```

## Adding Theme Tokens

1. Add to the appropriate definition file:

```typescript
// src/themes/definitions/base.ts
export const baseTokens = {
  'panel-margin': '25px',
  'my-new-token': '100px',  // Add here
} as const;
```

1. Regenerate CSS:

```bash
npm run theme:generate
```

1. Use in code with type safety:

```typescript
const value = getCssVarInt('--my-new-token');
```

## Dark Theme

Dark theme only overrides specific variables:

```typescript
// src/themes/variants/dark.ts
export const darkOverrides: Partial<Record<CssVarName, string>> = {
  'color-text-primary': 'rgb(245, 245, 245)',
  'color-bg-primary': 'rgb(10, 10, 10)',
  // Only include variables that change
};
```

Theme state is managed in `src/stores/themeState.ts`:

```typescript
import { themePreference, resolvedTheme, setTheme, cycleTheme } from '../stores/themeState.js';

$themePreference;  // 'light' | 'dark' | 'system'
$resolvedTheme;    // 'light' | 'dark'

setTheme('dark');
cycleTheme();  // light -> dark -> system -> light
```

## Build Process

The `theme:generate` script runs automatically before `dev` and `build`.

During development, a Vite plugin watches `src/themes/definitions/` and `src/themes/variants/` for changes and auto-regenerates CSS. Vite HMR then hot-reloads the updated styles.

## Files

- Token definitions: `src/themes/definitions/*.ts`
- Dark overrides: `src/themes/variants/dark.ts`
- Generated CSS: `src/themes/generated/*.css`
- Runtime utilities: `src/themes/theme.ts`
- Build script: `scripts/generate-theme.ts`
- State management: `src/stores/themeState.ts`
