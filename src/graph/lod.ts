import type Graph from 'graphology';
import type Sigma from 'sigma';
import type { GraphState } from './graphState.js';
import type { LineageEdgeData, LineageGraph } from '../types.js';
import { COLLAPSE_THRESHOLD, EXPAND_THRESHOLD } from '../config/constants.js';
import { getCssVar, META_NODE_SIZE, NODE_STYLES } from '../ui/theme.js';

interface OriginalNodeState {
  x: number;
  y: number;
  label: string;
  nodeType: string;
  size: number;
  borderColor: string;
  color: string;
}

interface StageInfo {
  label: string;
  x: number;
  y: number;
}

interface LodControllerOptions {
  graph: Graph;
  renderer: Sigma;
  lineageData: LineageGraph;
  state: GraphState;
  onModeChange?: (isSimpleView: boolean) => void;
  onGraphUpdate?: () => void;
}

export function setupLodController({
  graph,
  renderer,
  lineageData,
  state,
  onModeChange,
  onGraphUpdate,
}: LodControllerOptions) {
  let isAnimating = false;
  let isSimpleView = false;

  const originalNodeState = new Map<string, OriginalNodeState>();
  graph.forEachNode((nodeId, attrs) => {
    originalNodeState.set(nodeId, {
      x: attrs.x as number,
      y: attrs.y as number,
      label: attrs.label as string,
      nodeType: attrs.nodeType as string,
      size: attrs.size as number,
      borderColor: attrs.borderColor as string,
      color: attrs.color as string,
    });
  });

  const originalAllEdges = [...state.allEdges];
  const originalSimpleEdges = [...state.simpleEdges];

  const stageInfo: Record<string, StageInfo> = {};
  lineageData.stages.forEach((stage) => {
    const centerX = (stage.xStart + stage.xEnd) / 2;
    stageInfo[stage.id] = { label: stage.label, x: centerX, y: 0.5 };
  });

  const stageOrder = lineageData.stages.map((stage) => stage.id);
  const stageEdges = new Set<string>();
  for (let i = 0; i < stageOrder.length - 1; i += 1) {
    stageEdges.add(`${stageOrder[i]}->${stageOrder[i + 1]}`);
  }

  function animatePositions(
    targets: Map<string, { x: number; y: number }>,
    duration: number,
    onComplete: () => void
  ) {
    if (targets.size === 0) {
      onComplete();
      return;
    }

    const startTime = performance.now();
    const startPositions = new Map<string, { x: number; y: number }>();

    targets.forEach((_, nodeId) => {
      startPositions.set(nodeId, {
        x: graph.getNodeAttribute(nodeId, 'x') as number,
        y: graph.getNodeAttribute(nodeId, 'y') as number,
      });
    });

    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      targets.forEach((target, nodeId) => {
        const start = startPositions.get(nodeId)!;
        graph.setNodeAttribute(
          nodeId,
          'x',
          start.x + (target.x - start.x) * eased
        );
        graph.setNodeAttribute(
          nodeId,
          'y',
          start.y + (target.y - start.y) * eased
        );
      });

      onGraphUpdate?.();
      renderer.refresh();

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        isAnimating = false;
        onComplete();
      }
    }

    isAnimating = true;
    requestAnimationFrame(tick);
  }

  function collapseToSimple() {
    const stageNodes = new Map<string, string[]>();
    graph.forEachNode((nodeId, attrs) => {
      const stage = attrs.stage as string;
      if (stage && stage !== 'unknown') {
        if (!stageNodes.has(stage)) stageNodes.set(stage, []);
        stageNodes.get(stage)!.push(nodeId);
      }
    });

    const animationTargets = new Map<string, { x: number; y: number }>();

    stageNodes.forEach((nodeIds, stage) => {
      const info = stageInfo[stage];
      if (!info || nodeIds.length === 0) return;

      const repId = nodeIds[0];
      animationTargets.set(repId, { x: info.x, y: info.y });

      graph.setNodeAttribute(repId, 'label', info.label);
      graph.setNodeAttribute(repId, 'nodeType', 'meta');
      graph.setNodeAttribute(repId, 'size', META_NODE_SIZE);
      graph.setNodeAttribute(
        repId,
        'borderColor',
        NODE_STYLES.meta.borderColor
      );
      graph.setNodeAttribute(repId, 'color', NODE_STYLES.meta.color);
      graph.setNodeAttribute(repId, 'hidden', false);

      for (let i = 1; i < nodeIds.length; i += 1) {
        graph.setNodeAttribute(nodeIds[i], 'hidden', true);
      }
    });

    const metaEdges: LineageEdgeData[] = [];
    const metaEdgeColor = getCssVar('--color-edge-muted', '#666666');
    stageEdges.forEach((edgeKey) => {
      const [sourceStage, targetStage] = edgeKey.split('->') as [
        string,
        string
      ];
      const sourceNodes = stageNodes.get(sourceStage);
      const targetNodes = stageNodes.get(targetStage);
      if (sourceNodes?.[0] && targetNodes?.[0]) {
        metaEdges.push({
          id: `meta-${sourceStage}-${targetStage}`,
          source: sourceNodes[0],
          target: targetNodes[0],
          color: metaEdgeColor,
          isSimple: true,
        });
      }
    });

    state.simpleEdges = metaEdges;
    state.showAllEdges = false;

    onGraphUpdate?.();
    animatePositions(animationTargets, 400, () => {
      renderer.refresh();
    });
  }

  function expandToDetailed() {
    const animationTargets = new Map<string, { x: number; y: number }>();
    originalNodeState.forEach((original, nodeId) => {
      graph.setNodeAttribute(nodeId, 'label', original.label);
      graph.setNodeAttribute(nodeId, 'nodeType', original.nodeType);
      graph.setNodeAttribute(nodeId, 'size', original.size);
      graph.setNodeAttribute(nodeId, 'borderColor', original.borderColor);
      graph.setNodeAttribute(nodeId, 'color', original.color);
      graph.setNodeAttribute(nodeId, 'hidden', false);

      const currentX = graph.getNodeAttribute(nodeId, 'x') as number;
      const currentY = graph.getNodeAttribute(nodeId, 'y') as number;
      const dx = Math.abs(currentX - original.x);
      const dy = Math.abs(currentY - original.y);

      if (dx > 1 || dy > 1) {
        animationTargets.set(nodeId, { x: original.x, y: original.y });
      } else {
        graph.setNodeAttribute(nodeId, 'x', original.x);
        graph.setNodeAttribute(nodeId, 'y', original.y);
      }
    });

    state.allEdges = [...originalAllEdges];
    state.simpleEdges = [...originalSimpleEdges];
    state.showAllEdges = true;

    onGraphUpdate?.();
    if (animationTargets.size > 0) {
      animatePositions(animationTargets, 400, () => {
        renderer.refresh();
      });
    } else {
      renderer.refresh();
    }
  }

  renderer.on('afterRender', () => {
    if (isAnimating) return;
    const ratio = renderer.getCamera().ratio;
    if (!isSimpleView && ratio > COLLAPSE_THRESHOLD) {
      isSimpleView = true;
      onModeChange?.(true);
      collapseToSimple();
    } else if (isSimpleView && ratio < EXPAND_THRESHOLD) {
      isSimpleView = false;
      onModeChange?.(false);
      expandToDetailed();
    }
  });

  return {
    isSimpleView: () => isSimpleView,
    collapseToSimple,
    expandToDetailed,
  };
}
