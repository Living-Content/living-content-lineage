# Detail View Components

Asset-specific detail views provide tailored displays for each asset type.

## Architecture

```plaintext
src/components/dataviewer/
  DetailView.svelte              # Router component
  detail/
    PropertyGroup.svelte         # Collapsible section
    ActionsList.svelte           # Reusable C2PA actions display
    CodeBlock.svelte             # Reusable source code display
    DetailValue.svelte           # Dynamic value renderer
    views/
      ModelDetailView.svelte     # Model-specific
      CodeDetailView.svelte      # Code-specific
      DatasetDetailView.svelte   # Dataset-specific
      DocumentDetailView.svelte  # Document-specific
      ActionDetailView.svelte    # Action-specific
      MediaDetailView.svelte     # Media-specific
      AttestationDetailView.svelte
      CredentialDetailView.svelte
      DefaultDetailView.svelte   # DataObject and fallback
```

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

Reusable component for displaying C2PA actions. Used by ActionDetailView, MediaDetailView, and ModelDetailView.

```svelte
<script lang="ts">
  import type { C2paAction } from '../../../services/dataviewer/parsing/assertionParsers.js';
</script>

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

Reusable component for displaying source code. Used by CodeDetailView and DefaultDetailView.

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

1. Add to the router in `DetailView.svelte`:

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

## Asset Type Routing

The `DetailView.svelte` router maps asset types to views:

| Asset Type    | View Component        |
| ------------- | --------------------- |
| Model         | ModelDetailView       |
| Code          | CodeDetailView        |
| Dataset       | DatasetDetailView     |
| Document      | DocumentDetailView    |
| Action        | ActionDetailView      |
| Media         | MediaDetailView       |
| Attestation   | AttestationDetailView |
| Credential    | CredentialDetailView  |
| DataObject    | DefaultDetailView     |
| (unspecified) | DefaultDetailView     |
