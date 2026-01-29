# Phases and Steps

The trace system organizes operations into 6 logical phases, each containing specific steps. Each step contains nodes (asset types) with their relevant fields.

## Catalog Source

The canonical definitions live in the Python catalog at `shared/core/trace/catalog/`. TypeScript types and data are auto-generated to `src/config/field_catalog.generated.ts` at build time.

To regenerate:
```bash
npm run catalog:generate
```

## Phases

### Acquisition

Getting input data into the pipeline.

| Step     | Asset Types | Description            |
| -------- | ----------- | ---------------------- |
| `ingest` | UserQuery   | Initial data ingestion |

Color: `--phase-acquisition` (Red)

### Preparation

Selecting, transforming, and validating inputs.

| Step        | Asset Types              | Description           |
| ----------- | ------------------------ | --------------------- |
| `select`    | ToolSelection, Model     | Choose tool/workflow  |
| `transform` | -                        | Modify data format    |
| `validate`  | -                        | Verify data integrity |

Color: `--phase-preparation` (Coral)

### Retrieval

Fetching additional context and data.

| Step       | Asset Types           | Description             |
| ---------- | --------------------- | ----------------------- |
| `retrieve` | ConversationHistory   | Get conversation context|
| `search`   | KnowledgeSearchResult | Find external knowledge |

Color: `--phase-retrieval` (Yellow)

### Reasoning

AI/ML processing and analysis.

| Step       | Asset Types                    | Description          |
| ---------- | ------------------------------ | -------------------- |
| `reflect`  | GapAnalysis, Model             | Analyze knowledge gaps|
| `plan`     | QueryPlan, Model               | Strategy formulation |
| `evaluate` | SufficiencyEvaluation, Model   | Data sufficiency check|

Color: `--phase-reasoning` (Green)

### Generation

Creating new content and outputs.

| Step       | Asset Types                                                           | Description      |
| ---------- | --------------------------------------------------------------------- | ---------------- |
| `generate` | AssistantResponse, Model, GeneratedImage, GeneratedAudio, GeneratedVideo | Content creation |

Color: `--phase-generation` (Blue)

### Persistence

Storing and publishing results.

| Step      | Asset Types       | Description           |
| --------- | ----------------- | --------------------- |
| `store`   | AssistantResponse | Internal persistence  |
| `publish` | -                 | External distribution |

Color: `--phase-persistence` (Dark Blue)

## Step-to-Asset Mapping

| Step     | Primary Asset Type      | Supporting Types                              |
| -------- | ----------------------- | --------------------------------------------- |
| ingest   | UserQuery               | -                                             |
| select   | ToolSelection           | Model                                         |
| retrieve | ConversationHistory     | -                                             |
| search   | KnowledgeSearchResult   | -                                             |
| reflect  | GapAnalysis             | Model                                         |
| plan     | QueryPlan               | Model                                         |
| evaluate | SufficiencyEvaluation   | Model                                         |
| generate | AssistantResponse       | Model, GeneratedImage, GeneratedAudio, GeneratedVideo |
| store    | AssistantResponse       | -                                             |

## TypeScript Types

Types are auto-generated in `src/config/field_catalog.generated.ts`:

```typescript
// Union types
type Phase = 'Acquisition' | 'Preparation' | 'Retrieval' | 'Reasoning' | 'Generation' | 'Persistence';

type AssetType = 'Model' | 'Code' | 'Action' | 'Claim'
  | 'UserQuery' | 'ToolSelection' | 'GapAnalysis' | 'QueryPlan'
  | 'SufficiencyEvaluation' | 'AssistantResponse'
  | 'ConversationHistory' | 'KnowledgeSearchResult'
  | 'SourceImage' | 'GeneratedImage' | 'SourceAudio' | 'GeneratedAudio'
  | 'SourceVideo' | 'GeneratedVideo';

// Interfaces
interface NodeDefinition {
  assetType: AssetType;
  label: string;
  description?: string;
  fields: string[];
}

interface StepDefinition {
  name: string;
  label: string;
  phase: Phase;
  description?: string;
  nodes: NodeDefinition[];
}

interface WorkflowCatalog {
  version: string;
  steps: StepDefinition[];
}
```

## Using the Catalog

```typescript
import {
  WORKFLOW_CATALOG,
  getAllSteps,
  getStepByName,
  getStepsByPhase,
  getPhases,
  stepToPhase,
} from './config/types';

// Get all steps
const steps = getAllSteps();

// Get step by name
const generateStep = getStepByName('generate');

// Get steps in a phase
const reasoningSteps = getStepsByPhase('Reasoning');

// Get all phases
const phases = getPhases();

// Map step to phase
const phase = stepToPhase('generate'); // 'Generation'
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

## Adding New Steps

To add a new step:

1. Define the step in `shared/core/trace/catalog/definitions.py`:
   ```python
   NEW_STEP = StepDefinition(
       name="newstep",
       label="New Step",
       phase=Phase.REASONING,
       description="What this step does",
       nodes=[
           NodeDefinition(
               asset_type="GapAnalysis",
               label="Analysis Result",
               description="Output of the analysis",
               fields=["gaps", "requirements"],
           ),
       ],
   )
   ```

2. Add it to `build_workflow_catalog()` in the same file

3. Regenerate TypeScript: `npm run catalog:generate`
