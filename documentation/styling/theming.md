# Theming

The theme system uses CSS custom properties with an override mechanism for multiple theme support.

## Architecture

```
src/styles/theme/
  index.css              # Entry point, imports all modules
  base.css               # Fonts, layout, spacing
  typography.css         # Font sizes, weights
  colors.css             # Semantic color palette
  phases.css             # Workflow phase colors
  graph.css              # Graph-specific colors
  components.css         # Component-scoped variables
  overrides/
    dark.css             # Dark theme overrides
```

## How Overrides Work

1. Base variables are defined in `:root`
2. Override files use attribute selectors to override specific variables
3. The active theme is controlled by `data-theme` attribute on `<html>`

```css
/* base (colors.css) */
:root {
  --color-text-primary: #1a1a1a;
  --color-bg-primary: #ffffff;
}

/* override (dark.css) */
[data-theme="dark"] {
  --color-text-primary: #f5f5f5;
  --color-bg-primary: #0a0a0a;
}
```

## Adding a New Theme

1. Create a new file in `src/styles/theme/overrides/`:

```css
/* src/styles/theme/overrides/high-contrast.css */
[data-theme="high-contrast"] {
  --color-text-primary: #000000;
  --color-bg-primary: #ffffff;
  --color-border: #000000;
  /* Override only the variables that change */
}
```

2. Import it in `src/styles/theme/index.css`:

```css
@import './overrides/dark.css';
@import './overrides/high-contrast.css';
```

3. Add the theme option to `themeState.ts`:

```typescript
export type ThemeName = 'light' | 'dark' | 'high-contrast' | 'system';
```

## Theme State Management

Theme state is managed in `src/stores/themeState.ts`:

```typescript
import { themePreference, resolvedTheme, setTheme, cycleTheme } from '../stores/themeState.js';

// Get current preference
$themePreference  // 'light' | 'dark' | 'system'

// Get resolved theme (what's actually applied)
$resolvedTheme    // 'light' | 'dark'

// Set theme
setTheme('dark');

// Cycle through themes
cycleTheme();     // light -> dark -> system -> light
```

## ThemeToggle Component

The `ThemeToggle` component provides a UI for switching themes:

```svelte
<script>
  import ThemeToggle from './components/ThemeToggle.svelte';
</script>

<ThemeToggle />
```

Features:
- Persists preference to localStorage
- Respects system preference when set to 'system'
- Listens for system theme changes

## Initializing Themes

Theme initialization happens in `ThemeToggle.svelte` via `initializeTheme()`:

1. Reads stored preference from localStorage
2. Resolves 'system' to actual system preference
3. Applies theme to `document.documentElement`
4. Sets up listener for system preference changes

## Writing Theme-Aware CSS

Always use CSS variables with fallbacks:

```css
.my-component {
  color: var(--color-text-primary, #1a1a1a);
  background: var(--color-bg-primary, #ffffff);
}
```

For components that need special dark mode handling:

```css
.my-component {
  background: var(--color-surface);
}

/* If the variable doesn't auto-adapt, add explicit override */
[data-theme="dark"] .my-component {
  box-shadow: var(--shadow-lg);
}
```

## Files

- Theme modules: `src/styles/theme/*.css`
- Theme overrides: `src/styles/theme/overrides/*.css`
- State management: `src/stores/themeState.ts`
- UI component: `src/components/ThemeToggle.svelte`
