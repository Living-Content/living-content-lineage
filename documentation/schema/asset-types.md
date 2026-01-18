# Asset Types

The lineage system defines 9 asset types organized into 3 categories.

## Categories

### Content Assets
Data flowing through the pipeline.

| Type | Description |
|------|-------------|
| **Media** | Images, video, audio files |
| **Document** | Text content, queries, responses |
| **DataObject** | Structured data objects |
| **Dataset** | Collections of retrieved chunks |

### Process Assets
Transformations and computations.

| Type | Description |
|------|-------------|
| **Code** | Executable functions and modules |
| **Model** | AI/ML model invocations |
| **Action** | C2PA-tracked actions |

### Verification Assets
Trust and attestation records.

| Type | Description |
|------|-------------|
| **Attestation** | Verification records |
| **Credential** | Identity credentials |

## Asset Manifest Structure

All assets share a common manifest structure:

```typescript
interface AssetManifest {
  claimGenerator?: string;           // Generator identifier
  claimGeneratorInfo?: GeneratorInfo[];
  title?: string;                    // Display title
  format?: string;                   // MIME type or format
  instanceId?: string;               // Unique identifier
  assertions?: ManifestAssertion[];  // Type-specific data
  signatureInfo?: SignatureInfo;     // Cryptographic signature
  sourceCode?: string;               // For Code assets
  content?: AssetContent;            // Type-specific content
  ingredients?: ManifestIngredient[]; // Referenced assets
  environmentalImpact?: EnvironmentalImpact;
}
```

## Type-Specific Fields

### Model
Located in `lco.model` assertion:
- `provider` - Model provider (e.g., "anthropic")
- `model_id` - Model identifier (e.g., "claude-sonnet-4-5")
- `computation` - Operation type (e.g., "generate_response")
- `parameters` - Model parameters (max_tokens, temperature)

Duration in `lco.usage` assertion:
- `duration_ms` - Execution time in milliseconds

### Code
Located in `lco.code` assertion:
- `function` - Function name
- `module` - Module path
- `computation` - Operation type
- `hash` - Code hash

Execution flow in `lco.execution` assertion:
- `execution_duration_ms` - Execution time
- `previous_function` - Preceding function
- `next_function` - Following function

Source code in `sourceCode` field.

### Dataset
Located in `content` field:
- `execution_result.chunks_retrieved` - Number of chunks
- `execution_result.confidence` - Confidence score (0-1)
- `execution_result.gaps_addressed` - Knowledge gaps filled
- `search_results[].query_text` - Search query
- `search_results[].avg_score` - Average relevance score
- `chunks[]` - Retrieved chunk data

### Document
Located in `content` field:
- `query` - Input query text
- `response` - Output response text
- `message_count` - Number of messages
- `client_date_time` - Timestamp information
