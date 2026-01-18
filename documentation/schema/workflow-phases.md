# Workflow Phases

The lineage system organizes workflow stages into 6 logical phases.

## Phases

### Acquisition
Getting input data into the pipeline.

| Stage Type | Description |
|------------|-------------|
| `ingest` | Initial data ingestion |

Color: `--phase-acquisition` (Red)

### Preparation
Selecting, transforming, and validating inputs.

| Stage Type | Description |
|------------|-------------|
| `select` | Choose specific data |
| `transform` | Modify data format |
| `validate` | Verify data integrity |

Color: `--phase-preparation` (Coral)

### Retrieval
Fetching additional context and data.

| Stage Type | Description |
|------------|-------------|
| `retrieve` | Get known internal data |
| `search` | Find external data |

Color: `--phase-retrieval` (Yellow)

### Reasoning
AI/ML processing and analysis.

| Stage Type | Description |
|------------|-------------|
| `reflect` | Self-analysis |
| `plan` | Strategy formulation |
| `evaluate` | Assessment |

Color: `--phase-reasoning` (Green)

### Generation
Creating new content and outputs.

| Stage Type | Description |
|------------|-------------|
| `generate` | Content creation |

Color: `--phase-generation` (Blue)

### Persistence
Storing and publishing results.

| Stage Type | Description |
|------------|-------------|
| `store` | Internal persistence |
| `publish` | External distribution |

Color: `--phase-persistence` (Dark Blue)

## TypeScript Types

```typescript
type WorkflowPhase =
  | "Acquisition"
  | "Preparation"
  | "Retrieval"
  | "Reasoning"
  | "Generation"
  | "Persistence";

type WorkflowStageType =
  | "ingest"
  | "select" | "transform" | "validate"
  | "retrieve" | "search"
  | "reflect" | "plan" | "evaluate"
  | "generate"
  | "store" | "publish";
```

## Phase-to-Stage Mapping

```typescript
function workflowStageTypeToPhase(stageType: WorkflowStageType): WorkflowPhase {
  switch (stageType) {
    case "ingest":
      return "Acquisition";
    case "select":
    case "transform":
    case "validate":
      return "Preparation";
    case "retrieve":
    case "search":
      return "Retrieval";
    case "reflect":
    case "plan":
    case "evaluate":
      return "Reasoning";
    case "generate":
      return "Generation";
    case "store":
    case "publish":
      return "Persistence";
  }
}
```

## Using Phase Colors

Assets inherit their accent color from their parent stage's workflow phase:

```svelte
<MetricCard
  value={durationDisplay}
  label="Duration"
  phase={node.phase}
  size="hero"
/>
```

The phase is automatically passed to detail views via `node.phase`.
