# Detail View Components

Asset-specific detail views are driven by configuration in `displayConfig.ts`.

## Architecture

```plaintext
src/components/dataviewer/
  DataViewPanel.svelte           # Main panel container
  StepOverview.svelte            # Aggregate view for selected step
  SummaryView.svelte             # Node summary with cards (config-driven)
  DetailView.svelte              # Full details view (config-driven)
  AttestationPanel.svelte        # Footer panel for attestation info
  panel/
    PanelHeader.svelte           # Header with breadcrumb navigation
    NodeContent.svelte           # Node content wrapper
  detail/
    PropertyGroup.svelte         # Collapsible section
    ActionsList.svelte           # Reusable C2PA actions display
    CodeBlock.svelte             # Reusable source code display
    DetailValue.svelte           # Dynamic value renderer
    NodeCard.svelte              # Node display card (pill shape)
    ContextBadges.svelte         # Phase/step breadcrumb badges
  cards/
    DataCard.svelte              # Metric display card
    CardSection.svelte           # Combined metrics and properties
```

The system uses a **config-driven approach** rather than per-asset-type view components. Field display is controlled by `src/config/displayConfig.ts`.

## Step Overview

When a step is selected (collapsed view), `StepOverview.svelte` displays an aggregate view:

- **Inputs** — Nodes receiving edges from outside the step
- **Processing** — Process count and total duration
- **Outputs** — Nodes sending edges outside the step

## Shared Components

### PropertyGroup

Collapsible section with title.

```svelte
<PropertyGroup title="Model Info" collapsible={false}>
  <PropertyRow label="Provider" value="anthropic" />
  <PropertyRow label="Model" value="claude-sonnet-4-5" />
</PropertyGroup>

<PropertyGroup title="Signature" collapsed>
  <!-- Initially collapsed -->
</PropertyGroup>
```

Props:

- `title` - Section title
- `collapsed` - Initial collapsed state (default: false)
- `collapsible` - Whether section can be collapsed (default: true)

### ActionsList

Reusable component for displaying C2PA actions.

```svelte
<ActionsList
  actions={c2paActions.actions}
  title="Actions"
  collapsed={true}
/>
```

Props:

- `actions` - Array of C2paAction objects
- `title` - Section title (default: "Actions")
- `collapsed` - Initial collapsed state (default: true)

### CodeBlock

Reusable component for displaying source code.

```svelte
<CodeBlock
  code={sourceCode}
  title="Source Code"
  collapsed={true}
/>
```

Props:

- `code` - Source code string to display
- `title` - Section title (default: "Source Code")
- `collapsed` - Initial collapsed state (default: true)

### NodeCard

Displays a node in card form matching the graph node visual style.

```svelte
<NodeCard
  title="Knowledge Retriever"
  assetType="Code"
  phase="Retrieval"
/>
```

Props:

- `title` - Node title
- `assetType` - Asset type for icon
- `phase` - Phase for color accent

### DataCard

Metric display card with phase-colored accent.

```svelte
<DataCard
  value={3}
  label="Processes"
  type="number"
  phase="Reasoning"
  size="compact"
/>
```

Props:

- `value` - Display value
- `label` - Label text
- `type` - Data type for formatting
- `phase` - Phase for color accent
- `span` - Grid column span (1-4)
- `size` - "default" or "compact"

## Creating a New Detail View

1. Create a new file in `src/components/dataviewer/detail/views/`:

```svelte
<script lang="ts">
  import type { LineageNodeData } from '../../../../config/types.js';
  import { extractAssertionData, formatDuration } from '../../../../services/dataviewer/parsing/assertionParsers.js';
  import PropertyGroup from '../PropertyGroup.svelte';
  import PropertyRow from '../../PropertyRow.svelte';
  import ActionsList from '../ActionsList.svelte';
  import CodeBlock from '../CodeBlock.svelte';

  export let node: LineageNodeData;

  $: assetManifest = node.assetManifest;
  $: assertions = extractAssertionData(assetManifest?.assertions);
  $: c2paActions = assertions.c2paActions;
  $: phase = node.phase;

  // Extract type-specific data
  $: myData = assertions.model;
</script>

<div class="my-detail-view">
  <PropertyGroup title="Info" collapsible={false}>
    <PropertyRow label="Field" value="..." />
  </PropertyGroup>

  {#if c2paActions?.actions}
    <ActionsList actions={c2paActions.actions} />
  {/if}
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

1. **Primary info** - Key type-specific information (non-collapsible)
2. **Secondary metadata** - Additional details (collapsible)
3. **Actions** - C2PA actions if available (collapsible, use ActionsList)
4. **Source code** - If available (collapsible, use CodeBlock)

## Asset Type Configuration

Display configuration is defined in `src/config/displayConfig.ts`:

| Asset Type | Card Fields                              |
| ---------- | ---------------------------------------- |
| Model      | Model ID, provider, input/output tokens  |
| Code       | Function, module, duration               |
| Action     | Duration, input/output/total tokens      |
| Document   | Duration, response length, model         |
| Dataset    | Chunks retrieved, similarity, confidence |
| Media      | Format, dimensions, file size            |
| Result     | Token counts, evaluation scores          |
| Claim      | Status, algorithm                        |

Each asset type defines which fields appear in card view vs detail view through the `fields` configuration.
