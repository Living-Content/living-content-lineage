import type Sigma from 'sigma';
import type { GraphState } from '../graphState.js';
import {
  OVERLAY_PORT_PADDING,
  OVERLAY_PORT_SIZE,
  OVERLAY_VERTICAL_EDGE_X_TOLERANCE,
} from '../../config/constants.js';

export function renderEdgePaths(
  svg: SVGSVGElement,
  state: GraphState,
  renderer: Sigma
): void {
  const { graph } = state;
  const edgesToShow = state.showAllEdges ? state.allEdges : state.simpleEdges;

  edgesToShow
    .filter((edge) => !edge.isGate)
    .forEach((edge) => {
      const sourceAttrs = graph.getNodeAttributes(edge.source);
      const targetAttrs = graph.getNodeAttributes(edge.target);
      if (!sourceAttrs || !targetAttrs) return;
      if (sourceAttrs.hidden || targetAttrs.hidden) return;

      const sourceDisplayData = renderer.getNodeDisplayData(edge.source);
      const targetDisplayData = renderer.getNodeDisplayData(edge.target);
      const sourceRadius = sourceDisplayData?.size ?? 14;
      const targetRadius = targetDisplayData?.size ?? 14;

      const sourcePos = renderer.graphToViewport({
        x: sourceAttrs.x as number,
        y: sourceAttrs.y as number,
      });
      const targetPos = renderer.graphToViewport({
        x: targetAttrs.x as number,
        y: targetAttrs.y as number,
      });

      const isVertical =
        Math.abs(sourcePos.x - targetPos.x) < OVERLAY_VERTICAL_EDGE_X_TOLERANCE;
      if (isVertical) return;

      const sourcePortX = sourcePos.x + sourceRadius + OVERLAY_PORT_PADDING;
      const targetPortX = targetPos.x - targetRadius - OVERLAY_PORT_PADDING;
      const startX = sourcePortX + OVERLAY_PORT_SIZE + 2;
      const endX = targetPortX - OVERLAY_PORT_SIZE - 2;
      const startY = sourcePos.y;
      const endY = targetPos.y;

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );

      let d: string;
      const cornerRadius = 8;

      if (Math.abs(startY - endY) < 3) {
        d = `M ${startX} ${startY} L ${endX} ${endY}`;
      } else {
        const turnX = endX - 30;
        const goingDown = endY > startY;
        d = `M ${startX} ${startY} `;
        d += `L ${turnX - cornerRadius} ${startY} `;
        if (goingDown) {
          d += `Q ${turnX} ${startY} ${turnX} ${startY + cornerRadius} `;
          d += `L ${turnX} ${endY - cornerRadius} `;
          d += `Q ${turnX} ${endY} ${turnX + cornerRadius} ${endY} `;
        } else {
          d += `Q ${turnX} ${startY} ${turnX} ${startY - cornerRadius} `;
          d += `L ${turnX} ${endY + cornerRadius} `;
          d += `Q ${turnX} ${endY} ${turnX + cornerRadius} ${endY} `;
        }
        d += `L ${endX} ${endY}`;
      }

      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#1a1a1a');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('marker-end', 'url(#arrowhead)');
      svg.appendChild(path);
    });
}
