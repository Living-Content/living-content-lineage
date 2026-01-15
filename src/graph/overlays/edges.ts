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
