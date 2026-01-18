# CSS Guidelines

## Architecture

### Theme (`src/styles/theme/`)
All design tokens: colors, spacing, typography, radius, shadows.
These are CSS custom properties (variables).

### Base (`src/styles/base.css`)
Global resets only: html, body, *, ::before, ::after.
No component classes.

### Component Styles (Svelte `<style>` blocks)
ALL component-specific classes go in the component file.
Svelte scopes these automatically.

## Rules

1. **Component styles live in components** - never in external CSS files
2. **Use theme variables** - `var(--color-text-primary)` not `#1a1a1a`
3. **No hardcoded values** - spacing, colors, radius all come from theme
4. **Scoped by default** - Svelte handles scoping, trust it

## Correct Example

```svelte
<div class="panel">
  <header class="panel-header">...</header>
  <main class="panel-content">...</main>
  <footer class="panel-footer">...</footer>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
  }

  .panel-header {
    padding: var(--space-md) var(--space-lg);
    flex-shrink: 0;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
  }

  .panel-footer {
    flex-shrink: 0;
    padding: var(--space-md) var(--space-lg);
    background: var(--color-surface);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    box-shadow: var(--shadow-up-md);
  }
</style>
```

## Wrong Example

```css
/* DON'T: external file with component classes */
/* src/styles/panel.css */
.panel { ... }
.panel-header { ... }
```

## File Structure

```
src/styles/
├── theme/          ← Theme variables only
│   ├── index.css
│   ├── base.css
│   ├── colors.css
│   ├── typography.css
│   └── ...
├── index.css       ← Imports theme + base only
└── base.css        ← Global resets, html/body styles only

src/components/
├── Header.svelte           ← Contains its own <style>
├── sidebar/
│   ├── InfoPanel.svelte    ← Contains its own <style>
│   ├── DetailView.svelte   ← Contains its own <style>
│   └── ...
└── ...
```

## Migration Notes

When moving styles from external CSS to Svelte components:

1. Copy the relevant CSS rules to the component's `<style>` block
2. Remove any selectors that targeted parent/ancestor elements (Svelte scopes to component)
3. Replace hardcoded values with theme variables where applicable
4. Test the component renders correctly
5. Delete the external CSS file once all styles are migrated
