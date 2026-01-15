import type {
  AssetManifest,
  LineageEdgeData,
  LineageGraph,
  LineageManifestSummary,
  LineageNodeData,
} from '../../../types.js';
import type { LineageManifest, LineageManifestRecord } from './lineageTypes.js';
import { mapAssetType } from './assetManifestMapper.js';
import { computeLayout } from './lineageLayout.js';

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

export function buildLineageGraph(
  manifest: LineageManifest,
  assetManifests: Map<string, AssetManifest>
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
      nodeType: 'compute',
      assetType: 'Computation',
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      stage: pos.stage,
      humanDescription: comp.description,
      duration: comp.duration,
      role: 'compute',
    });
  });

  manifest.attestations.forEach((attest) => {
    const pos = positions.get(attest.id) ?? { x: 0, y: 100, stage: 'unknown' };
    nodes.push({
      id: attest.id,
      label: attest.label,
      nodeType: 'attestation',
      assetType: 'Data',
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

  manifest.computations.forEach((comp) => {
    comp.inputs.forEach((inputId) => {
      edgeList.push({ source: inputId, target: comp.id });
    });
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

  const edges: LineageEdgeData[] = edgeList.map((edge, idx) => ({
    id: `e-${idx}`,
    source: edge.source,
    target: edge.target,
    color: edge.isGate ? '#22c55e' : '#666666',
    isSimple: true,
    isGate: edge.isGate ?? false,
  }));

  return { nodes, edges, stages };
}
