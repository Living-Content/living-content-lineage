/**
 * Builds a lineage graph from mock lineage data.
 * Clean horizontal layout with main flow on one row.
 */

import { mockLineage, MetadataBlob } from "./mockLineage.js";
import type { LineageGraph, LineageNodeData, LineageEdgeData, Stage, C2PAManifest, NodeRole } from "./types.js";
import { assetTypeToNodeType } from "./types.js";

function extractCid(urn: string): string {
  return urn.replace("urn:cid:", "");
}

function getMetadataForSubject(subjectCid: string): MetadataBlob | undefined {
  const metaStatement = mockLineage.statements.metadata.find(
    (m) => m.subject === subjectCid
  );
  if (!metaStatement) return undefined;
  return mockLineage.blobs[metaStatement.metadata];
}

function buildC2PAManifest(blob: MetadataBlob, cid: string): C2PAManifest {
  if (blob.c2pa_manifest) {
    return blob.c2pa_manifest;
  }
  return {
    claim_generator_info: { name: "Living Content", version: "1.0.0" },
    title: blob.name,
    format: blob.format,
    instance_id: cid,
    assertions: [
      {
        label: "c2pa.hash.data",
        data: { alg: "sha256", hash: extractCid(cid).slice(0, 16) + "..." },
      },
    ],
    signature: {
      alg: "ES256",
      issuer: "did:key:zQ3shwc61yUNaJZBX2L9mZd3xhWjTEqD52dA3JxBnZnu78E3d",
      time: new Date().toISOString(),
    },
  };
}

export function createSampleLineageGraph(): LineageGraph {
  const nodes: LineageNodeData[] = [];
  const edges: LineageEdgeData[] = [];

  // Fixed horizontal positions for clean layout
  const X_SPACING = 120;
  const MAIN_ROW_Y = 200;
  const SECONDARY_ROW_Y = 280;

  // Define explicit positions for each node in the pipeline
  // Nodes feeding same computation are stacked vertically
  // NOTE: Sigma.js Y axis: larger Y = UP on screen, smaller Y = DOWN on screen
  const ATTEST_ROW_Y = MAIN_ROW_Y - 100; // Attestation nodes below main flow (smaller Y = down)

  const nodePositions: Record<string, { x: number; y: number; order: number; stage: string }> = {
    // INPUT STAGE (x: 120) - Retrieve History inputs stacked
    // In sigma.js: larger Y = UP, smaller Y = DOWN
    "data-user-query": { x: 120, y: MAIN_ROW_Y + 30, order: 0, stage: "input" },
    "data-session-context": { x: 120, y: MAIN_ROW_Y - 30, order: 1, stage: "input" },

    // RETRIEVE STAGE (x: 280-400)
    "comp-retrieve-history": { x: 280, y: MAIN_ROW_Y, order: 2, stage: "retrieve" },
    "data-retrieved-history": { x: 400, y: MAIN_ROW_Y, order: 3, stage: "retrieve" },

    // GENERATE STAGE (x: 520-760) - Model Config below main flow
    "data-model-config": { x: 520, y: MAIN_ROW_Y - 60, order: 4, stage: "generate" },
    "comp-generate-response": { x: 640, y: MAIN_ROW_Y, order: 5, stage: "generate" },
    "data-generated-response": { x: 760, y: MAIN_ROW_Y, order: 6, stage: "generate" },

    // IMAGE STAGE (x: 880-1000)
    "comp-generate-image": { x: 880, y: MAIN_ROW_Y, order: 7, stage: "image" },
    "data-generated-image": { x: 1000, y: MAIN_ROW_Y, order: 8, stage: "image" },

    // OUTPUT STAGE (x: 1120-1240)
    "comp-save-output": { x: 1120, y: MAIN_ROW_Y, order: 9, stage: "output" },
    "data-final-document": { x: 1240, y: MAIN_ROW_Y, order: 10, stage: "output" },

    // ATTESTATION NODES - below the data they verify
    "attest-retrieve": { x: 400, y: ATTEST_ROW_Y, order: 11, stage: "retrieve" },
    "attest-output": { x: 1240, y: ATTEST_ROW_Y, order: 12, stage: "output" },
  };

  // Create nodes from computations and their inputs/outputs
  const allDataCids = new Set<string>();

  mockLineage.statements.computations.forEach((comp) => {
    comp.input.forEach((i) => allDataCids.add(i));
    comp.output.forEach((o) => allDataCids.add(o));
  });

  // Create data nodes
  allDataCids.forEach((cid) => {
    const blob = getMetadataForSubject(cid);
    const id = extractCid(cid);
    const pos = nodePositions[id] ?? { x: 500, y: 300, order: 99, stage: "unknown" };

    const assetType = blob?.assetType ?? "Data";
    const nodeType = assetTypeToNodeType(assetType);

    const node: LineageNodeData = {
      id,
      label: blob?.name ?? id.slice(0, 12),
      nodeType,
      assetType,
      shape: "circle",
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      description: blob?.description,
      manifest: blob ? buildC2PAManifest(blob, cid) : undefined,
      humanDescription: blob?.humanDescription,
      humanInputs: blob?.humanInputs,
      humanOutputs: blob?.humanOutputs,
      verifiedBy: blob?.verifiedBy,
      verifiedAt: blob?.verifiedAt,
      duration: blob?.duration,
    };

    nodes.push(node);
  });

  // Create computation nodes and edges
  mockLineage.statements.computations.forEach((comp) => {
    const blob = getMetadataForSubject(comp["@id"]);
    const id = extractCid(comp["@id"]);
    const pos = nodePositions[id] ?? { x: 500, y: 300, order: 99, stage: "unknown" };

    const node: LineageNodeData = {
      id,
      label: blob?.name ?? "Compute",
      nodeType: "compute",
      assetType: "Computation",
      shape: "circle",
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      description: blob?.description,
      humanDescription: blob?.humanDescription,
      humanInputs: blob?.humanInputs,
      humanOutputs: blob?.humanOutputs,
      verifiedBy: blob?.verifiedBy,
      verifiedAt: blob?.verifiedAt,
      duration: blob?.duration,
    };

    nodes.push(node);

    // Create edges - first input is primary (simple)
    comp.input.forEach((inputCid, idx) => {
      edges.push({
        id: `e-${extractCid(inputCid)}-${id}`,
        source: extractCid(inputCid),
        target: id,
        color: "#666666",
        isSimple: idx === 0,
      });
    });

    // Output edges are always simple
    comp.output.forEach((outputCid) => {
      edges.push({
        id: `e-${id}-${extractCid(outputCid)}`,
        source: id,
        target: extractCid(outputCid),
        color: "#666666",
        isSimple: true,
      });
    });
  });

  // Create attestation nodes and gate edges
  mockLineage.statements.attestations.forEach((attest) => {
    const blob = getMetadataForSubject(attest["@id"]);
    const id = extractCid(attest["@id"]);
    const pos = nodePositions[id] ?? { x: 500, y: 400, order: 99, stage: "unknown" };

    const node: LineageNodeData = {
      id,
      label: blob?.name ?? "Attest",
      nodeType: "attestation",
      assetType: "Data",
      shape: "circle",
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      description: blob?.description,
      humanDescription: blob?.humanDescription,
      verifiedBy: blob?.verifiedBy,
      verifiedAt: blob?.verifiedAt,
    };

    nodes.push(node);

    // Create gate edges from data nodes to attestation nodes
    attest.verifies.forEach((verifiedCid) => {
      edges.push({
        id: `gate-${extractCid(verifiedCid)}-${id}`,
        source: extractCid(verifiedCid),
        target: id,
        color: "#22c55e", // green for attestation edges
        isSimple: true,
        isGate: true, // mark as gate edge for special rendering
      });
    });
  });

  // Sort nodes by order for consistent rendering
  nodes.sort((a, b) => {
    const posA = nodePositions[a.id];
    const posB = nodePositions[b.id];
    return (posA?.order ?? 99) - (posB?.order ?? 99);
  });

  // Compute node roles based on edge connectivity
  function computeNodeRole(nodeId: string, nodeType: string): NodeRole {
    if (nodeType === "compute") return "compute";

    const hasIncoming = edges.some(e => e.target === nodeId);
    const hasOutgoing = edges.some(e => e.source === nodeId);

    if (!hasIncoming && hasOutgoing) return "source";
    if (hasIncoming && !hasOutgoing) return "sink";
    return "intermediate";
  }

  // Apply roles to all nodes
  nodes.forEach(node => {
    node.role = computeNodeRole(node.id, node.nodeType);
  });

  const stages: Stage[] = [
    { id: "input", label: "Input", xStart: 60, xEnd: 220 },
    { id: "retrieve", label: "Retrieve", xStart: 220, xEnd: 460 },
    { id: "generate", label: "Generate", xStart: 460, xEnd: 820 },
    { id: "image", label: "Image", xStart: 820, xEnd: 1060 },
    { id: "output", label: "Output", xStart: 1060, xEnd: 1300 },
  ];

  return { nodes, edges, stages };
}
