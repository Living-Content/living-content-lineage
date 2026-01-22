import type {
  AssetManifest,
  AssetType,
  TraceEdgeData,
  Trace,
  TraceManifestSummary,
  TraceNodeData,
  Phase,
} from '../../../../config/types.js';
import { validatePhase } from '../../../../config/utils.js';
import { assetTypeToNodeType } from '../../../../config/types.js';
import type { Manifest, SignedManifest } from './traceTypes.js';
import { computeLayout } from './traceLayout.js';
import { getCssVar } from '../../../../themes/index.js';

const buildManifestSummary = (
  record?: SignedManifest
): TraceManifestSummary | undefined => {
  if (!record) return undefined;
  const claimGeneratorInfo = Array.isArray(record.claimGeneratorInfo)
    ? record.claimGeneratorInfo.map((info) => ({
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
  const attestation = record.attestation
    ? {
        alg: String(record.attestation.alg ?? ''),
        issuer: String(record.attestation.issuer ?? ''),
        time: String(record.attestation.time ?? ''),
        type: record.attestation.type,
        provider: record.attestation.provider,
      }
    : undefined;
  return {
    claimGeneratorInfo,
    title: record.title,
    format: record.format,
    instanceId: record.instanceId,
    assertions,
    attestation,
  };
};

/**
 * Builds a renderable trace using adapter-provided asset type mapping.
 * Actions are first-class assets with inputs/outputs in their manifests.
 */
export const buildTrace = (
  manifest: Manifest,
  assetManifests: Map<string, AssetManifest>,
  claimManifests: Map<string, unknown>,
  mapAssetType: (assetType: string) => AssetType
): Trace => {
  const activeManifestId = manifest.activeManifest;
  const activeManifest = manifest.manifests[activeManifestId];
  const manifestSummary = buildManifestSummary(activeManifest);

  const { positions, steps } = computeLayout(manifest);
  const nodes: TraceNodeData[] = [];

  // Build step-to-phase mapping
  const stepPhaseMap = new Map<string, Phase>();
  manifest.steps.forEach((step) => {
    const phase = validatePhase(step.phase, `step ${step.id}`);
    stepPhaseMap.set(step.id, phase);
  });

  // Build asset type map for edge classification
  const assetTypes = new Map<string, AssetType>();
  manifest.assets.forEach((asset) => {
    assetTypes.set(asset.id, mapAssetType(asset.assetType));
  });

  // Create nodes for all assets
  manifest.assets.forEach((asset) => {
    if (!asset.step) {
      throw new Error(`Asset ${asset.id} missing step`);
    }
    const pos = positions.get(asset.id);
    if (!pos) {
      throw new Error(`Asset ${asset.id} missing position`);
    }
    const stepId = asset.step;
    const assetManifest = assetManifests.get(asset.id);
    const mappedAssetType = mapAssetType(asset.assetType);
    const nodeType = assetTypeToNodeType(mappedAssetType);
    const phase = stepPhaseMap.get(stepId);
    if (!phase) throw new Error(`Missing phase for step ${stepId}`);

    nodes.push({
      id: asset.id,
      label: asset.label,
      title: asset.title,
      nodeType,
      assetType: mappedAssetType,
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      step: stepId,
      phase,
      description: asset.description,
      assetManifest,
      environmentalImpact: assetManifest?.environmentalImpact,
      role: mappedAssetType === 'Action' ? 'process' : undefined,
      manifest: manifestSummary
        ? {
            ...manifestSummary,
            title: asset.label,
          }
        : undefined,
    });
  });

  // Create nodes for claims
  manifest.claims.forEach((claim) => {
    if (!claim.step) {
      throw new Error(`Claim ${claim.id} missing step`);
    }
    const pos = positions.get(claim.id);
    if (!pos) {
      throw new Error(`Claim ${claim.id} missing position`);
    }
    const stepId = claim.step;
    const phase = stepPhaseMap.get(stepId);
    if (!phase) throw new Error(`Missing phase for step ${stepId}`);
    const claimManifest = claimManifests.get(claim.id);
    nodes.push({
      id: claim.id,
      label: claim.label,
      title: claim.title,
      nodeType: 'claim',
      assetType: 'Claim',
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      step: stepId,
      phase,
      description: claim.description,
      role: 'sink',
      claimManifest,
    });
  });

  // Build edges from asset inputs/outputs
  const edgeSet = new Set<string>();
  const edgeList: Array<{ source: string; target: string; isGate?: boolean }> = [];
  const actionSet = new Set<string>();

  const addEdge = (source: string, target: string, isGate?: boolean) => {
    const key = `${source}->${target}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edgeList.push({ source, target, isGate });
    }
  };

  // First pass: identify Actions
  manifest.assets.forEach((asset) => {
    if (mapAssetType(asset.assetType) === 'Action') {
      actionSet.add(asset.id);
    }
  });

  // Second pass: build edge connections from all assets
  manifest.assets.forEach((asset) => {
    const assetManifest = assetManifests.get(asset.id);
    const inputs = asset.inputs ?? assetManifest?.inputs ?? [];
    const outputs = asset.outputs ?? assetManifest?.outputs ?? [];

    // Connect inputs to this asset
    inputs.forEach((inputId) => {
      addEdge(inputId, asset.id);
    });

    // Connect this asset to outputs
    outputs.forEach((outputId) => {
      addEdge(asset.id, outputId);
    });
  });

  // Add attestation edges
  manifest.claims.forEach((attest) => {
    attest.verifies.forEach((verifiedId) => {
      addEdge(verifiedId, attest.id, true);
    });
  });

  // Determine node roles based on edge connections
  nodes.forEach((node) => {
    if (node.nodeType === 'claim' || actionSet.has(node.id)) return;
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

  const edgeColor = getCssVar('--color-edge');
  const edges: TraceEdgeData[] = edgeList.map((edge, idx) => ({
    id: `e-${idx}`,
    source: edge.source,
    target: edge.target,
    color: edgeColor,
    isSimple: true,
    isGate: edge.isGate ?? false,
  }));

  return {
    title: manifest.title,
    workflowId: manifest.workflowId,
    contentSessionId: manifest.contentSessionId,
    nodes,
    edges,
    steps,
  };
}
