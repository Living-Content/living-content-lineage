import type Sigma from 'sigma';
import type { GraphState } from '../graphState.js';
import { getCssVar } from '../../ui/theme.js';

export function renderGateEdges(
  svg: SVGSVGElement,
  state: GraphState,
  renderer: Sigma
): void {
  const { graph } = state;
  const edgesToShow = state.showAllEdges ? state.allEdges : state.simpleEdges;
  const gateColor = getCssVar('--color-edge-gate', '#22c55e');

  edgesToShow
    .filter((edge) => edge.isGate)
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

      const goingDown = targetPos.y > sourcePos.y;
      const startY = goingDown
        ? sourcePos.y + sourceRadius + 2
        : sourcePos.y - sourceRadius - 2;
      const endY = goingDown
        ? targetPos.y - targetRadius
        : targetPos.y + targetRadius;

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      const d = `M ${sourcePos.x} ${startY} L ${targetPos.x} ${endY}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', gateColor);
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(path);
    });
}
