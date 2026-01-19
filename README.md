# Living Content Lineage

Interactive visualization for content lineage and provenance, aligned with the
[C2PA (Coalition for Content Provenance and Authenticity)](https://c2pa.org/)
standard.

## Overview

Visualizes data provenance pipelines as interactive directed graphs. Each node
represents a data asset, computation, or attestation, with edges showing data
flow and transformations.

**Features:**

- **Node types** — Data, Process, Attestation, with visual distinction by color
- **Hierarchical organization** — Lineage → Phases → Workflows → Nodes
- **C2PA metadata** — Nodes carry manifest data including signatures and assertions
- **Level-of-detail** — Zoom out to see collapsed workflow view, zoom in for full detail
- **Environmental impact** — Displays CO2 and energy metrics when available
- **Attestation edges** — Green "gate" connectors show cryptographic verification

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build
```

### Lint & Format

```bash
npm run lint
npm run format
```

## Architecture

```text
src/
├── main.ts                    # Entry point
├── App.svelte                 # Root shell component
├── types.ts                   # Core type definitions
├── config/
│   └── constants.ts           # Rendering constants
├── stores/
│   ├── lineageState.ts        # Graph data and selection state
│   └── uiState.ts             # Loading, panels, errors
├── manifest/
│   ├── registry.ts            # Manifest adapter resolution
│   └── adapters/
│       ├── manifestAdapter.ts # Adapter interface
│       ├── c2pa/              # C2PA standard adapter
│       ├── eqty/              # EQTY variant adapter
│       └── custom/            # Custom manifest adapter
├── services/
│   └── graph/
│       ├── graphController.ts # Main orchestrator
│       ├── nodeRenderer.ts    # Pill-shaped node rendering
│       ├── edgeRenderer.ts    # Edge and arrow rendering
│       ├── metaEdgeRenderer.ts# Collapsed view edges
│       ├── stageLabelRenderer.ts # Stage header labels
│       ├── viewport.ts        # Zoom/pan transforms
│       ├── lodController.ts   # Level-of-detail state
│       └── titleOverlay.ts    # Collapsed view title
├── components/
│   ├── GraphView.svelte       # Canvas container
│   ├── Header.svelte          # Top navigation
│   └── sidebar/
│       ├── SidebarPanel.svelte
│       ├── DetailView.svelte
│       ├── SummaryView.svelte
│       └── ...
└── styles/                    # CSS stylesheets
```

## Tech Stack

- **Svelte 5** — UI framework
- **Pixi.js 8** — WebGL rendering
- **GSAP** — Animations
- **TypeScript** — Type safety
- **Vite** — Build tooling

## Data Format

The visualization consumes manifest JSON files with:

- **workflows** — Collections of nodes within a phase, each with a PhaseType
- **assets** — Data nodes (documents, models, code)
- **computations** — Processing steps with inputs/outputs
- **attestations** — Cryptographic verification records
- **manifests** — C2PA metadata (signatures, assertions)

See `public/data/manifest.json` for an example and `documentation/lineage-hierarchy.md` for the complete type hierarchy.

## License

MIT
