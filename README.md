# Living Content Tracer

Interactive visualization for content trace and provenance, aligned with the
[C2PA (Coalition for Content Provenance and Authenticity)](https://c2pa.org/)
standard.

## Overview

Visualizes data workflows as interactive directed graphs. Each node represents a
data asset, process, or claim.

**Features:**

- **Node types** — Data, Process, Attestation, with visual distinction by color
- **Hierarchical organization** — Trace → Content Session → Workflow (Phase →
  Step → Nodes)
- **C2PA metadata** — Nodes carry manifest data including claims and assertions
- **Level-of-detail** — Zoom out to see collapsed step view, zoom in for full
  workflow detail
- **Environmental impact** — Displays CO2 and energy metrics when available
- **Attestation edges** — Green "gate" connectors show cryptographic
  verification

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
├── config/
│   ├── types.ts               # Core type definitions
│   └── constants.ts           # Rendering constants
├── stores/
│   ├── traceState.ts          # Graph data and selection state
│   └── uiState.ts             # Loading, panels, errors
├── services/
│   └── manifest/
│       ├── registry.ts        # Manifest adapter resolution
│       └── adapters/
│           ├── manifestAdapter.ts # Adapter interface
│           ├── c2pa/          # C2PA standard adapter
│           ├── eqty/          # EQTY variant adapter
│           └── custom/        # Custom manifest adapter
│   └── graph/
│       ├── engine/
│       │   ├── graphEngine.ts     # Engine interface
│       │   └── graphBootstrap.ts  # Ordered initialization
│       ├── layout/
│       │   ├── lodController.ts   # Level-of-detail transitions
│       │   └── viewportManager.ts # Pan/zoom orchestration
│       └── rendering/
│           ├── nodeRenderer.ts    # Pill-shaped node rendering
│           ├── edgeRenderer.ts    # Edge and arrow rendering
│           └── stepLabelRenderer.ts # Step header labels
├── components/
│   ├── GraphCanvas.svelte     # Canvas container (owner)
│   ├── Header.svelte          # Top navigation
│   └── inspector/
│       ├── InspectorPanel.svelte
│       ├── StepInspector.svelte
│       ├── views/
│       │   ├── SummaryView.svelte
│       │   └── DetailView.svelte
│       └── ...
└── themes/                    # Theme system
```

## Tech Stack

- **Svelte 5** — UI framework
- **Pixi.js 8** — WebGL rendering
- **GSAP** — Animations
- **TypeScript** — Type safety
- **Vite** — Build tooling

## Data Format

The visualization consumes manifest JSON files with:

- **steps** — Collections of nodes within a phase, each with a Step type
- **assets** — Data nodes (documents, models, code)
- **computations** — Processing steps with inputs/outputs
- **attestations** — Cryptographic verification records
- **manifests** — C2PA metadata (claims, assertions)

See `public/data/manifest.json` for an example and
`documentation/trace-hierarchy.md` for the complete type hierarchy.

## License

MIT
