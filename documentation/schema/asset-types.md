# Asset Types

The trace system defines 18 asset types organized into 3 categories. Each asset type has defined fields with display configurations and edit capabilities.

## Catalog Source

Field definitions live in the Python catalog at `shared/core/trace/catalog/`. TypeScript is auto-generated to `src/config/field_catalog.generated.ts` at build time.

To regenerate:
```bash
npm run catalog:generate
```

## Categories

### Content Assets

Data flowing through the pipeline.

#### From Document (6 types)

| Type                      | Node Type | Fields | Description                           |
| ------------------------- | --------- | ------ | ------------------------------------- |
| **UserQuery**             | data      | 3      | Incoming user query or request        |
| **ToolSelection**         | data      | 3      | Decision on which tool to use         |
| **GapAnalysis**           | data      | 4      | Identified knowledge gaps             |
| **QueryPlan**             | data      | 2      | Planned queries and execution strategy|
| **SufficiencyEvaluation** | data      | 3      | Evaluation of data completeness       |
| **AssistantResponse**     | data      | 4      | Final generated content               |

#### From Data (2 types)

| Type                      | Node Type | Fields | Description                           |
| ------------------------- | --------- | ------ | ------------------------------------- |
| **ConversationHistory**   | store     | 2      | Retrieved conversation context        |
| **KnowledgeSearchResult** | store     | 5      | Retrieved knowledge chunks            |

#### From Media (6 types)

| Type                | Node Type | Fields | Description                 |
| ------------------- | --------- | ------ | --------------------------- |
| **SourceImage**     | media     | 4      | Input image asset           |
| **GeneratedImage**  | media     | 4      | AI-generated image asset    |
| **SourceAudio**     | media     | 4      | Input audio asset           |
| **GeneratedAudio**  | media     | 4      | AI-generated audio asset    |
| **SourceVideo**     | media     | 5      | Input video asset           |
| **GeneratedVideo**  | media     | 5      | AI-generated video asset    |

### Process Assets

Transformations and computations.

| Type       | Node Type | Fields | Description                      |
| ---------- | --------- | ------ | -------------------------------- |
| **Model**  | process   | 6      | AI/ML model invocations          |
| **Code**   | process   | 4      | Executable functions and modules |
| **Action** | process   | 0      | Pure connector node              |

### Verification Assets

Trust and verification records.

| Type      | Node Type | Fields | Description                    |
| --------- | --------- | ------ | ------------------------------ |
| **Claim** | claim     | 3      | Verification node in the trace |

## Node Types

Each asset type maps to a visual node type for rendering:

| Node Type   | Assets                                                    | Visual Style       |
| ----------- | --------------------------------------------------------- | ------------------ |
| `data`      | UserQuery, ToolSelection, GapAnalysis, QueryPlan, etc.    | Rectangle          |
| `store`     | ConversationHistory, KnowledgeSearchResult                | Rectangle          |
| `media`     | SourceImage, GeneratedImage, SourceAudio, etc.            | Rectangle          |
| `process`   | Model, Code, Action                                       | Rectangle          |
| `claim`     | Claim                                                     | Icon               |
| `workflow`  | (internal)                                                | Workflow card      |

## Asset Type Configuration

Each asset type has metadata for rendering:

```typescript
interface AssetTypeConfig {
  nodeType: NodeType;      // Visual rendering type
  category: AssetCategory; // Content | Process | Verification
  label: string;           // Human-readable label
  iconName: string;        // Icon file name
}

// Access via ASSET_TYPE_CONFIG
import { ASSET_TYPE_CONFIG } from './config/types';
ASSET_TYPE_CONFIG['UserQuery'];
// { nodeType: 'data', category: 'Content', label: 'User Query', iconName: 'document' }
```

## Helper Functions

```typescript
import {
  isValidAssetType,      // Type guard
  getAssetTypeNodeType,  // Get node type for rendering
  getAssetTypeCategory,  // Get category
  getAssetTypeLabel,     // Get human-readable label
  getAssetTypeIconName,  // Get icon name
  getAllAssetTypes,      // List all valid types
} from './config/types';

// Validate an asset type string
if (isValidAssetType(assetType)) {
  // assetType is now typed as AssetType
}

// Get rendering info
const nodeType = getAssetTypeNodeType('UserQuery'); // 'data'
const label = getAssetTypeLabel('UserQuery');       // 'User Query'
```

## Asset Manifest Structure

All assets share a common manifest structure:

```typescript
interface AssetManifest {
  claimGenerator?: string;
  claimGeneratorInfo?: GeneratorInfo[];
  title?: string;
  format?: string;
  instanceId?: string;
  assertions?: ManifestAssertion[];
  attestation?: Attestation;
  sourceCode?: string;
  data?: AssetData;
  ingredients?: ManifestIngredient[];
  environmentalImpact?: EnvironmentalImpact;
  inputs?: string[];
  outputs?: string[];
}

interface Attestation {
  alg: string;
  issuer: string;
  time: string;
  type?: 'merkle' | 'certificate' | 'tee';
  provider?: 'EQTY' | 'C2PA' | 'LCO';
}
```

## Editable Fields

Fields that support replay modifications:

| Asset Type            | Field               | Edit Type | Description                           |
| --------------------- | ------------------- | --------- | ------------------------------------- |
| Model                 | temperature         | number    | Sampling temperature                  |
| Model                 | tokenLimit          | number    | Maximum output tokens                 |
| Model                 | model               | select    | Model selection                       |
| Code                  | arguments           | json      | Function arguments                    |
| UserQuery             | query               | textarea  | User query input                      |
| UserQuery             | value               | textarea  | Document content                      |
| ToolSelection         | llmResponse         | textarea  | LLM selection response                |
| AssistantResponse     | response            | textarea  | Generated response                    |
| ConversationHistory   | conversationHistory | json      | User messages only (via nested rules) |
| KnowledgeSearchResult | evaluationSummary   | textarea  | Evaluation summary                    |

## Using the Field Catalog

```typescript
import {
  FIELD_CATALOG,
  getFieldsByAssetType,
  getEditableFields,
  getFieldByName,
  getCardColumns,
} from './config/types';

// Get fields for an asset type
const fields = getFieldsByAssetType('UserQuery');

// Get all editable fields
const editableFields = getEditableFields();

// Get specific field
const queryField = getFieldByName('query', 'UserQuery');

// Get card columns for an asset type
const columns = getCardColumns('Model'); // 4
```

## Adding New Asset Types

To add a new asset type:

1. Add the definition in `shared/core/trace/catalog/definitions.py`:
   ```python
   NEW_TYPE_FIELDS = AssetTypeFields(
       asset_type="NewType",
       label="New Type",
       node_type=NodeType.DATA,
       category=AssetCategory.CONTENT,
       description="Description of the new type",
       icon_name="document",  # or None to use asset_type.lower()
       card_columns=4,
       fields=[
           FieldDefinition(
               name="fieldName",
               label="Field Label",
               field_type=FieldType.STRING,
               source_path="data.fieldName",
               display_type=DisplayType.TEXT,
               is_card=True,
               span=2,
           ),
       ],
   )
   ```

2. Add it to `build_catalog()` in the same file

3. Regenerate TypeScript: `npm run catalog:generate`

No tracer code changes required - the system is fully dynamic.
