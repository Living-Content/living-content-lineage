import type Sigma from 'sigma';
import type { GraphState } from '../graphState.js';
import { addArrowheadMarker, createEdgeSvgContainer } from './edgeSvg.js';
import { renderEdgePorts } from './edgePorts.js';
import { renderEdgePaths } from './edgePaths.js';
import { renderVerticalChains } from './edgeVerticalChains.js';
import { renderGateEdges } from './edgeGates.js';

export function renderEdges(state: GraphState, renderer: Sigma): void {
  const container = document.getElementById('edge-overlay');
  if (!container) return;
  container.innerHTML = '';

  const svg = createEdgeSvgContainer();
  addArrowheadMarker(svg);

  renderEdgePorts(svg, state, renderer);
  renderEdgePaths(svg, state, renderer);
  renderVerticalChains(svg, state, renderer);
  renderGateEdges(svg, state, renderer);

  container.appendChild(svg);
}
import type Sigma from 'sigma';
import type { GraphState } from '../graphState.js';
import { addArrowheadMarker, createEdgeSvgContainer } from './edgeSvg.js';
import { renderEdgePorts } from './edgePorts.js';
import { renderEdgePaths } from './edgePaths.js';
import { renderVerticalChains } from './edgeVerticalChains.js';
import { renderGateEdges } from './edgeGates.js';

export function renderEdges(state: GraphState, renderer: Sigma): void {
  const container = document.getElementById('edge-overlay');
  if (!container) return;
  container.innerHTML = '';

  const svg = createEdgeSvgContainer();
  addArrowheadMarker(svg);

  renderEdgePorts(svg, state, renderer);
  renderEdgePaths(svg, state, renderer);
  renderVerticalChains(svg, state, renderer);
  renderGateEdges(svg, state, renderer);

  container.appendChild(svg);
}
import type Sigma from 'sigma';
import type { GraphState } from '../graphState.js';
import { addArrowheadMarker, createEdgeSvgContainer } from './edgeSvg.js';
import { renderEdgePorts } from './edgePorts.js';
import { renderEdgePaths } from './edgePaths.js';
import { renderVerticalChains } from './edgeVerticalChains.js';
import { renderGateEdges } from './edgeGates.js';

export function renderEdges(state: GraphState, renderer: Sigma): void {
  const container = document.getElementById('edge-overlay');
  if (!container) return;
  container.innerHTML = '';

  const svg = createEdgeSvgContainer();
  addArrowheadMarker(svg);

  renderEdgePorts(svg, state, renderer);
  renderEdgePaths(svg, state, renderer);
  renderVerticalChains(svg, state, renderer);
  renderGateEdges(svg, state, renderer);

  container.appendChild(svg);
}
import type Sigma from 'sigma';
import type { GraphState } from '../graphState.js';
import {
  OVERLAY_PORT_PADDING,
  OVERLAY_PORT_SIZE,
  OVERLAY_VERTICAL_EDGE_X_TOLERANCE,
} from '../../config/constants.js';

function createSvgContainer(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'none';
  return svg;
}

function addArrowheadMarker(svg: SVGSVGElement): void {
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'marker'
  );
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '5');
  marker.setAttribute('orient', 'auto');
  marker.setAttribute('markerUnits', 'strokeWidth');

  const chevron = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );
  chevron.setAttribute('d', 'M 0 0 L 8 5 L 0 10');
  chevron.setAttribute('fill', 'none');
  chevron.setAttribute('stroke', '#1a1a1a');
  chevron.setAttribute('stroke-width', '1.5');
  chevron.setAttribute('stroke-linecap', 'round');
  chevron.setAttribute('stroke-linejoin', 'round');
  marker.appendChild(chevron);
  defs.appendChild(marker);
  svg.appendChild(defs);
}

function renderPorts(
  svg: SVGSVGElement,
  state: GraphState,
  renderer: Sigma
): void {
  const { graph } = state;
  const renderedOutputPorts = new Set<string>();
  const renderedInputPorts = new Set<string>();

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
        sourcePort.setAttribute('fill', '#4b5563');
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
        targetPort.setAttribute('fill', '#4b5563');
        svg.appendChild(targetPort);
        renderedInputPorts.add(edge.target);
      }
    });
}

function renderRegularEdges(
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

function renderVerticalChains(
  svg: SVGSVGElement,
  state: GraphState,
  renderer: Sigma
): void {
  const { graph } = state;
  const edgesToShow = state.showAllEdges ? state.allEdges : state.simpleEdges;
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
        Math.abs(sourcePos.x - targetPos.x) >= OVERLAY_VERTICAL_EDGE_X_TOLERANCE
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
      path.setAttribute('stroke', '#1a1a1a');
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);
    }
  });
}

function renderGateEdges(
  svg: SVGSVGElement,
  state: GraphState,
  renderer: Sigma
): void {
  const { graph } = state;
  const edgesToShow = state.showAllEdges ? state.allEdges : state.simpleEdges;

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
      path.setAttribute('stroke', '#22c55e');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(path);
    });
}

export function renderEdges(state: GraphState, renderer: Sigma): void {
  const container = document.getElementById('edge-overlay');
  if (!container) return;
  container.innerHTML = '';

  const svg = createSvgContainer();
  addArrowheadMarker(svg);

  renderPorts(svg, state, renderer);
  renderRegularEdges(svg, state, renderer);
  renderVerticalChains(svg, state, renderer);
  renderGateEdges(svg, state, renderer);

  container.appendChild(svg);
}
