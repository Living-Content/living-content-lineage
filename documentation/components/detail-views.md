# Detail View Components

Asset-specific detail views provide tailored displays for each asset type.

## Architecture

```
src/components/sidebar/
  DetailView.svelte              # Router component
  detail/
    MetricCard.svelte            # Large metric display
    MetricRow.svelte             # Horizontal metric grid
    PropertyGroup.svelte         # Collapsible section
    views/
      ModelDetailView.svelte     # Model-specific
      CodeDetailView.svelte      # Code-specific
      DatasetDetailView.svelte   # Dataset-specific
      DocumentDetailView.svelte  # Document-specific
      DataObjectDetailView.svelte
      ActionDetailView.svelte
      MediaDetailView.svelte
      AttestationDetailView.svelte
      CredentialDetailView.svelte
      GenericDetailView.svelte   # Fallback
```

## Shared Components

### MetricCard

Large metric display with optional phase accent.

```svelte
<MetricCard
  value="12.0s"
  label="Duration"
  phase="Generation"
  size="hero"        <!-- hero | large | medium -->
/>
```

Props:
- `value` - Display value (string or number)
- `label` - Metric label
- `unit` - Optional unit suffix
- `phase` - Workflow phase for color accent
- `size` - Size variant (hero: 48px, large: 32px, medium: 18px)

### MetricRow

Grid container for MetricCards.

```svelte
<MetricRow columns={3}>
  <MetricCard value="10" label="Chunks" />
  <MetricCard value="50%" label="Confidence" />
  <MetricCard value="0.015" label="Avg Score" />
</MetricRow>
```

Props:
- `columns` - Number of columns (2, 3, or 4)

### PropertyGroup

Collapsible section with title.

```svelte
<PropertyGroup title="Model Info" collapsible={false}>
  <MetaRow label="Provider" value="anthropic" />
  <MetaRow label="Model" value="claude-sonnet-4-5" />
</PropertyGroup>

<PropertyGroup title="Signature" collapsed>
  <!-- Initially collapsed -->
</PropertyGroup>
```

Props:
- `title` - Section title
- `collapsed` - Initial collapsed state (default: false)
- `collapsible` - Whether section can be collapsed (default: true)

## Creating a New Detail View

1. Create a new file in `src/components/sidebar/detail/views/`:

```svelte
<script lang="ts">
  import type { LineageNodeData } from '../../../../types.js';
  import { extractAssertionData, formatDuration } from '../../../../services/sidebar/assertionParsers.js';
  import MetricCard from '../MetricCard.svelte';
  import MetricRow from '../MetricRow.svelte';
  import PropertyGroup from '../PropertyGroup.svelte';
  import MetaRow from '../../MetaRow.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: assertions = extractAssertionData(assetManifest?.assertions);
  $: phase = node.phase;

  // Extract type-specific data
  $: myData = assertions.model;
</script>

<div class="my-detail-view">
  <MetricRow columns={2}>
    <MetricCard value="..." label="..." {phase} size="hero" />
    <MetricCard value="..." label="..." {phase} size="large" />
  </MetricRow>

  <PropertyGroup title="Info" collapsible={false}>
    <MetaRow label="Field" value="..." />
  </PropertyGroup>
</div>

<style>
  .my-detail-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 16px);
  }
</style>
```

2. Add to the router in `DetailView.svelte`:

```svelte
{:else if assetType === 'MyType'}
  <MyDetailView {node} />
```

## View Structure Convention

Each detail view follows this structure:

1. **Hero metrics** - Large prominent numbers at the top
2. **Primary content** - Key type-specific information
3. **Secondary metadata** - Collapsible details
4. **Signature** - Always collapsed at bottom
