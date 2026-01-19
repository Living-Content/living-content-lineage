# Conceptual Hierarchy

The lineage visualization represents provenance data using a hierarchical model.

## Hierarchy

A **Lineage** is the complete provenance graph containing:

- **Phases** — High-level categories that organize the pipeline
- **Workflows** — Collections of related nodes within a phase
- **Nodes** — Individual graph elements representing data, processes, or attestations

```plaintext
Lineage
├── Phase: Acquisition
│   └── Workflow (PhaseType: ingest)
│       └── Nodes: [data-user-query, comp-consume-query, ...]
├── Phase: Preparation
│   └── Workflow (PhaseType: select)
│       └── Nodes: [...]
├── Phase: Retrieval
│   ├── Workflow (PhaseType: retrieve)
│   │   └── Nodes: [...]
│   └── Workflow (PhaseType: search)
│       └── Nodes: [...]
├── Phase: Reasoning
│   ├── Workflow (PhaseType: reflect)
│   ├── Workflow (PhaseType: plan)
│   └── Workflow (PhaseType: evaluate)
├── Phase: Generation
│   └── Workflow (PhaseType: generate)
└── Phase: Persistence
    └── Workflow (PhaseType: store)
```

## Types

| Concept    | Type Name         | Description                                                                                                               |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Phase      | `Phase`           | 6 values: Acquisition, Preparation, Retrieval, Reasoning, Generation, Persistence                                         |
| Phase Type | `PhaseType`       | Operation types: ingest, select, transform, validate, retrieve, search, reflect, plan, evaluate, generate, store, publish |
| Workflow   | `Workflow`        | A named collection of nodes belonging to a phase                                                                          |
| Node       | `LineageNodeData` | Individual graph element                                                                                                  |
| Asset Type | `AssetType`       | Content types: Media, Document, Result, Dataset, Code, Model, Action, Attestation, Credential                              |
| Node Type  | `NodeType`        | Visual categories: data, process, attestation, store, media, workflow                                                     |

## Relationships

- Each **Lineage** contains multiple **Phases**
- Each **Phase** contains multiple **Workflows**
- Each **Workflow** contains multiple **Nodes**
- Each **Node** has an **AssetType** and renders as a **NodeType**
- Each **Workflow** has a **PhaseType** indicating its operation
