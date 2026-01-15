/**
 * Graph controller that encapsulates Sigma initialization and events.
 */
import Sigma from 'sigma';
import { createNodeBorderProgram } from '@sigma/node-border';
import type Graph from 'graphology';
import { loadManifest } from '../../manifest/registry.js';
import { initializeGraph } from '../../graph/graphState.js';
import { renderEdges } from '../../graph/overlays/edges.js';
import { renderNodeOverlays } from '../../graph/overlays/nodes.js';
import {
  calculateStagePositions,
  renderStageLabels,
} from '../../graph/overlays/stageLabels.js';
import { setupLodController } from '../../graph/lod.js';
import { HIDE_EDGES_THRESHOLD } from '../../config/constants.js';
import { getCssVar } from '../../ui/theme.js';
import type { LineageGraph, LineageNodeData } from '../../types.js';

interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

/**
 * UI callbacks invoked by graph interactions and load state changes.
 */
interface GraphControllerCallbacks {
  onNodeSelect: (nodeData: LineageNodeData) => void;
  onStageSelect: (
    stageLabel: string,
    nodes: LineageNodeData[],
    edges: LineageGraph['edges']
  ) => void;
  onSelectionClear: () => void;
  onSimpleViewChange: (isSimple: boolean) => void;
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
  onLoaded: (data: LineageGraph) => void;
  onError: (message: string) => void;
}

export interface GraphController {
  destroy: () => void;
}

/**
 * Inputs required to create a graph controller instance.
 */
interface GraphControllerOptions {
  container: HTMLElement;
  manifestUrl: string;
  callbacks: GraphControllerCallbacks;
}

/**
 * Draws the hover ring for Sigma nodes using theme colors.
 */
function drawHoverRing(
  context: CanvasRenderingContext2D,
  data: {
    x: number;
    y: number;
    size: number;
    color: string;
    borderColor?: string;
  }
): void {
  const size = data.size + 4;
  context.beginPath();
  context.arc(data.x, data.y, size, 0, Math.PI * 2);
  context.closePath();
  context.lineWidth = 2;
  context.strokeStyle =
    data.borderColor ?? getCssVar('--color-hover-ring', '#3b82f6');
  context.stroke();
}

/**
 * Builds a typed node payload from graph attributes.
 */
function buildNodeData(graph: Graph, node: string): LineageNodeData {
  const attrs = graph.getNodeAttributes(node);
  return {
    id: node,
    label: attrs.label as string,
    nodeType: attrs.nodeType as LineageNodeData['nodeType'],
    assetType: attrs.assetType as LineageNodeData['assetType'],
    shape: attrs.shape as LineageNodeData['shape'],
    manifest: attrs.manifest as LineageNodeData['manifest'],
    assetManifest: attrs.assetManifest as LineageNodeData['assetManifest'],
    humanDescription: attrs.humanDescription as string | undefined,
    humanInputs: attrs.humanInputs as string[] | undefined,
    humanOutputs: attrs.humanOutputs as string[] | undefined,
    verifiedBy: attrs.verifiedBy as string | undefined,
    verifiedAt: attrs.verifiedAt as string | undefined,
    duration: attrs.duration as string | undefined,
    tokens: attrs.tokens as LineageNodeData['tokens'],
    environmentalImpact:
      attrs.environmentalImpact as LineageNodeData['environmentalImpact'],
    stage: attrs.stage as string | undefined,
  };
}

/**
 * Initializes Sigma, overlays, and interaction handlers for the graph view.
 */
export async function createGraphController({
  container,
  manifestUrl,
  callbacks,
}: GraphControllerOptions): Promise<GraphController | null> {
  let lineageData: LineageGraph;
  try {
    lineageData = await loadManifest(manifestUrl);
  } catch (error) {
    console.error('Failed to load lineage manifest', error);
    callbacks.onError('Unable to load manifest data.');
    return null;
  }

  callbacks.onLoaded(lineageData);
  const state = initializeGraph(lineageData);
  const { graph } = state;

  const NodeBorderProgram = createNodeBorderProgram({
    borders: [{ size: { value: 0.15 }, color: { attribute: 'borderColor' } }],
  });

  const renderer = new Sigma(graph, container, {
    allowInvalidContainer: true,
    renderLabels: false,
    renderEdgeLabels: false,
    enableEdgeEvents: false,
    labelRenderedSizeThreshold: Infinity,
    zoomingRatio: 1.2,
    defaultNodeColor: getCssVar('--color-node-default', '#ffffff'),
    minCameraRatio: 0.2,
    maxCameraRatio: 4,
    nodeProgramClasses: {
      bordered: NodeBorderProgram,
    },
    defaultNodeType: 'bordered',
    defaultDrawNodeHover: drawHoverRing,
    defaultDrawNodeLabel: () => {},
  });

  let overlayVersion = 0;
  const markOverlayDirty = () => {
    overlayVersion += 1;
  };

  const lod = setupLodController({
    graph,
    renderer,
    lineageData,
    state,
    onModeChange: callbacks.onSimpleViewChange,
    onGraphUpdate: markOverlayDirty,
  });

  const updateOverlays = () => {
    const stagePositions = calculateStagePositions(
      renderer,
      lineageData.stages
    );
    renderStageLabels(stagePositions);

    const ratio = renderer.getCamera().ratio;
    if (ratio < HIDE_EDGES_THRESHOLD) {
      renderEdges(state, renderer);
    } else {
      const edgeContainer = document.getElementById('edge-overlay');
      if (edgeContainer) edgeContainer.innerHTML = '';
    }
    renderNodeOverlays(graph, renderer);
  };

  let overlayFrame: number | null = null;
  let lastOverlayKey = '';
  const scheduleOverlayUpdate = () => {
    if (overlayFrame !== null) return;
    overlayFrame = requestAnimationFrame(() => {
      overlayFrame = null;
      const camera = renderer.getCamera().getState();
      const showEdges = camera.ratio < HIDE_EDGES_THRESHOLD;
      const overlayKey = `${camera.x.toFixed(4)}:${camera.y.toFixed(
        4
      )}:${camera.ratio.toFixed(4)}:${showEdges}:${overlayVersion}`;
      if (overlayKey === lastOverlayKey) return;
      lastOverlayKey = overlayKey;
      updateOverlays();
    });
  };

  const camera = renderer.getCamera();
  camera.on('updated', scheduleOverlayUpdate);
  renderer.on('afterRender', scheduleOverlayUpdate);
  scheduleOverlayUpdate();

  renderer.on('clickNode', ({ node }) => {
    callbacks.onSelectionClear();
    const attrs = graph.getNodeAttributes(node);
    if (lod.isSimpleView() && attrs.nodeType === 'meta') {
      const stageId = attrs.stage as string;
      const stageLabel = attrs.label as string;
      const stageNodes = lineageData.nodes.filter((n) => n.stage === stageId);
      callbacks.onStageSelect(stageLabel, stageNodes, lineageData.edges);
      return;
    }

    callbacks.onNodeSelect(buildNodeData(graph, node));
  });

  renderer.on('clickStage', () => {
    callbacks.onSelectionClear();
  });

  renderer.on('enterNode', ({ node }) => {
    container.style.cursor = 'pointer';
    const attrs = graph.getNodeAttributes(node);
    const pos = renderer.graphToViewport({
      x: attrs.x as number,
      y: attrs.y as number,
    });
    const displayData = renderer.getNodeDisplayData(node);
    const size = displayData?.size ?? 14;
    callbacks.onHover({
      title: (attrs.label as string) || node,
      nodeType: (attrs.nodeType as string) || 'node',
      screenX: pos.x,
      screenY: pos.y,
      size,
    });
  });

  renderer.on('leaveNode', () => {
    container.style.cursor = 'grab';
    callbacks.onHoverEnd();
  });

  camera.setState({ x: 0.5, y: 0.5, ratio: 0.5 });
  renderer.refresh();
  scheduleOverlayUpdate();

  return {
    destroy: () => {
      renderer.kill();
    },
  };
}
