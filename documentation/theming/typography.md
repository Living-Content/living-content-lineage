# Typography

The typography system defines a consistent scale for text hierarchy. Typography tokens are defined in TypeScript and auto-generated to CSS.

## Font Families

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
```

## Font Size Scale

From largest to smallest:

| Variable              | Size | Usage                     |
| --------------------- | ---- | ------------------------- |
| `--font-size-hero`    | 48px | Primary metrics ("12.0s") |
| `--font-size-display` | 36px | Large display numbers     |
| `--font-size-large`   | 32px | Secondary metrics         |
| `--font-size-title`   | 24px | Page/section titles       |
| `--font-size-heading` | 18px | Section headers           |
| `--font-size-body`    | 14px | Body text                 |
| `--font-size-small`   | 12px | Labels, captions          |
| `--font-size-tiny`    | 10px | Badges, fine print        |

## Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## Line Heights

```css
--line-height-tight: 1.1;    /* Large metrics */
--line-height-snug: 1.3;     /* Headings */
--line-height-normal: 1.5;   /* Body text */
--line-height-relaxed: 1.6;  /* Readable paragraphs */
--line-height-loose: 1.8;    /* Spacious text */
```

## Letter Spacing

```css
--letter-spacing-tight: -0.02em;  /* Large text */
--letter-spacing-normal: 0;       /* Body text */
--letter-spacing-wide: 0.02em;    /* Slight emphasis */
--letter-spacing-wider: 0.05em;   /* Uppercase labels */
--letter-spacing-caps: 0.1em;     /* All caps */
```

## Using Typography in TypeScript

```typescript
import { getCssVar, getCssVarInt, getCssVarFloat } from '../themes';

const fontFamily = getCssVar('--font-sans');
const fontSize = getCssVarInt('--font-size-body');
const lineHeight = getCssVarFloat('--line-height-normal');
```

## Usage Examples

### Metric Values

```css
.metric-value {
  font-size: var(--font-size-hero, 48px);
  font-weight: var(--font-weight-semibold, 600);
  letter-spacing: var(--letter-spacing-tight, -0.02em);
  line-height: var(--line-height-tight, 1.1);
}
```

### Section Headers

```css
.section-header {
  font-size: var(--font-size-small, 12px);
  font-weight: var(--font-weight-semibold, 600);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider, 0.05em);
}
```

### Body Text

```css
.body-text {
  font-size: var(--font-size-body, 14px);
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--line-height-relaxed, 1.6);
}
```

### Code Blocks

```css
.code-block {
  font-family: var(--font-mono);
  font-size: var(--font-size-small, 12px);
  line-height: var(--line-height-relaxed, 1.6);
}
```

## MetricCard Sizes

The MetricCard component uses these size presets:

| Size     | Font Size Variable           |
| -------- | ---------------------------- |
| `hero`   | `--font-size-hero` (48px)    |
| `large`  | `--font-size-large` (32px)   |
| `medium` | `--font-size-heading` (18px) |

## File

Typography is defined in `src/themes/definitions/typography.ts`.
