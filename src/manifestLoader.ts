/**
 * C2PA Manifest Loader
 * Loads C2PA manifest JSON and computes DAG layout automatically.
 */

import type { LineageGraph, LineageNodeData, LineageEdgeData, Stage, AssetManifest } from "./types.js";

interface C2PAStage {
  id: string;
  label: string;
}

interface C2PAComputation {
  id: string;
  label: string;
  stage: string;
  description?: string;
  duration?: string;
  inputs: string[];
  outputs: string[];
}

interface C2PAAsset {
  id: string;
  label: string;
  asset_type: string;
  description?: string;
  manifest_url?: string;
  tokens?: { input: number; output: number };
}

interface C2PAAttestation {
  id: string;
  label: string;
  stage: string;
  verifies: string[];
  description?: string;
}

interface C2PAManifest {
  active_manifest: string;
  manifests: Record<string, {
    claim_generator: string;
    claim_generator_info: Array<{ name: string; version: string }>;
    title: string;
    format: string;
    instance_id: string;
    assertions: Array<{ label: string; data: unknown }>;
    signature_info: {
      alg: string;
      issuer: string;
      time: string;
    };
  }>;
  stages: C2PAStage[];
  computations: C2PAComputation[];
  assets: C2PAAsset[];
  attestations: C2PAAttestation[];
}

function mapAssetType(assetType: string): LineageNodeData["assetType"] {
  const mapping: Record<string, LineageNodeData["assetType"]> = {
    Model: "Model",
    Code: "Code",
    Computation: "Computation",
    Data: "Data",
    Document: "Document",
    Dataset: "Dataset",
    Media: "Media",
  };
  return mapping[assetType] ?? "Data";
}

interface LayoutResult {
  positions: Map<string, { x: number; y: number; stage: string }>;
  stages: Stage[];
}

/**
 * Compute DAG layout from graph relationships.
 * Positions nodes based on flow, then calculates stage boundaries around them.
 */
function computeLayout(
  manifest: C2PAManifest
): LayoutResult {
  const positions = new Map<string, { x: number; y: number; stage: string }>();

  // Spacing constants (relative units)
  const nodeSpacingX = 0.08;  // horizontal gap between nodes
  const nodeSpacingY = 0.06;  // vertical spacing for fan-in/out
  const attestOffset = 0.1;   // Y offset for attestations

  // Track computation IDs
  const compSet = new Set(manifest.computations.map(c => c.id));

  // Build a map of which computation produces each asset
  const assetProducer = new Map<string, string>();
  manifest.computations.forEach(comp => {
    comp.outputs.forEach(id => assetProducer.set(id, comp.id));
  });

  // Build a map of asset types for positioning
  const assetTypes = new Map<string, string>();
  manifest.assets.forEach(asset => {
    assetTypes.set(asset.id, asset.asset_type);
  });

  // Position nodes left-to-right based on flow
  let currentX = 0.05;  // start with small margin
  const placedAssets = new Set<string>();

  manifest.computations.forEach(comp => {
    // Get source inputs (data not produced by other computations)
    const dataInputs = comp.inputs.filter(id => !compSet.has(id));
    const sourceInputs = dataInputs.filter(id => !assetProducer.has(id) && !placedAssets.has(id));

    // Separate auxiliary inputs (code/model) from data inputs
    const auxiliaryInputs = sourceInputs.filter(id => {
      const type = assetTypes.get(id);
      return type === 'Code' || type === 'Model';
    });
    const dataSourceInputs = sourceInputs.filter(id => {
      const type = assetTypes.get(id);
      return type !== 'Code' && type !== 'Model';
    });

    // Position data source inputs on the main flow line
    if (dataSourceInputs.length > 0) {
      const totalHeight = (dataSourceInputs.length - 1) * nodeSpacingY;
      const startY = 0.5 - totalHeight / 2;

      dataSourceInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: startY + idx * nodeSpacingY,
          stage: comp.stage,
        });
        placedAssets.add(inputId);
      });
      currentX += nodeSpacingX;
    }

    // Position auxiliary inputs (code/model) slightly above the computation
    if (auxiliaryInputs.length > 0) {
      const auxSpacing = 0.04;
      // Stack them above the main flow line, closer together
      auxiliaryInputs.forEach((inputId, idx) => {
        positions.set(inputId, {
          x: currentX,
          y: 0.5 - 0.05 - idx * auxSpacing, // Start just above 0.5
          stage: comp.stage,
        });
        placedAssets.add(inputId);
      });
    }

    // Position computation
    positions.set(comp.id, {
      x: currentX,
      y: 0.5,
      stage: comp.stage,
    });
    currentX += nodeSpacingX;

    // Position outputs
    const outputs = comp.outputs.filter(id => !placedAssets.has(id));
    if (outputs.length > 0) {
      const totalHeight = (outputs.length - 1) * nodeSpacingY;
      const startY = 0.5 - totalHeight / 2;

      outputs.forEach((outputId, idx) => {
        positions.set(outputId, {
          x: currentX,
          y: startY + idx * nodeSpacingY,
          stage: comp.stage,
        });
        placedAssets.add(outputId);
      });
      currentX += nodeSpacingX;
    }
  });

  // Position attestations below what they verify
  manifest.attestations.forEach(attest => {
    const verifiedId = attest.verifies[0];
    const verifiedPos = positions.get(verifiedId);

    if (verifiedPos) {
      positions.set(attest.id, {
        x: verifiedPos.x,
        y: verifiedPos.y + attestOffset,
        stage: attest.stage,
      });
    }
  });

  // Calculate stage boundaries based on actual node positions
  const stageMinX = new Map<string, number>();
  const stageMaxX = new Map<string, number>();

  positions.forEach((pos, nodeId) => {
    const stage = pos.stage;
    if (!stageMinX.has(stage) || pos.x < stageMinX.get(stage)!) {
      stageMinX.set(stage, pos.x);
    }
    if (!stageMaxX.has(stage) || pos.x > stageMaxX.get(stage)!) {
      stageMaxX.set(stage, pos.x);
    }
  });

  // Build stages with boundaries that wrap around their nodes
  const padding = nodeSpacingX / 2;
  const stages: Stage[] = manifest.stages.map((stage) => {
    const minX = stageMinX.get(stage.id) ?? 0;
    const maxX = stageMaxX.get(stage.id) ?? 0;
    return {
      id: stage.id,
      label: stage.label,
      xStart: minX - padding,
      xEnd: maxX + padding,
    };
  });

  return { positions, stages };
}

export async function loadManifest(url: string): Promise<LineageGraph> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.statusText}`);
  }

  const manifest: C2PAManifest = await response.json();

  // Get base URL for resolving relative manifest_url paths
  const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

  // Fetch individual asset manifests in parallel
  const assetManifests = new Map<string, AssetManifest>();
  const fetchPromises = manifest.assets
    .filter(asset => asset.manifest_url)
    .map(async (asset) => {
      try {
        const manifestUrl = asset.manifest_url!.startsWith('./')
          ? baseUrl + asset.manifest_url!.slice(2)
          : asset.manifest_url!;
        const res = await fetch(manifestUrl);
        if (res.ok) {
          const assetManifest = await res.json() as AssetManifest;
          assetManifests.set(asset.id, assetManifest);
        }
      } catch (e) {
        console.warn(`Failed to load asset manifest for ${asset.id}:`, e);
      }
    });

  await Promise.all(fetchPromises);

  return parseManifest(manifest, assetManifests);
}

export function parseManifest(
  manifest: C2PAManifest,
  assetManifests: Map<string, AssetManifest> = new Map()
): LineageGraph {
  const activeManifestId = manifest.active_manifest;
  const activeManifest = manifest.manifests[activeManifestId];

  // Compute layout
  const { positions, stages } = computeLayout(manifest);

  // Build nodes
  const nodes: LineageNodeData[] = [];

  // Add asset nodes
  manifest.assets.forEach(asset => {
    const pos = positions.get(asset.id) ?? { x: 0, y: 200, stage: "unknown" };
    const assetManifest = assetManifests.get(asset.id);
    nodes.push({
      id: asset.id,
      label: asset.label,
      nodeType: "data",
      assetType: mapAssetType(asset.asset_type),
      shape: "circle",
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      humanDescription: asset.description,
      assetManifest,
      tokens: asset.tokens,
      manifest: activeManifest ? {
        claim_generator_info: {
          name: activeManifest.claim_generator_info[0]?.name ?? "Unknown",
          version: activeManifest.claim_generator_info[0]?.version ?? "0.0.0",
        },
        title: asset.label,
        format: assetManifest?.format ?? "application/json",
        instance_id: asset.id,
        assertions: assetManifest?.assertions ?? [],
        signature: {
          alg: assetManifest?.signature_info?.alg ?? activeManifest.signature_info.alg,
          issuer: assetManifest?.signature_info?.issuer ?? activeManifest.signature_info.issuer,
          time: assetManifest?.signature_info?.time ?? activeManifest.signature_info.time,
        },
      } : undefined,
    });
  });

  // Add computation nodes
  manifest.computations.forEach(comp => {
    const pos = positions.get(comp.id) ?? { x: 0, y: 200, stage: "unknown" };
    nodes.push({
      id: comp.id,
      label: comp.label,
      nodeType: "compute",
      assetType: "Computation",
      shape: "circle",
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      humanDescription: comp.description,
      duration: comp.duration,
      role: "compute",
    });
  });

  // Add attestation nodes
  manifest.attestations.forEach(attest => {
    const pos = positions.get(attest.id) ?? { x: 0, y: 100, stage: "unknown" };
    nodes.push({
      id: attest.id,
      label: attest.label,
      nodeType: "attestation",
      assetType: "Data",
      shape: "circle",
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      humanDescription: attest.description,
      role: "sink",
    });
  });

  // Compute roles for data nodes
  const compSet = new Set(manifest.computations.map(c => c.id));
  const edgeList: Array<{ source: string; target: string; isGate?: boolean }> = [];

  manifest.computations.forEach(comp => {
    comp.inputs.forEach(inputId => {
      edgeList.push({ source: inputId, target: comp.id });
    });
    comp.outputs.forEach(outputId => {
      edgeList.push({ source: comp.id, target: outputId });
    });
  });

  manifest.attestations.forEach(attest => {
    attest.verifies.forEach(verifiedId => {
      edgeList.push({ source: verifiedId, target: attest.id, isGate: true });
    });
  });

  nodes.forEach(node => {
    if (node.nodeType === "data") {
      const hasIncoming = edgeList.some(e => e.target === node.id && !e.isGate);
      const hasOutgoing = edgeList.some(e => e.source === node.id && !e.isGate);
      if (!hasIncoming && hasOutgoing) node.role = "source";
      else if (hasIncoming && !hasOutgoing) node.role = "sink";
      else node.role = "intermediate";
    }
  });

  // Build edges
  const edges: LineageEdgeData[] = edgeList.map((e, idx) => ({
    id: `e-${idx}`,
    source: e.source,
    target: e.target,
    color: e.isGate ? "#22c55e" : "#666666",
    isSimple: true,
    isGate: e.isGate ?? false,
  }));

  return { nodes, edges, stages };
}
