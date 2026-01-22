# Manifest Adapters

The trace system uses a format-agnostic adapter pattern to support multiple manifest standards.

## Adapter Interface

```typescript
interface ManifestAdapter<TRaw> {
  readonly type: ManifestType;
  isCompatible(raw: unknown): raw is TRaw;
  getAssetManifestRequests(raw: TRaw, baseUrl: URL): AssetManifestRequest[];
  parse(raw: TRaw, assetManifests: Map<string, unknown>): Trace;
}
```

| Method | Description |
| ------ | ----------- |
| `type` | Manifest type identifier: `'c2pa'`, `'eqty'`, or `'custom'` |
| `isCompatible` | Type guard to check if raw data matches this adapter |
| `getAssetManifestRequests` | Extract asset manifest URLs for fetching |
| `parse` | Transform raw manifest + asset data into `Trace` |

## Available Adapters

| Adapter | File | Description |
| ------- | ---- | ----------- |
| C2PA | `c2pa/c2paAdapter.ts` | Coalition for Content Provenance and Authenticity |
| EQTY | `eqty/eqtyAdapter.ts` | EQTY TEE attestation format |
| Custom | `custom/customAdapter.ts` | Living Content custom format |

## Creating a New Adapter

1. Create adapter directory: `src/services/manifest/adapters/myformat/`

2. Define format-specific types in `myformatTypes.ts`:

```typescript
export function isMyFormatManifest(raw: unknown): boolean {
  // Check for format-specific markers
  return isRecord(raw) && raw.manifest_type === 'myformat';
}
```

3. Implement the adapter in `myformatAdapter.ts`:

```typescript
import type { ManifestAdapter } from '../manifestAdapter.js';
import { getAssetManifestRequests, parseManifest } from '../base/traceAdapter.js';
import { isManifest, type Manifest } from '../base/traceTypes.js';
import { isMyFormatManifest } from './myformatTypes.js';

export const myformatAdapter: ManifestAdapter<Manifest> = {
  type: 'custom', // or add new ManifestType

  isCompatible(raw: unknown): raw is Manifest {
    return isMyFormatManifest(raw) && isManifest(raw);
  },

  getAssetManifestRequests(raw: Manifest, baseUrl: URL) {
    return getAssetManifestRequests(raw, baseUrl);
  },

  parse(raw: Manifest, assetManifests: Map<string, unknown>) {
    return parseManifest(raw, assetManifests, mapAssetType);
  },
};
```

4. Register the adapter in the manifest service.

## Type Guards

Runtime validation functions for manifest types.

### Core Type Guards

Located in `src/services/manifest/adapters/base/traceTypes.ts`:

```typescript
isStep(raw: unknown): raw is Step
isAsset(raw: unknown): raw is Asset
isClaim(raw: unknown): raw is Claim
isManifest(raw: unknown): raw is Manifest
```

### Attestation Type Guard

Located in `src/config/utils.ts`:

```typescript
isAttestation(raw: unknown): raw is Attestation
```

### Usage

```typescript
import { isManifest, isAsset, isClaim } from './traceTypes.js';
import { isAttestation } from '../../../../config/utils.js';

function processData(raw: unknown) {
  if (isManifest(raw)) {
    // raw is now typed as Manifest
    console.log(raw.workflow_id);
  }

  if (isAttestation(raw)) {
    // raw is now typed as Attestation
    console.log(raw.issuer);
  }
}
```

## Format Mapping

Adapters translate format-specific concepts into the unified model:

| Source Format | Source Term | Unified Term |
| ------------- | ----------- | ------------ |
| C2PA | Claim Signature | `Attestation` |
| C2PA | Manifest | `Manifest` |
| EQTY | TEE Attestation | `Attestation` |
| EQTY | Enclave Manifest | `Manifest` |
| Custom | Signature Info | `Attestation` |
