import type {
  AssetManifest,
  AssetType,
  LineageEdgeData,
  LineageGraph,
  LineageManifestSummary,
  LineageNodeData,
  Phase,
} from '../../../../config/types.js';
import { isRecord, validatePhase } from '../../../../config/utils.js';
import { assetTypeToNodeType } from '../../../../config/types.js';
import type { LineageManifest, LineageManifestRecord } from './lineageTypes.js';
import { computeLayout } from './lineageLayout.js';
import { getCssVar } from '../../../../themes/index.js';

const buildManifestSummary = (
  record?: LineageManifestRecord
): LineageManifestSummary | undefined => {
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
};

/**
 * Builds the renderable graph using adapter-provided asset type mapping.
 * Actions are first-class assets with inputs/outputs in their manifests.
 */
export const buildLineageGraph = (
  manifest: LineageManifest,
  assetManifests: Map<string, AssetManifest>,
  mapAssetType: (assetType: string) => AssetType
): LineageGraph => {
  const activeManifestId = manifest.active_manifest;
  const activeManifest = manifest.manifests[activeManifestId];
  const manifestSummary = buildManifestSummary(activeManifest);

  const { positions, workflows } = computeLayout(manifest, assetManifests);
  const nodes: LineageNodeData[] = [];

  // Build workflow-to-phase mapping
  const workflowPhaseMap = new Map<string, Phase>();
  manifest.workflows.forEach((workflow) => {
    const phase = validatePhase(workflow.phase, `workflow ${workflow.id}`);
    workflowPhaseMap.set(workflow.id, phase);
  });

  // Build asset type map for edge classification
  const assetTypes = new Map<string, AssetType>();
  manifest.assets.forEach((asset) => {
    assetTypes.set(asset.id, mapAssetType(asset.asset_type));
  });

  // Create nodes for all assets
  manifest.assets.forEach((asset) => {
    const pos = positions.get(asset.id) ?? { x: 0, y: 200, workflowId: 'unknown' };
    const assetManifest = assetManifests.get(asset.id);
    const mappedAssetType = mapAssetType(asset.asset_type);
    const nodeType = assetTypeToNodeType(mappedAssetType);
    const phase = workflowPhaseMap.get(pos.workflowId);
    if (!phase) throw new Error(`Missing phase for workflow ${pos.workflowId}`);

    nodes.push({
      id: asset.id,
      label: asset.label,
      title: asset.title,
      nodeType,
      assetType: mappedAssetType,
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      workflowId: pos.workflowId,
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

  // Create nodes for attestations
  manifest.attestations.forEach((attest) => {
    const pos = positions.get(attest.id) ?? { x: 0, y: 100, workflowId: 'unknown' };
    const phase = workflowPhaseMap.get(pos.workflowId);
    if (!phase) throw new Error(`Missing phase for workflow ${pos.workflowId}`);
    nodes.push({
      id: attest.id,
      label: attest.label,
      title: attest.title,
      nodeType: 'attestation',
      assetType: 'Attestation',
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      workflowId: pos.workflowId,
      phase,
      description: attest.description,
      role: 'sink',
    });
  });

  // Build edges from Action inputs/outputs
  const edgeList: Array<{ source: string; target: string; isGate?: boolean }> = [];
  const actionSet = new Set<string>();

  // Identify Action assets and build edge connections
  manifest.assets.forEach((asset) => {
    if (mapAssetType(asset.asset_type) === 'Action') {
      actionSet.add(asset.id);
      const actionManifest = assetManifests.get(asset.id);
      const inputs = actionManifest?.inputs ?? [];
      const outputs = actionManifest?.outputs ?? [];

      // Connect inputs to this Action
      inputs.forEach((inputId) => {
        edgeList.push({ source: inputId, target: asset.id });
      });

      // Connect this Action to outputs
      outputs.forEach((outputId) => {
        edgeList.push({ source: asset.id, target: outputId });
      });
    }
  });

  // Add attestation edges
  manifest.attestations.forEach((attest) => {
    attest.verifies.forEach((verifiedId) => {
      edgeList.push({ source: verifiedId, target: attest.id, isGate: true });
    });
  });

  // Determine node roles based on edge connections
  nodes.forEach((node) => {
    if (node.nodeType === 'attestation' || actionSet.has(node.id)) return;
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
  const edges: LineageEdgeData[] = edgeList.map((edge, idx) => ({
    id: `e-${idx}`,
    source: edge.source,
    target: edge.target,
    color: edgeColor,
    isSimple: true,
    isGate: edge.isGate ?? false,
  }));

  return {
    title: manifest.title,
    lineageId: manifest.lineage_id,
    nodes,
    edges,
    workflows
  };
}
