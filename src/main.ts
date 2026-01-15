import Sigma from 'sigma';
import { createNodeBorderProgram } from '@sigma/node-border';
import { loadManifest } from './manifest/registry.js';
import { initializeGraph } from './graph/graphState.js';
import { renderEdges } from './graph/overlays/edges.js';
import { renderNodeOverlays } from './graph/overlays/nodes.js';
import {
  calculateStagePositions,
  renderStageLabels,
} from './graph/overlays/stageLabels.js';
import { createSidebarController } from './ui/sidebar/controller.js';
import { setupLodController } from './graph/lod.js';
import { HIDE_EDGES_THRESHOLD } from './config/constants.js';
import type { LineageNodeData } from './types.js';

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
  context.strokeStyle = data.borderColor ?? '#3b82f6';
  context.stroke();
}

async function main(): Promise<void> {
  const container = document.getElementById('sigma-container');
  if (!container) {
    console.error('Could not find sigma container');
    return;
  }

  const lineageData = await loadManifest('/data/manifest.json');
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
    defaultNodeColor: '#ffffff',
    minCameraRatio: 0.2,
    maxCameraRatio: 4,
    nodeProgramClasses: {
      bordered: NodeBorderProgram,
    },
    defaultNodeType: 'bordered',
    defaultDrawNodeHover: drawHoverRing,
    defaultDrawNodeLabel: () => {},
  });

  const sidebar = createSidebarController();

  const lodIcon = document.getElementById(
    'lod-icon'
  ) as HTMLImageElement | null;
  const lod = setupLodController({
    graph,
    renderer,
    lineageData,
    state,
    onModeChange: (isSimpleView) => {
      if (!lodIcon) return;
      lodIcon.src = isSimpleView ? '/icons/simple.svg' : '/icons/detail.svg';
      lodIcon.alt = isSimpleView ? 'Simple view' : 'Detailed view';
    },
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

  renderer.on('afterRender', updateOverlays);

  renderer.on('clickNode', ({ node }) => {
    const attrs = graph.getNodeAttributes(node);
    sidebar.hideDetailPanel();

    if (lod.isSimpleView() && attrs.nodeType === 'meta') {
      const stageId = attrs.stage as string;
      const stageLabel = attrs.label as string;
      const stageNodes = lineageData.nodes.filter((n) => n.stage === stageId);
      sidebar.renderStageOverview(stageLabel, stageNodes, lineageData.edges);
      return;
    }

    sidebar.renderNode({
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
    });
  });

  renderer.on('clickStage', () => {
    sidebar.renderEmpty();
  });

  const tooltip = document.getElementById('node-hover-tooltip');
  const tooltipTitle = tooltip?.querySelector('.tooltip-title') as HTMLElement;
  const tooltipType = tooltip?.querySelector('.tooltip-type') as HTMLElement;

  renderer.on('enterNode', ({ node }) => {
    container.style.cursor = 'pointer';

    if (tooltip && tooltipTitle && tooltipType) {
      const attrs = graph.getNodeAttributes(node);
      const pos = renderer.graphToViewport({
        x: attrs.x as number,
        y: attrs.y as number,
      });
      const displayData = renderer.getNodeDisplayData(node);
      const size = displayData?.size ?? 14;

      tooltipTitle.textContent = (attrs.label as string) || node;
      tooltipType.textContent = (attrs.nodeType as string) || 'node';

      tooltip.style.left = `${pos.x}px`;
      tooltip.style.top = `${pos.y - size - 12}px`;
      tooltip.classList.add('visible');
    }
  });

  renderer.on('leaveNode', () => {
    container.style.cursor = 'grab';
    tooltip?.classList.remove('visible');
  });

  const expandBtn = document.getElementById('sidebar-expand');
  const sidebarEl = document.getElementById('sidebar');
  if (expandBtn && sidebarEl) {
    expandBtn.addEventListener('click', () => {
      sidebarEl.classList.toggle('floating');
      expandBtn.textContent = sidebarEl.classList.contains('floating')
        ? '↙'
        : '↗';
    });
  }

  const detailPanelClose = document.getElementById('detail-panel-close');
  if (detailPanelClose) {
    detailPanelClose.addEventListener('click', sidebar.hideDetailPanel);
  }

  const camera = renderer.getCamera();
  camera.setState({ x: 0.5, y: 0.5, ratio: 0.5 });
}

document.addEventListener('DOMContentLoaded', main);
