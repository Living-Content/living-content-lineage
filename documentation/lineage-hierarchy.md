# Conceptual Hierarchy

The lineage visualization represents provenance data using a hierarchical model.

## Hierarchy

```plaintext
Lineage (overarching concept)
└── Content Session (UUID4) - zoomed out view
    └── Workflow (UUID4) - one execution/query
        ├── Phase: Acquisition
        │   └── Step: ingest → Nodes
        ├── Phase: Preparation
        │   └── Step: select → Nodes
        ├── Phase: Retrieval
        │   ├── Step: retrieve → Nodes
        │   └── Step: search → Nodes
        ├── Phase: Reasoning
        │   ├── Step: reflect → Nodes
        │   ├── Step: plan → Nodes
        │   └── Step: evaluate → Nodes
        ├── Phase: Generation
        │   └── Step: generate → Nodes
        └── Phase: Persistence
            └── Step: store → Nodes
```

## Zoom Levels

| Level | View           | Description                              |
| ----- | -------------- | ---------------------------------------- |
| 0     | Workflow View  | Individual nodes visible, full detail    |
| 1     | Step View      | Collapsed step nodes, colored by phase   |
| 2     | Phase View     | Collapsed phases (future)                |
| 3     | Session View   | Content session overview (future)        |

## Types

| Concept              | Type Name            | Description                                                                                  |
| -------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| Phase                | `Phase`              | 6 values: Acquisition, Preparation, Retrieval, Reasoning, Generation, Persistence           |
| Step                 | `Step`               | Operation types: ingest, select, transform, validate, retrieve, search, reflect, plan, etc. |
| Step UI              | `StepUI`             | Layout bounds for a step in the visualization                                                |
| Node                 | `LineageNodeData`    | Individual graph element                                                                     |
| Asset Type           | `AssetType`          | Content types: Media, Document, Result, Dataset, Code, Model, Action, Claim                  |
| Node Type            | `NodeType`           | Visual categories: data, process, claim, store, media, workflow                              |
| Attestation Type     | `AttestationType`    | Proof mechanism: merkle, certificate, tee                                                    |
| Attestation Provider | `AttestationProvider`| Proof provider: EQTY, C2PA, LCO                                                              |

## Relationships

- A **Lineage** contains multiple **Content Sessions**
- Each **Content Session** contains multiple **Workflows**
- Each **Workflow** contains multiple **Phases**
- Each **Phase** contains multiple **Steps**
- Each **Step** contains multiple **Nodes**
- Each **Node** has an **AssetType** and renders as a **NodeType**
- Each **Node** belongs to exactly one **Step** and one **Phase**

## Terminology

This is a **format-agnostic abstraction layer** that maps multiple standards (C2PA, EQTY, custom) into a unified model.

| Term          | Description                                                    |
| ------------- | -------------------------------------------------------------- |
| **Claim**     | A verification node in the lineage graph (not C2PA's "Claim")  |
| **Attestation** | Cryptographic proof backing a signed manifest                |

Adapters translate format-specific concepts into this unified model:
- C2PA "Claim Signature" → `Attestation`
- EQTY TEE Attestation → `Attestation`

## Attestation Model

Attestations are cryptographic proofs that can be:
- **TEE** — Trusted Execution Environment attestation
- **Certificate** — Verifiable Credentials / X.509
- **Merkle** — LCO merkle tree proofs

Each has a **Provider**: EQTY, C2PA, or LCO

```typescript
interface Attestation {
  alg: string;
  issuer: string;
  time: string;
  type?: 'merkle' | 'certificate' | 'tee';
  provider?: 'EQTY' | 'C2PA' | 'LCO';
}
```
