# Phases and Steps

The trace system organizes operations into 6 logical phases, each containing specific steps.

## Phases

### Acquisition

Getting input data into the pipeline.

| Step     | Description            |
| -------- | ---------------------- |
| `ingest` | Initial data ingestion |

Color: `--phase-acquisition` (Red)

### Preparation

Selecting, transforming, and validating inputs.

| Step        | Description           |
| ----------- | --------------------- |
| `select`    | Choose specific data  |
| `transform` | Modify data format    |
| `validate`  | Verify data integrity |

Color: `--phase-preparation` (Coral)

### Retrieval

Fetching additional context and data.

| Step       | Description             |
| ---------- | ----------------------- |
| `retrieve` | Get known internal data |
| `search`   | Find external data      |

Color: `--phase-retrieval` (Yellow)

### Reasoning

AI/ML processing and analysis.

| Step       | Description          |
| ---------- | -------------------- |
| `reflect`  | Self-analysis        |
| `plan`     | Strategy formulation |
| `evaluate` | Assessment           |

Color: `--phase-reasoning` (Green)

### Generation

Creating new content and outputs.

| Step       | Description      |
| ---------- | ---------------- |
| `generate` | Content creation |

Color: `--phase-generation` (Blue)

### Persistence

Storing and publishing results.

| Step      | Description           |
| --------- | --------------------- |
| `store`   | Internal persistence  |
| `publish` | External distribution |

Color: `--phase-persistence` (Dark Blue)

## TypeScript Types

```typescript
type Phase =
  | "Acquisition"
  | "Preparation"
  | "Retrieval"
  | "Reasoning"
  | "Generation"
  | "Persistence";

type Step =
  | "ingest"
  | "select"
  | "transform"
  | "validate"
  | "retrieve"
  | "search"
  | "reflect"
  | "plan"
  | "evaluate"
  | "generate"
  | "store"
  | "publish";
```

## Step-to-Phase Mapping

```typescript
function stepToPhase(step: Step): Phase {
  switch (step) {
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

Assets inherit their accent color from their step's parent phase:

```svelte
<DataCard
  value={durationDisplay}
  label="Duration"
  phase={node.phase}
/>
```

The phase is automatically available on nodes via `node.phase`.
