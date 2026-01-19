/**
 * Stage node creation and bounds calculation.
 */
import type { Ticker, Container } from 'pixi.js';
import type { LineageNodeData, Stage, LineageEdgeData } from '../../../config/types.js';
import { createPillNode, type PillNode, type PillRenderOptions } from '../rendering/nodeRenderer.js';
import { PHASE_ICON_PATHS } from '../../../theme/theme.js';
import { STAGE_NODE_SCALE } from '../../../config/constants.js';
import { selectStage } from '../../../stores/lineageState.js';

interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

interface StageCreatorCallbacks {
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
}

interface StageCreatorDeps {
  container: HTMLElement;
  stageNodeLayer: Container;
  selectionLayer: Container;
  graphScale: number;
  ticker: Ticker;
  callbacks: StageCreatorCallbacks;
}

/**
 * Recalculates stage bounds based on the positioned nodes within each stage.
 */
export const recalculateStageBounds = (
  stages: Stage[],
  nodeMap: Map<string, PillNode>,
  graphScale: number
): void => {
  const stagePadding = 0.04 * graphScale;

  for (const stage of stages) {
    let minX = Infinity;
    let maxX = -Infinity;

    nodeMap.forEach((node) => {
      if (node.nodeData.stage === stage.id) {
        const halfW = node.pillWidth / 2;
        minX = Math.min(minX, node.position.x - halfW);
        maxX = Math.max(maxX, node.position.x + halfW);
      }
    });

    if (minX !== Infinity) {
      stage.xStart = (minX - stagePadding) / graphScale + 0.5;
      stage.xEnd = (maxX + stagePadding) / graphScale + 0.5;
    }
  }
};

/**
 * Creates stage nodes (collapsed view representation).
 */
export const createStageNodes = (
  stages: Stage[],
  nodes: LineageNodeData[],
  edges: LineageEdgeData[],
  stageNodeMap: Map<string, PillNode>,
  deps: StageCreatorDeps
): void => {
  const { container, stageNodeLayer, selectionLayer, graphScale, ticker, callbacks } = deps;

  for (const stage of stages) {
    const stageNodes = nodes.filter((n) => n.stage === stage.id);
    const stageNodeData: LineageNodeData = {
      id: `stage-${stage.id}`,
      label: stage.label,
      nodeType: 'stage',
      shape: 'circle',
      stage: stage.id,
      phase: stage.phase,
      x: (stage.xStart + stage.xEnd) / 2,
      y: 0.5,
    };

    const phaseIconPath = stage.phase ? PHASE_ICON_PATHS[stage.phase] : PHASE_ICON_PATHS.Reasoning;
    const stageRenderOptions: PillRenderOptions = {
      mode: 'simple',
      iconPath: phaseIconPath,
      typeLabel: stage.label,
    };

    const pillNode = createPillNode(stageNodeData, graphScale, ticker, {
      onClick: () => {
        const stageEdges = edges.filter(
          (e) => stageNodes.some((n) => n.id === e.source) || stageNodes.some((n) => n.id === e.target)
        );
        selectStage({ stageId: stage.id, label: stage.label, nodes: stageNodes, edges: stageEdges });
      },
      onHover: () => {
        container.style.cursor = 'pointer';
        const bounds = pillNode.getBounds();
        callbacks.onHover({
          title: stage.label,
          nodeType: 'stage',
          screenX: bounds.x + bounds.width / 2,
          screenY: bounds.y,
          size: 40,
        });
      },
      onHoverEnd: () => {
        container.style.cursor = 'grab';
        callbacks.onHoverEnd();
      },
    }, { scale: STAGE_NODE_SCALE, renderOptions: stageRenderOptions, selectionLayer });

    stageNodeLayer.addChild(pillNode);
    stageNodeMap.set(stage.id, pillNode);
  }
};

/**
 * Calculates info about the topmost node for stage label positioning.
 */
export const calculateTopNodeInfo = (
  nodeMap: Map<string, PillNode>
): { worldY: number; halfHeight: number } | null => {
  let minWorldY = Infinity;
  let halfHeight = 0;

  nodeMap.forEach((pillNode) => {
    if (pillNode.position.y < minWorldY) {
      minWorldY = pillNode.position.y;
      halfHeight = pillNode.pillHeight / 2;
    }
  });

  return minWorldY === Infinity ? null : { worldY: minWorldY, halfHeight };
};
