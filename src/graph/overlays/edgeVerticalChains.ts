import type Sigma from 'sigma';
import type { GraphState } from '../graphState.js';
import { OVERLAY_VERTICAL_EDGE_X_TOLERANCE } from '../../config/constants.js';
import { getCssVar } from '../../ui/theme.js';

export function renderVerticalChains(
  svg: SVGSVGElement,
  state: GraphState,
  renderer: Sigma
): void {
  const { graph } = state;
  const edgesToShow = state.showAllEdges ? state.allEdges : state.simpleEdges;
  const strokeColor = getCssVar('--color-edge', '#1a1a1a');
  const verticalGroups = new Map<
    string,
    Array<{ nodeId: string; x: number; y: number; radius: number }>
  >();

  edgesToShow
    .filter((edge) => !edge.isGate)
    .forEach((edge) => {
      const sourceAttrs = graph.getNodeAttributes(edge.source);
      const targetAttrs = graph.getNodeAttributes(edge.target);
      if (!sourceAttrs || !targetAttrs) return;
      if (sourceAttrs.hidden || targetAttrs.hidden) return;

      const sourcePos = renderer.graphToViewport({
        x: sourceAttrs.x as number,
        y: sourceAttrs.y as number,
      });
      const targetPos = renderer.graphToViewport({
        x: targetAttrs.x as number,
        y: targetAttrs.y as number,
      });

      if (
        Math.abs(sourcePos.x - targetPos.x) >=
        OVERLAY_VERTICAL_EDGE_X_TOLERANCE
      ) {
        return;
      }

      const groupKey = edge.target;
      if (!verticalGroups.has(groupKey)) {
        verticalGroups.set(groupKey, []);
      }
      const group = verticalGroups.get(groupKey)!;

      const sourceDisplayData = renderer.getNodeDisplayData(edge.source);
      const targetDisplayData = renderer.getNodeDisplayData(edge.target);
      const sourceRadius = sourceDisplayData?.size ?? 14;
      const targetRadius = targetDisplayData?.size ?? 14;

      if (!group.find((node) => node.nodeId === edge.source)) {
        group.push({
          nodeId: edge.source,
          x: sourcePos.x,
          y: sourcePos.y,
          radius: sourceRadius,
        });
      }
      if (!group.find((node) => node.nodeId === edge.target)) {
        group.push({
          nodeId: edge.target,
          x: targetPos.x,
          y: targetPos.y,
          radius: targetRadius,
        });
      }
    });

  verticalGroups.forEach((nodes) => {
    if (nodes.length < 2) return;
    nodes.sort((a, b) => a.y - b.y);
    for (let i = 0; i < nodes.length - 1; i += 1) {
      const from = nodes[i];
      const to = nodes[i + 1];
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      const startY = from.y + from.radius + 6;
      const endY = to.y - to.radius - 6;
      const lineX = (from.x + to.x) / 2;
      const d = `M ${lineX} ${startY} L ${lineX} ${endY}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);
    }
  });
}
