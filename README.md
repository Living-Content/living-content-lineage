# Living Content Lineage

A proof-of-concept visualization for content lineage and provenance using [Sigma.js](https://www.sigmajs.org/), aligned with the [C2PA (Coalition for Content Provenance and Authenticity)](https://c2pa.org/) standard.

## Overview

This project visualizes data provenance pipelines as interactive directed graphs. Each node represents a data asset or computation, with edges showing data flow and transformations. The visualization supports:

- **Multiple node types**: Data, Compute, Attestation, Filter, Join, Store, and Media
- **Stage-based grouping**: Nodes are organized into pipeline stages (Input, Retrieve, Generate, Image, Output)
- **C2PA metadata**: Nodes carry C2PA-aligned manifest data including signatures and assertions
- **Interactive features**: Click nodes to view metadata, pan/zoom navigation, toggle between simple and detailed views
- **Attestation visualization**: Special "gate" connectors show verification relationships

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

## Architecture

```
src/
├── main.ts          # Entry point, Sigma.js setup, rendering logic
├── types.ts         # C2PA-aligned TypeScript types
├── sampleData.ts    # Graph construction from mock lineage data
└── mockLineage.ts   # Sample provenance data
```

## License

MIT
