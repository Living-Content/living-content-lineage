import type {
  AssetManifest,
  AssetType,
  LineageEdgeData,
  LineageGraph,
  LineageManifestSummary,
  LineageNodeData,
} from '../../../types.js';
import type { LineageManifest, LineageManifestRecord } from './lineageTypes.js';
import { computeLayout } from './lineageLayout.js';
import { getCssVar } from '../../../ui/theme.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function buildManifestSummary(
  record?: LineageManifestRecord
): LineageManifestSummary | undefined {
  if (!record) return undefined;
  const claimGeneratorInfo = Array.isArray(record.claim_generator_info)
    ? record.claim_generator_info.map((info) => ({
        name: info.name,
        version: info.version,
      }))
    : undefined;
  const assertions = Array.isArray(record.assertions)
    ? record.assertions.map((assertion) => ({
        label: assertion.label,
        data: assertion.data,
      }))
    : undefined;
  const signatureInfo = isRecord(record.signature_info)
    ? {
        alg: String(record.signature_info.alg ?? ''),
        issuer: String(record.signature_info.issuer ?? ''),
        time: String(record.signature_info.time ?? ''),
      }
    : undefined;
  return {
    claimGeneratorInfo,
    title: record.title,
    format: record.format,
    instanceId: record.instance_id,
    assertions,
    signatureInfo,
  };
}

// Builds the renderable graph using adapter-provided asset type mapping.
export function buildLineageGraph(
  manifest: LineageManifest,
  assetManifests: Map<string, AssetManifest>,
  mapAssetType: (assetType: string) => AssetType
): LineageGraph {
  const activeManifestId = manifest.active_manifest;
  const activeManifest = manifest.manifests[activeManifestId];
  const manifestSummary = buildManifestSummary(activeManifest);

  const { positions, stages } = computeLayout(manifest);
  const nodes: LineageNodeData[] = [];

  manifest.assets.forEach((asset) => {
    const pos = positions.get(asset.id) ?? { x: 0, y: 200, stage: 'unknown' };
    const assetManifest = assetManifests.get(asset.id);
    nodes.push({
      id: asset.id,
      label: asset.label,
      nodeType: 'data',
      assetType: mapAssetType(asset.asset_type),
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      humanDescription: asset.description,
      assetManifest,
      tokens: asset.tokens,
      environmentalImpact: assetManifest?.environmentalImpact,
      manifest: manifestSummary
        ? {
            ...manifestSummary,
            title: asset.label,
          }
        : undefined,
    });
  });

  manifest.computations.forEach((comp) => {
    const pos = positions.get(comp.id) ?? { x: 0, y: 200, stage: 'unknown' };
    nodes.push({
      id: comp.id,
      label: comp.label,
      nodeType: 'process',
      assetType: 'Action',
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      humanDescription: comp.description,
      duration: comp.duration,
      role: 'process',
    });
  });

  manifest.attestations.forEach((attest) => {
    const pos = positions.get(attest.id) ?? { x: 0, y: 100, stage: 'unknown' };
    nodes.push({
      id: attest.id,
      label: attest.label,
      nodeType: 'attestation',
      assetType: 'Attestation',
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      humanDescription: attest.description,
      role: 'sink',
    });
  });

  const edgeList: Array<{ source: string; target: string; isGate?: boolean }> =
    [];

  // Build a set of computation IDs for filtering
  const compSet = new Set(manifest.computations.map((c) => c.id));

  // Build asset type map
  const assetTypes = new Map<string, string>();
  manifest.assets.forEach((asset) => {
    assetTypes.set(asset.id, asset.asset_type);
  });

  // Track which assets are produced by computations
  const assetProducer = new Map<string, string>();
  manifest.computations.forEach((comp) => {
    comp.outputs.forEach((id) => assetProducer.set(id, comp.id));
  });

  manifest.computations.forEach((comp) => {
    // Separate inputs into categories
    const dataInputs = comp.inputs.filter((id) => !compSet.has(id));
    const sourceInputs = dataInputs.filter((id) => !assetProducer.has(id));

    // Auxiliary inputs (models, code) - these stack vertically below the computation
    const auxiliaryInputs = sourceInputs.filter((id) => {
      const type = assetTypes.get(id);
      return type === 'Code' || type === 'Model';
    });

    // Regular data inputs - connect directly to computation
    const regularInputs = dataInputs.filter(
      (id) => !auxiliaryInputs.includes(id)
    );

    // Regular inputs connect directly to computation
    regularInputs.forEach((inputId) => {
      edgeList.push({ source: inputId, target: comp.id });
    });

    // Chain auxiliary inputs: bottom → ... → top → computation
    // Layout places index 0 closest to computation (top), higher indices below
    if (auxiliaryInputs.length > 0) {
      // First auxiliary (closest to comp) connects to computation
      edgeList.push({
        source: auxiliaryInputs[0],
        target: comp.id,
      });

      // Chain remaining: each connects to the one above it
      for (let i = 1; i < auxiliaryInputs.length; i++) {
        edgeList.push({
          source: auxiliaryInputs[i],
          target: auxiliaryInputs[i - 1],
        });
      }
    }

    // Outputs connect from computation
    comp.outputs.forEach((outputId) => {
      edgeList.push({ source: comp.id, target: outputId });
    });
  });

  manifest.attestations.forEach((attest) => {
    attest.verifies.forEach((verifiedId) => {
      edgeList.push({ source: verifiedId, target: attest.id, isGate: true });
    });
  });

  nodes.forEach((node) => {
    if (node.nodeType !== 'data') return;
    const hasIncoming = edgeList.some(
      (edge) => edge.target === node.id && !edge.isGate
    );
    const hasOutgoing = edgeList.some(
      (edge) => edge.source === node.id && !edge.isGate
    );
    if (!hasIncoming && hasOutgoing) node.role = 'source';
    else if (hasIncoming && !hasOutgoing) node.role = 'sink';
    else node.role = 'intermediate';
  });

  const gateColor = getCssVar('--color-edge-gate', '#22c55e');
  const edgeColor = getCssVar('--color-edge-muted', '#666666');
  const edges: LineageEdgeData[] = edgeList.map((edge, idx) => ({
    id: `e-${idx}`,
    source: edge.source,
    target: edge.target,
    color: edge.isGate ? gateColor : edgeColor,
    isSimple: true,
    isGate: edge.isGate ?? false,
  }));

  return { nodes, edges, stages };
}
