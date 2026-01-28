# Detail View Components

Asset-specific detail views are driven by configuration in `displayConfig.ts`.

## Architecture

```plaintext
src/components/inspector/
  InspectorPanel.svelte          # Main panel container
  InspectorHeader.svelte         # Header with context badges
  StepInspector.svelte           # Aggregate view for selected step
  views/
    SummaryView.svelte           # Node summary with cards (config-driven)
    DetailView.svelte            # Full details view (config-driven)
    ContentRouter.svelte         # View switcher
  sections/
    AttestationSection.svelte    # Footer panel for attestation info
    ImpactSection.svelte         # Environmental impact display
    PropertyGroup.svelte         # Collapsible section
    DetailSection.svelte         # Generic titled section
  fields/
    PropertyRow.svelte           # Label/value row for details
    EditablePropertyRow.svelte   # Editable property row
    EditableValue.svelte         # Editable value component
    DetailValue.svelte           # Dynamic value renderer
    AdditionalData.svelte        # Displays non-configured fields
  renderers/
    CodeBlock.svelte             # Reusable source code display
    HighlightedCode.svelte       # Syntax highlighting
    MarkdownValue.svelte         # Markdown rendering
    ConversationHistory.svelte   # Chat-style display
    ContextBadges.svelte         # Phase/step breadcrumb badges
  cards/
    DataCard.svelte              # Metric display card
    EditableDataCard.svelte      # Editable metric card
    CardSection.svelte           # Combined metrics and properties
  shared/
    Expandable.svelte            # Collapse/expand toggle
    NodeCard.svelte              # Node display card (pill shape)
```

The system uses a **config-driven approach** rather than per-asset-type view components. Field display is controlled by `src/config/displayConfig.ts`.

## Display Configuration

Each asset type has a display configuration that defines which fields appear in card views vs detail views:

```typescript
interface FieldDisplayConfig {
  type: DataCardType;       // Rendering type
  isCard: boolean;          // Show in summary view
  isDetail: boolean;        // Show in detail view
  label?: string;           // Override display label
  summarySpan?: 1 | 2 | 3 | 4;  // Grid column span
  detailSpan?: 1 | 2 | 3 | 4;
  source?: string;          // Data path (dot notation)
}
```

### Data Card Types

Available rendering types for field display:

| Type | Description |
| ---- | ----------- |
| `metric` | Numeric value (tokens, counts) |
| `text` | Simple text value |
| `text-preview` | Truncated text with expand |
| `badge` | Small label/tag |
| `status` | Verified/Valid/Error indicator |
| `duration` | Formatted time duration |
| `datetime` | Date/time display |
| `percentage` | 0-100% with visual |
| `dimensions` | width x height |
| `filesize` | Formatted bytes (KB, MB) |
| `hash` | Truncated hash with copy |
| `number` | Generic number |
| `code` | Syntax-highlighted code block |
| `markdown` | Rendered markdown content |
| `list` | Array of strings |
| `chunk-list` | RAG chunks with scores |
| `key-value` | Flexible pairs |

### Asset Type Configuration

| Asset Type | Card Fields |
| ---------- | ----------- |
| Model | Model ID, provider, input/output tokens |
| Code | Function, module, duration |
| Action | Duration, input/output/total tokens |
| Document | Duration, response length, model |
| Data | Chunks retrieved, similarity, confidence |
| Media | Format, dimensions, file size |
| Claim | Status, algorithm |

## Step Overview

When a step is selected (collapsed view), `StepOverview.svelte` displays an aggregate view:

- **Inputs** - Nodes receiving edges from outside the step
- **Processing** - Process count and total duration
- **Outputs** - Nodes sending edges outside the step

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

Reusable component for displaying source code with syntax highlighting.

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
- `type` - Data card type for formatting
- `phase` - Phase for color accent
- `span` - Grid column span (1-4)
- `size` - "default" or "compact"

### CardSection

Combines metrics and properties in a unified layout.

```svelte
<CardSection
  {node}
  {assertions}
  {content}
  {computed}
/>
```

Props:

- `node` - TraceNodeData
- `assertions` - Parsed assertion data
- `content` - Asset content
- `computed` - Computed values (duration, etc.)

## Data Sources

Field configurations use dot-notation paths to locate data:

| Prefix | Source |
| ------ | ------ |
| `node.*` | TraceNodeData fields |
| `manifest.*` | AssetManifest fields |
| `content.*` | Asset content fields |
| `assertions.*` | Parsed assertion data |
| `computed.*` | Computed values |

Example paths:

- `assertions.model.modelId` - Model ID from lco.model assertion
- `content.query` - Query text from content
- `manifest.attestation.alg` - Algorithm from attestation
- `computed.duration` - Computed duration value

## Files

- Display configuration: `src/config/displayConfig.ts`
- Card types: `src/config/cardTypes.ts`
- Assertion parsing: `src/services/inspector/assertions.ts`
