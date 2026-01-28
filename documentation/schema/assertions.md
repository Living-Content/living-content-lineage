# Assertions

Assertions are typed data blocks attached to asset manifests. They follow the C2PA specification pattern with custom extensions for LCO (Living Content Operations).

## Assertion Structure

```typescript
interface ManifestAssertion {
  label: string; // Assertion type identifier
  data: unknown; // Type-specific data
}
```

## Standard Assertions

### c2pa.actions

Records actions performed on the asset.

```json
{
  "label": "c2pa.actions",
  "data": {
    "actions": [
      {
        "action": "c2pa.created",
        "softwareAgent": {
          "name": "Living Content Pipeline",
          "version": "1.0.0"
        },
        "when": "2026-01-14T18:15:30Z",
        "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"
      }
    ]
  }
}
```

Action types:

- `c2pa.created` - Asset was created
- `c2pa.placed` - Asset was placed/used

## LCO Assertions

### lco.model

Model invocation metadata.

```json
{
  "label": "lco.model",
  "data": {
    "provider": "anthropic",
    "model_id": "claude-sonnet-4-5",
    "computation": "generate_response",
    "parameters": {
      "max_tokens": 4096,
      "temperature": 0.7
    }
  }
}
```

### lco.code

Code execution metadata.

```json
{
  "label": "lco.code",
  "data": {
    "function": "_stream_llm_response",
    "module": "core.tasks.query",
    "computation": "generate_response",
    "hash": "sha256:abc123..."
  }
}
```

### lco.execution

Execution flow metadata.

```json
{
  "label": "lco.execution",
  "data": {
    "execution_start_time": "1768414502.7448637",
    "execution_end_time": "1768414514.774498",
    "execution_duration_ms": 12029.63,
    "previous_function": "retrieve_history",
    "next_function": "save_response"
  }
}
```

### lco.usage

Resource usage metrics.

```json
{
  "label": "lco.usage",
  "data": {
    "input_tokens": 245,
    "output_tokens": 89,
    "total_tokens": 334,
    "duration_ms": 1243.5
  }
}
```

### lco.content

Content metadata for documents.

```json
{
  "label": "lco.content",
  "data": {
    "type": "Document",
    "content_hash": "sha256:abc123...",
    "content_preview": "Whats in the database"
  }
}
```

## Parsing Assertions

Use the `assertionParsers.ts` service to extract typed data:

```typescript
import { extractAssertionData } from "../../services/inspector/assertions.js";

const assertions = extractAssertionData(manifest.assertions);

// Access typed data
assertions.model?.provider; // "anthropic"
assertions.model?.modelId; // "claude-sonnet-4-5"
assertions.usage?.durationMs; // 1243.5
assertions.usage?.inputTokens; // 245
assertions.usage?.outputTokens; // 89
assertions.code?.function; // "_stream_llm_response"
```
