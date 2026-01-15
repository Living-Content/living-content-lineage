import type Sigma from 'sigma';
import type { GraphState } from '../graphState.js';
import {
  OVERLAY_PORT_PADDING,
  OVERLAY_PORT_SIZE,
  OVERLAY_VERTICAL_EDGE_X_TOLERANCE,
} from '../../config/constants.js';
import { getCssVar } from '../../ui/theme.js';

export function renderEdgePorts(
  svg: SVGSVGElement,
  state: GraphState,
  renderer: Sigma
): void {
  const { graph } = state;
  const renderedOutputPorts = new Set<string>();
  const renderedInputPorts = new Set<string>();
  const portColor = getCssVar('--color-port', '#4b5563');

  const edgesToShow = state.showAllEdges ? state.allEdges : state.simpleEdges;
  edgesToShow
    .filter((edge) => !edge.isGate)
    .forEach((edge) => {
      const sourceAttrs = graph.getNodeAttributes(edge.source);
      const targetAttrs = graph.getNodeAttributes(edge.target);
      if (!sourceAttrs || !targetAttrs) return;
      if (sourceAttrs.hidden === true || targetAttrs.hidden === true) return;

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

      const sourceRole = sourceAttrs.role as string;
      const targetRole = targetAttrs.role as string;
      const sourceDisplayData = renderer.getNodeDisplayData(edge.source);
      const targetDisplayData = renderer.getNodeDisplayData(edge.target);
      const sourceRadius = sourceDisplayData?.size ?? 14;
      const targetRadius = targetDisplayData?.size ?? 14;

      if (!renderedOutputPorts.has(edge.source) && sourceRole !== 'sink') {
        const sourcePortX = sourcePos.x + sourceRadius + OVERLAY_PORT_PADDING;
        const sourcePort = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        sourcePort.setAttribute('x', String(sourcePortX));
        sourcePort.setAttribute(
          'y',
          String(sourcePos.y - OVERLAY_PORT_SIZE / 2)
        );
        sourcePort.setAttribute('width', String(OVERLAY_PORT_SIZE + 4));
        sourcePort.setAttribute('height', String(OVERLAY_PORT_SIZE));
        sourcePort.setAttribute('rx', '2');
        sourcePort.setAttribute('fill', portColor);
        svg.appendChild(sourcePort);
        renderedOutputPorts.add(edge.source);
      }

      if (!renderedInputPorts.has(edge.target) && targetRole !== 'source') {
        const targetPortX = targetPos.x - targetRadius - OVERLAY_PORT_PADDING;
        const targetPort = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        targetPort.setAttribute('x', String(targetPortX - OVERLAY_PORT_SIZE));
        targetPort.setAttribute(
          'y',
          String(targetPos.y - OVERLAY_PORT_SIZE / 2)
        );
        targetPort.setAttribute('width', String(OVERLAY_PORT_SIZE + 4));
        targetPort.setAttribute('height', String(OVERLAY_PORT_SIZE));
        targetPort.setAttribute('rx', '2');
        targetPort.setAttribute('fill', portColor);
        svg.appendChild(targetPort);
        renderedInputPorts.add(edge.target);
      }
    });
}
