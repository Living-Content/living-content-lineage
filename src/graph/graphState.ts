import Graph from 'graphology';
import type { LineageEdgeData, LineageGraph } from '../types.js';
import {
  ASSET_TYPE_COLORS,
  ATTESTATION_NODE_SIZE,
  DEFAULT_NODE_SIZE,
  NODE_STYLES,
} from '../ui/theme.js';

export interface GraphState {
  graph: Graph;
  allEdges: LineageEdgeData[];
  simpleEdges: LineageEdgeData[];
  showAllEdges: boolean;
}

export function initializeGraph(lineageData: LineageGraph): GraphState {
  const graph = new Graph();

  lineageData.nodes.forEach((node) => {
    const style = NODE_STYLES[node.nodeType] ?? {
      color: '#ffffff',
      borderColor: '#333333',
      iconColor: '#333333',
    };
    const borderColor =
      node.assetType &&
      ASSET_TYPE_COLORS[node.assetType] &&
      node.nodeType !== 'attestation' &&
      node.nodeType !== 'compute'
        ? ASSET_TYPE_COLORS[node.assetType]!
        : style.borderColor;

    graph.addNode(node.id, {
      x: node.x ?? 0,
      y: node.y ?? 0,
      size:
        node.nodeType === 'attestation'
          ? ATTESTATION_NODE_SIZE
          : DEFAULT_NODE_SIZE,
      color: style.color,
      borderColor,
      iconColor: style.iconColor,
      borderSize: 0.15,
      label: node.label,
      nodeType: node.nodeType,
      assetType: node.assetType,
      shape: node.shape,
      stage: node.stage,
      manifest: node.manifest,
      assetManifest: node.assetManifest,
      role: node.role,
      type: 'bordered',
      humanDescription: node.humanDescription,
      humanInputs: node.humanInputs,
      humanOutputs: node.humanOutputs,
      verifiedBy: node.verifiedBy,
      verifiedAt: node.verifiedAt,
      duration: node.duration,
      tokens: node.tokens,
      environmentalImpact: node.environmentalImpact,
    });
  });

  const allEdges = lineageData.edges;
  const simpleEdges = allEdges.filter((edge) => edge.isSimple);

  return { graph, allEdges, simpleEdges, showAllEdges: true };
}
