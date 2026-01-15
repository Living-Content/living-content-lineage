/**
 * Main entry point for the lineage visualization POC.
 * Loads C2PA manifest data and renders lineage graph.
 */

import Graph from 'graphology';
import Sigma from 'sigma';
import { createNodeBorderProgram } from '@sigma/node-border';
import { loadManifest } from './manifestLoader.js';
import type {
  LineageNodeData,
  LineageEdgeData,
  Stage,
  LineageGraph,
} from './types.js';

const NODE_STYLES: Record<
  string,
  {
    color: string;
    borderColor: string;
    iconColor: string;
    borderStyle?: string;
  }
> = {
  data: { color: '#ffffff', borderColor: '#1a1a1a', iconColor: '#1a1a1a' },
  compute: {
    color: '#ffffff',
    borderColor: '#ec4899',
    iconColor: '#ec4899',
    borderStyle: 'dashed',
  }, // pink
  attestation: {
    color: '#ffffff',
    borderColor: '#22c55e',
    iconColor: '#22c55e',
  }, // green outline
  filter: { color: '#ffffff', borderColor: '#1a1a1a', iconColor: '#1a1a1a' },
  join: { color: '#ffffff', borderColor: '#1a1a1a', iconColor: '#1a1a1a' },
  store: {
    color: '#fef3c7',
    borderColor: '#ec4899',
    iconColor: '#d97706',
    borderStyle: 'solid',
  }, // pink ring, yellow fill
  media: { color: '#ffffff', borderColor: '#1a1a1a', iconColor: '#1a1a1a' },
  meta: { color: '#f0f4f8', borderColor: '#3b82f6', iconColor: '#3b82f6' }, // blue border for meta nodes
};

// Asset-type specific border colors
const ASSET_TYPE_COLORS: Record<string, string> = {
  Model: '#000000',    // black
  Code: '#9ca3af',     // grey
  Document: '#22d3ee', // cyan
  Data: '#fb923c',     // bright orange
  Dataset: '#3b82f6',  // bright blue
};

// SVG icon paths (served from public/icons)
const NODE_ICON_PATHS: Record<string, string> = {
  data: '/icons/data.svg',
  compute: '/icons/compute.svg',
  attestation: '/icons/attestation.svg',
  filter: '/icons/filter.svg',
  join: '/icons/join.svg',
  store: '/icons/store.svg',
  media: '/icons/media.svg',
  meta: '/icons/collection.svg',
};

// Asset-type specific icons (override nodeType icons)
const ASSET_TYPE_ICONS: Record<string, string> = {
  Code: '/icons/code.svg',
  Document: '/icons/document.svg',
};

interface StagePosition {
  stage: Stage;
  screenX: number;
}

interface GraphState {
  graph: Graph;
  allEdges: LineageEdgeData[];
  simpleEdges: LineageEdgeData[];
  showAllEdges: boolean;
}

async function initializeGraph(lineageData: LineageGraph): Promise<GraphState> {
  const graph = new Graph();

  lineageData.nodes.forEach((node) => {
    const style = NODE_STYLES[node.nodeType] ?? {
      color: '#ffffff',
      borderColor: '#333',
      iconColor: '#333',
    };
    // Use asset-type-specific border color if available (except for special node types)
    const borderColor = (node.assetType && ASSET_TYPE_COLORS[node.assetType] && node.nodeType !== 'attestation' && node.nodeType !== 'compute')
      ? ASSET_TYPE_COLORS[node.assetType]
      : style.borderColor;
    graph.addNode(node.id, {
      x: node.x ?? 0,
      y: node.y ?? 0,
      size: node.nodeType === 'attestation' ? 16 : 14,
      color: style.color,
      borderColor: borderColor,
      iconColor: style.iconColor,
      borderSize: 0.15,
      label: node.label,
      nodeType: node.nodeType,
      assetType: node.assetType,
      shape: node.shape,
      stage: node.stage,
      manifest: node.manifest,
      assetManifest: node.assetManifest,
      role: node.role,
      type: 'bordered',
      // Human metadata
      humanDescription: node.humanDescription,
      humanInputs: node.humanInputs,
      humanOutputs: node.humanOutputs,
      verifiedBy: node.verifiedBy,
      verifiedAt: node.verifiedAt,
      duration: node.duration,
      tokens: node.tokens,
    });
  });

  const allEdges = lineageData.edges;
  const simpleEdges = allEdges.filter((edge) => edge.isSimple);

  return { graph, allEdges, simpleEdges, showAllEdges: true };
}

function calculateStagePositions(
  renderer: Sigma,
  stages: Stage[]
): StagePosition[] {
  const positions: StagePosition[] = [];

  stages.forEach((stage) => {
    const viewportPos = renderer.graphToViewport({ x: stage.xStart, y: 0 });
    positions.push({
      stage,
      screenX: viewportPos.x,
    });
  });

  return positions;
}

function renderStageLabels(stagePositions: StagePosition[]): void {
  const container = document.getElementById('stage-labels');
  if (!container) return;

  container.innerHTML = '';

  stagePositions.forEach((pos, idx) => {
    if (idx > 0) {
      const divider = document.createElement('div');
      divider.className = 'stage-divider';
      divider.style.left = `${pos.screenX}px`;
      container.appendChild(divider);
    }

    const labelDiv = document.createElement('div');
    labelDiv.className = 'stage-label';
    labelDiv.style.left = `${pos.screenX + 15}px`;
    labelDiv.textContent = pos.stage.label;
    container.appendChild(labelDiv);
  });
}

function renderEdges(state: GraphState, renderer: Sigma): void {
  const container = document.getElementById('edge-overlay');
  if (!container) return;

  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'none';

  // Add arrowhead marker - chevron style (>) with line meeting at point
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
  // Chevron path: two lines forming > with the main line meeting at the point
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

  const edgesToShow = state.showAllEdges ? state.allEdges : state.simpleEdges;
  const { graph } = state;

  const portSize = 6;

  // Track which ports have been rendered to avoid duplicates
  const renderedOutputPorts = new Set<string>();
  const renderedInputPorts = new Set<string>();

  // First pass: render ports for horizontal edges only (skip gate edges and vertical edges)
  // Using subtle dark gray ports that don't distract
  edgesToShow
    .filter((e) => !e.isGate)
    .forEach((edge) => {
      const sourceAttrs = graph.getNodeAttributes(edge.source);
      const targetAttrs = graph.getNodeAttributes(edge.target);
      if (!sourceAttrs || !targetAttrs) return;
      // Skip if either node is explicitly hidden
      if (sourceAttrs.hidden === true || targetAttrs.hidden === true) return;

      const sourcePos = renderer.graphToViewport({
        x: sourceAttrs.x as number,
        y: sourceAttrs.y as number,
      });
      const targetPos = renderer.graphToViewport({
        x: targetAttrs.x as number,
        y: targetAttrs.y as number,
      });

      // Skip ports for vertical edges (auxiliary inputs at same X)
      const isVertical = Math.abs(sourcePos.x - targetPos.x) < 20;
      if (isVertical) return;

      const sourceRole = sourceAttrs.role as string;
      const targetRole = targetAttrs.role as string;
      const sourceDisplayData = renderer.getNodeDisplayData(edge.source);
      const targetDisplayData = renderer.getNodeDisplayData(edge.target);
      const sourceRadius = sourceDisplayData?.size ?? 14;
      const targetRadius = targetDisplayData?.size ?? 14;

      // Draw output port (right side) for source node - unless it's a sink
      if (!renderedOutputPorts.has(edge.source) && sourceRole !== 'sink') {
        const sourcePortX = sourcePos.x + sourceRadius + 4; // +4 padding to ensure outside node

        const sourcePort = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        sourcePort.setAttribute('x', String(sourcePortX));
        sourcePort.setAttribute('y', String(sourcePos.y - portSize / 2));
        sourcePort.setAttribute('width', String(portSize + 4));
        sourcePort.setAttribute('height', String(portSize));
        sourcePort.setAttribute('rx', '2');
        sourcePort.setAttribute('fill', '#4b5563'); // subtle gray
        svg.appendChild(sourcePort);
        renderedOutputPorts.add(edge.source);
      }

      // Draw input port (left side) for target node - unless it's a source
      if (!renderedInputPorts.has(edge.target) && targetRole !== 'source') {
        const targetPortX = targetPos.x - targetRadius - 4; // -4 padding to ensure outside node

        const targetPort = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        targetPort.setAttribute('x', String(targetPortX - portSize));
        targetPort.setAttribute('y', String(targetPos.y - portSize / 2));
        targetPort.setAttribute('width', String(portSize + 4));
        targetPort.setAttribute('height', String(portSize));
        targetPort.setAttribute('rx', '2');
        targetPort.setAttribute('fill', '#4b5563'); // subtle gray
        svg.appendChild(targetPort);
        renderedInputPorts.add(edge.target);
      }
    });

  // Second pass: draw regular edges (non-gate) with rectangular routing
  edgesToShow
    .filter((e) => !e.isGate)
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

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );

      let d: string;
      const r = 8; // corner radius

      // Check if this is a vertical edge (same X position - auxiliary inputs)
      const isVertical = Math.abs(sourcePos.x - targetPos.x) < 20;

      if (isVertical) {
        // Skip individual vertical edges - we'll draw a single chain line later
        return;
      } else {
        // Horizontal routing with ports
        const sourcePortX = sourcePos.x + sourceRadius + 4;
        const targetPortX = targetPos.x - targetRadius - 4;
        const startX = sourcePortX + portSize + 2;
        const endX = targetPortX - portSize - 2;
        const startY = sourcePos.y;
        const endY = targetPos.y;

        if (Math.abs(startY - endY) < 3) {
          // Horizontal - straight line
          d = `M ${startX} ${startY} L ${endX} ${endY}`;
        } else {
          // Rectangular routing with rounded corners
          const turnX = endX - 30;
          const goingDown = endY > startY;

          d = `M ${startX} ${startY} `;
          d += `L ${turnX - r} ${startY} `;
          if (goingDown) {
            d += `Q ${turnX} ${startY} ${turnX} ${startY + r} `;
            d += `L ${turnX} ${endY - r} `;
            d += `Q ${turnX} ${endY} ${turnX + r} ${endY} `;
          } else {
            d += `Q ${turnX} ${startY} ${turnX} ${startY - r} `;
            d += `L ${turnX} ${endY + r} `;
            d += `Q ${turnX} ${endY} ${turnX + r} ${endY} `;
          }
          d += `L ${endX} ${endY}`;
        }
      }

      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#1a1a1a');
      path.setAttribute('stroke-width', '1');
      // No arrowhead for vertical edges (cleaner look)
      if (!isVertical) {
        path.setAttribute('marker-end', 'url(#arrowhead)');
      }

      svg.appendChild(path);
    });

  // Third pass: draw vertical chain lines for auxiliary inputs
  // Group nodes by approximate X position and draw a single line through them
  const verticalGroups = new Map<string, Array<{ nodeId: string; x: number; y: number; radius: number }>>();

  edgesToShow
    .filter((e) => !e.isGate)
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

      // Check if vertical edge
      if (Math.abs(sourcePos.x - targetPos.x) < 20) {
        // Use target node ID as group key (the computation node)
        const groupKey = edge.target;
        if (!verticalGroups.has(groupKey)) {
          verticalGroups.set(groupKey, []);
        }
        const group = verticalGroups.get(groupKey)!;

        const sourceDisplayData = renderer.getNodeDisplayData(edge.source);
        const targetDisplayData = renderer.getNodeDisplayData(edge.target);

        // Add both nodes to the group (will dedupe by nodeId)
        const sourceRadius = sourceDisplayData?.size ?? 14;
        const targetRadius = targetDisplayData?.size ?? 14;

        if (!group.find(n => n.nodeId === edge.source)) {
          group.push({ nodeId: edge.source, x: sourcePos.x, y: sourcePos.y, radius: sourceRadius });
        }
        if (!group.find(n => n.nodeId === edge.target)) {
          group.push({ nodeId: edge.target, x: targetPos.x, y: targetPos.y, radius: targetRadius });
        }
      }
    });

  // Draw a single chain line for each vertical group
  verticalGroups.forEach((nodes) => {
    if (nodes.length < 2) return;

    // Sort by Y position (top to bottom on screen)
    nodes.sort((a, b) => a.y - b.y);

    // Draw lines between consecutive nodes using their actual X positions
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      // Add extra padding (6px) so lines don't touch the circles
      const startY = from.y + from.radius + 6;
      const endY = to.y - to.radius - 6;
      // Use average X of the two nodes for a straight vertical line
      const lineX = (from.x + to.x) / 2;
      const d = `M ${lineX} ${startY} L ${lineX} ${endY}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#1a1a1a');
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);
    }
  });

  // Fourth pass: draw gate edges (simple dotted green line to attestation)
  edgesToShow
    .filter((e) => e.isGate)
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

      // Determine direction: is target below source in screen coords?
      const goingDown = targetPos.y > sourcePos.y;

      // Start just outside source node, end at target node edge
      const startY = goingDown
        ? sourcePos.y + sourceRadius + 2
        : sourcePos.y - sourceRadius - 2;
      const endY = goingDown
        ? targetPos.y - targetRadius
        : targetPos.y + targetRadius;

      // Simple dotted vertical line
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

  container.appendChild(svg);
}

function renderNodeOverlays(graph: Graph, renderer: Sigma): void {
  const container = document.getElementById('icon-overlay');
  if (!container) return;

  container.innerHTML = '';

  const camera = renderer.getCamera();
  const ratio = camera.ratio;
  const showLabels = ratio < 1.2;

  graph.forEachNode((nodeId, attrs) => {
    if (attrs.hidden === true) return;
    const nodeType = attrs.nodeType as string;
    const assetType = attrs.assetType as string;
    // Compute nodes always use compute icon; data nodes use asset-type-specific icons
    const iconPath = nodeType === 'compute'
      ? NODE_ICON_PATHS[nodeType]
      : (ASSET_TYPE_ICONS[assetType] || NODE_ICON_PATHS[nodeType]);
    const style = NODE_STYLES[nodeType];
    if (!style) return;

    const pos = renderer.graphToViewport({
      x: attrs.x as number,
      y: attrs.y as number,
    });
    const displayData = renderer.getNodeDisplayData(nodeId);
    const size = displayData?.size ?? 14;

    // Render SVG icon - cap size so meta nodes don't have oversized icons
    if (iconPath) {
      const iconEl = document.createElement('img');
      iconEl.className = 'node-icon';
      iconEl.src = iconPath;
      iconEl.style.left = `${pos.x}px`;
      iconEl.style.top = `${pos.y}px`;
      const iconSize = Math.min(size * 1.2, 18); // cap at 18px
      iconEl.style.width = `${iconSize}px`;
      iconEl.style.height = `${iconSize}px`;
      // Apply color via CSS filter for currentColor SVGs
      if (style.iconColor !== '#1a1a1a') {
        // Convert hex to HSL filter (simplified - blue for compute, yellow for store)
        if (style.iconColor === '#3b82f6') {
          iconEl.style.filter =
            'invert(45%) sepia(67%) saturate(2000%) hue-rotate(203deg) brightness(97%) contrast(96%)';
        } else if (style.iconColor === '#f59e0b') {
          iconEl.style.filter =
            'invert(62%) sepia(83%) saturate(1500%) hue-rotate(16deg) brightness(97%) contrast(95%)';
        }
      }
      container.appendChild(iconEl);
    }

    if (showLabels) {
      const label = attrs.label as string;
      if (label) {
        const labelEl = document.createElement('div');
        labelEl.className = 'node-label';
        labelEl.style.left = `${pos.x}px`;
        labelEl.style.top = `${pos.y + size + 10}px`;
        labelEl.textContent = label;
        container.appendChild(labelEl);
      }
    }
  });
}

// Sidebar state
let sidebarDetailMode = false;
let currentNodeData: LineageNodeData | null = null;

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

function renderSidebar(nodeData: LineageNodeData | null): void {
  const sidebar = document.getElementById('sidebar-content');
  const sidebarTitle = document.getElementById('sidebar-title');
  const detailPanel = document.getElementById('detail-panel');
  const detailContent = document.getElementById('detail-panel-content');
  if (!sidebar) return;

  currentNodeData = nodeData;

  if (!nodeData) {
    if (sidebarTitle) sidebarTitle.textContent = 'CONTEXT';
    sidebar.innerHTML =
      '<p class="sidebar-placeholder">Select a node to view details</p>';
    if (detailPanel) {
      detailPanel.classList.remove('visible');
    }
    return;
  }

  // Update header with node name
  if (sidebarTitle) sidebarTitle.textContent = nodeData.label;

  const assetManifest = nodeData.assetManifest;

  // Check if there's meaningful content to show in detail panel
  const hasDetailContent = (() => {
    if (!assetManifest) return false;
    if (assetManifest.source_code) return true;
    if (assetManifest.content?.response) return true;
    if (assetManifest.content?.query) return true;

    // Check for data content fields (excluding basic metadata)
    if (assetManifest.content) {
      const metadataKeys = ['description', 'response_length', 'model', 'input_tokens', 'output_tokens', 'temperature', 'max_tokens', 'duration_ms'];
      const hasDataFields = Object.keys(assetManifest.content).some(key => !metadataKeys.includes(key));
      if (hasDataFields) return true;
    }

    return false;
  })();

  // Render summary view with optional "View Details" button
  renderSummaryView(sidebar, nodeData, assetManifest, hasDetailContent);

  // Render detail panel content if there's content
  if (detailContent && hasDetailContent && assetManifest) {
    renderDetailView(detailContent, nodeData, assetManifest);
  }

  // Hide detail panel when selecting a new node (user can reopen)
  if (detailPanel && !sidebarDetailMode) {
    detailPanel.classList.remove('visible');
  }
}

function showDetailPanel(): void {
  const detailPanel = document.getElementById('detail-panel');
  if (detailPanel) {
    sidebarDetailMode = true;
    detailPanel.classList.add('visible');
  }
}

function hideDetailPanel(): void {
  const detailPanel = document.getElementById('detail-panel');
  if (detailPanel) {
    sidebarDetailMode = false;
    detailPanel.classList.remove('visible');
  }
}

function renderSummaryView(
  container: HTMLElement,
  nodeData: LineageNodeData,
  assetManifest?: LineageNodeData['assetManifest'],
  hasDetailContent: boolean = false
): void {
  let html = '';

  // Type badge
  if (nodeData.assetType) {
    html += `<div class="sidebar-type-badge">${nodeData.assetType}</div>`;
  }

  // Description
  if (nodeData.humanDescription) {
    html += `<div class="sidebar-description">${escapeHtml(nodeData.humanDescription)}</div>`;
  }

  // Metadata rows
  html += `<div class="sidebar-meta">`;

  if (nodeData.duration) {
    html += `<div class="meta-row"><span class="meta-label">duration</span><span class="meta-value">${nodeData.duration}</span></div>`;
  }

  // Asset-specific metadata from manifest
  if (assetManifest?.content) {
    const content = assetManifest.content;
    if (content.model) {
      html += `<div class="meta-row"><span class="meta-label">model</span><span class="meta-value">${content.model}</span></div>`;
    }
    if (content.input_tokens !== undefined) {
      html += `<div class="meta-row"><span class="meta-label">tokens</span><span class="meta-value">${content.input_tokens} in / ${content.output_tokens ?? 0} out</span></div>`;
    }
    if (content.temperature !== undefined) {
      html += `<div class="meta-row"><span class="meta-label">temp</span><span class="meta-value">${content.temperature}</span></div>`;
    }
    if (content.response_length) {
      html += `<div class="meta-row"><span class="meta-label">length</span><span class="meta-value">${content.response_length.toLocaleString()} chars</span></div>`;
    }
    if (content.duration_ms) {
      html += `<div class="meta-row"><span class="meta-label">api time</span><span class="meta-value">${(content.duration_ms / 1000).toFixed(2)}s</span></div>`;
    }

  }

  // Code metadata from assertions
  if (assetManifest?.assertions) {
    const codeAssertion = assetManifest.assertions.find(a => a.label === 'lco.code');
    if (codeAssertion) {
      const data = codeAssertion.data as { function?: string; module?: string };
      if (data.module) {
        html += `<div class="meta-row"><span class="meta-label">module</span><span class="meta-value">${data.module}</span></div>`;
      }
      if (data.function) {
        html += `<div class="meta-row"><span class="meta-label">function</span><span class="meta-value">${data.function}</span></div>`;
      }
    }
  }

  // Signature info
  if (assetManifest?.signature_info) {
    html += `<div class="meta-row"><span class="meta-label">signed</span><span class="meta-value">${formatTimestamp(assetManifest.signature_info.time)}</span></div>`;
  }

  html += `</div>`;

  // Elegant link to show details
  if (hasDetailContent) {
    html += `<button class="view-details-link" id="view-details-link">Details</button>`;
  }

  // Environmental impact section (only for Model assets with token data)
  if (nodeData.assetType === 'Model' && nodeData.tokens) {
    const totalTokens = nodeData.tokens.input + nodeData.tokens.output;
    // Estimate CO2: ~0.0004g per token for efficient models, ~0.002g for larger models
    // Based on industry estimates for inference workloads
    const isLightModel = nodeData.label.toLowerCase().includes('flash') ||
                         nodeData.label.toLowerCase().includes('lite');
    const co2PerToken = isLightModel ? 0.0004 : 0.002;
    const co2Grams = totalTokens * co2PerToken;
    const impactLevel = co2Grams < 0.1 ? 'minimal' : co2Grams < 0.5 ? 'low' : 'moderate';
    const impactLabel = impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1);

    html += `<div class="sidebar-impact">`;
    html += `<img src="/icons/leaf.svg" alt="Environmental impact" class="impact-icon impact-${impactLevel}" />`;
    html += `<div class="impact-content">`;
    html += `<span class="impact-label impact-${impactLevel}">${impactLabel} impact</span>`;
    html += `<span class="impact-detail">${totalTokens.toLocaleString()} tokens · ~${co2Grams.toFixed(3)}g CO₂</span>`;
    html += `</div>`;
    html += `</div>`;
  }

  container.innerHTML = html;

  // Attach click handler for the link
  if (hasDetailContent) {
    const link = document.getElementById('view-details-link');
    link?.addEventListener('click', showDetailPanel);
  }
}

function renderStageOverview(
  container: HTMLElement,
  stageLabel: string,
  _stageId: string,
  nodes: LineageNodeData[],
  edges: LineageEdgeData[]
): void {
  // Update header with stage name
  const sidebarTitle = document.getElementById('sidebar-title');
  if (sidebarTitle) sidebarTitle.textContent = stageLabel;

  let html = '';

  // Type badge
  html += `<div class="sidebar-type-badge">Stage</div>`;

  // Group nodes by type
  const computeNodes = nodes.filter(n => n.nodeType === 'compute');
  const dataNodes = nodes.filter(n => n.nodeType === 'data');
  const attestNodes = nodes.filter(n => n.nodeType === 'attestation');

  // Count summary
  const total = nodes.length;
  html += `<div class="stage-summary">${total} node${total !== 1 ? 's' : ''}</div>`;

  // Node list grouped by type
  if (computeNodes.length > 0) {
    html += `<div class="stage-group">`;
    html += `<div class="stage-group-header">Computations</div>`;
    html += `<div class="stage-node-list">`;
    for (const node of computeNodes) {
      html += `<div class="stage-node-item">`;
      html += `<span class="stage-node-icon compute"></span>`;
      html += `<span class="stage-node-label">${escapeHtml(node.label)}</span>`;
      if (node.duration) {
        html += `<span class="stage-node-meta">${node.duration}</span>`;
      }
      html += `</div>`;
    }
    html += `</div></div>`;
  }

  if (dataNodes.length > 0) {
    html += `<div class="stage-group">`;
    html += `<div class="stage-group-header">Data</div>`;
    html += `<div class="stage-node-list">`;
    for (const node of dataNodes) {
      html += `<div class="stage-node-item">`;
      html += `<span class="stage-node-icon data"></span>`;
      html += `<span class="stage-node-label">${escapeHtml(node.label)}</span>`;
      if (node.assetType) {
        html += `<span class="stage-node-meta">${node.assetType}</span>`;
      }
      html += `</div>`;
    }
    html += `</div></div>`;
  }

  if (attestNodes.length > 0) {
    html += `<div class="stage-group">`;
    html += `<div class="stage-group-header">Attestations</div>`;
    html += `<div class="stage-node-list">`;
    for (const node of attestNodes) {
      html += `<div class="stage-node-item">`;
      html += `<span class="stage-node-icon attestation"></span>`;
      html += `<span class="stage-node-label">${escapeHtml(node.label)}</span>`;
      html += `</div>`;
    }
    html += `</div></div>`;
  }

  // Show flow connections
  const nodeIds = new Set(nodes.map(n => n.id));
  const internalEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target) && !e.isGate);
  const incomingEdges = edges.filter(e => !nodeIds.has(e.source) && nodeIds.has(e.target));
  const outgoingEdges = edges.filter(e => nodeIds.has(e.source) && !nodeIds.has(e.target));

  if (internalEdges.length > 0 || incomingEdges.length > 0 || outgoingEdges.length > 0) {
    html += `<div class="stage-group">`;
    html += `<div class="stage-group-header">Flow</div>`;
    html += `<div class="stage-flow">`;
    if (incomingEdges.length > 0) {
      html += `<div class="flow-item"><span class="flow-arrow">→</span> ${incomingEdges.length} incoming</div>`;
    }
    if (internalEdges.length > 0) {
      html += `<div class="flow-item"><span class="flow-arrow">⟷</span> ${internalEdges.length} internal</div>`;
    }
    if (outgoingEdges.length > 0) {
      html += `<div class="flow-item"><span class="flow-arrow">→</span> ${outgoingEdges.length} outgoing</div>`;
    }
    html += `</div></div>`;
  }

  container.innerHTML = html;
}

function renderDetailView(
  container: HTMLElement,
  _nodeData: LineageNodeData,
  assetManifest: NonNullable<LineageNodeData['assetManifest']>
): void {
  let html = '';

  // Query content
  if (assetManifest.content?.query) {
    html += `<div class="sidebar-content-section">`;
    html += `<div class="content-header">Query</div>`;
    html += `<div class="content-block">${escapeHtml(assetManifest.content.query)}</div>`;
    html += `</div>`;
  }

  // Response content
  if (assetManifest.content?.response) {
    html += `<div class="sidebar-content-section">`;
    html += `<div class="content-header">Response</div>`;
    html += `<div class="content-block">${escapeHtml(assetManifest.content.response)}</div>`;
    html += `</div>`;
  }

  // Source code
  if (assetManifest.source_code) {
    html += `<div class="sidebar-code-section">`;
    html += `<div class="code-header">Source Code</div>`;
    html += `<pre class="code-block"><code>${escapeHtml(assetManifest.source_code)}</code></pre>`;
    html += `</div>`;
  }

  // All content fields (excluding metadata already shown in summary)
  if (assetManifest.content) {
    const excludeKeys = [
      // Shown in summary metadata
      'query', 'response', 'response_length', 'model', 'input_tokens', 'output_tokens',
      'temperature', 'max_tokens', 'duration_ms', 'description',
      // Technical metadata not useful to display
      'total_tokens', 'api_duration_ms', 'total_duration_ms', 'prompt_length', 'system_length',
      'candidates', 'llm_response', 'length',
    ];
    const otherFields = Object.entries(assetManifest.content)
      .filter(([key]) => !excludeKeys.includes(key))
      .filter(([, value]) => value !== undefined && value !== null);

    if (otherFields.length > 0) {
      html += `<div class="sidebar-content-section">`;
      html += `<div class="content-header">Data</div>`;
      html += `<div class="detail-fields">`;
      for (const [key, value] of otherFields) {
        const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        html += `<div class="detail-field">`;
        html += `<span class="detail-field-key">${key}</span>`;
        html += `<span class="detail-field-value">${escapeHtml(displayValue)}</span>`;
        html += `</div>`;
      }
      html += `</div>`;
      html += `</div>`;
    }
  }

  // Assertions data
  if (assetManifest.assertions && assetManifest.assertions.length > 0) {
    html += `<div class="sidebar-content-section">`;
    html += `<div class="content-header">Assertions</div>`;
    for (const assertion of assetManifest.assertions) {
      html += `<div class="assertion-block">`;
      html += `<div class="assertion-label">${assertion.label}</div>`;
      html += `<pre class="assertion-data">${escapeHtml(JSON.stringify(assertion.data, null, 2))}</pre>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Ingredients
  if (assetManifest.ingredients && assetManifest.ingredients.length > 0) {
    html += `<div class="sidebar-content-section">`;
    html += `<div class="content-header">Ingredients</div>`;
    html += `<div class="ingredients-list">`;
    for (const ingredient of assetManifest.ingredients) {
      html += `<div class="ingredient-item">`;
      html += `<span class="ingredient-title">${escapeHtml(ingredient.title)}</span>`;
      html += `<span class="ingredient-rel">${ingredient.relationship}</span>`;
      html += `</div>`;
    }
    html += `</div>`;
    html += `</div>`;
  }

  // Signature info
  if (assetManifest.signature_info) {
    html += `<div class="sidebar-content-section">`;
    html += `<div class="content-header">Signature</div>`;
    html += `<div class="detail-fields">`;
    html += `<div class="detail-field"><span class="detail-field-key">algorithm</span><span class="detail-field-value">${assetManifest.signature_info.alg}</span></div>`;
    html += `<div class="detail-field"><span class="detail-field-key">issuer</span><span class="detail-field-value">${assetManifest.signature_info.issuer}</span></div>`;
    html += `<div class="detail-field"><span class="detail-field-key">time</span><span class="detail-field-value">${assetManifest.signature_info.time}</span></div>`;
    html += `</div>`;
    html += `</div>`;
  }

  // Format and instance ID
  html += `<div class="sidebar-content-section">`;
  html += `<div class="content-header">Manifest</div>`;
  html += `<div class="detail-fields">`;
  html += `<div class="detail-field"><span class="detail-field-key">format</span><span class="detail-field-value">${assetManifest.format}</span></div>`;
  html += `<div class="detail-field"><span class="detail-field-key">instance_id</span><span class="detail-field-value">${assetManifest.instance_id}</span></div>`;
  html += `<div class="detail-field"><span class="detail-field-key">generator</span><span class="detail-field-value">${assetManifest.claim_generator}</span></div>`;
  html += `</div>`;
  html += `</div>`;

  container.innerHTML = html;
}

async function main(): Promise<void> {
  const container = document.getElementById('sigma-container');
  if (!container) {
    console.error('Could not find sigma container');
    return;
  }

  // Load C2PA manifest data
  const lineageData = await loadManifest('/data/manifest.json');
  const state = await initializeGraph(lineageData);
  const { graph } = state;

  const NodeBorderProgram = createNodeBorderProgram({
    borders: [{ size: { value: 0.15 }, color: { attribute: 'borderColor' } }],
  });

  // Custom hover renderer that shows highlight ring but no label
  const drawHoverRing = (
    context: CanvasRenderingContext2D,
    data: {
      x: number;
      y: number;
      size: number;
      color: string;
      borderColor?: string;
    }
  ) => {
    const size = data.size + 4;
    context.beginPath();
    context.arc(data.x, data.y, size, 0, Math.PI * 2);
    context.closePath();
    context.lineWidth = 2;
    context.strokeStyle = data.borderColor ?? '#3b82f6';
    context.stroke();
  };

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

  // Track simple/detailed view state (used by click handler and edge rendering)
  let isSimpleView = false;
  const HIDE_EDGES_THRESHOLD = 1.2; // Hide edges when zoomed out further than this

  const updateOverlays = () => {
    const stagePositions = calculateStagePositions(
      renderer,
      lineageData.stages
    );
    renderStageLabels(stagePositions);

    // Render edges unless zoomed out too far
    const ratio = renderer.getCamera().ratio;
    if (ratio < HIDE_EDGES_THRESHOLD) {
      renderEdges(state, renderer);
    } else {
      // Clear the edge overlay when zoomed out too far
      const edgeContainer = document.getElementById('edge-overlay');
      if (edgeContainer) edgeContainer.innerHTML = '';
    }
    renderNodeOverlays(graph, renderer);
  };

  renderer.on('afterRender', updateOverlays);

  renderer.on('clickNode', ({ node }) => {
    const attrs = graph.getNodeAttributes(node);
    // Close detail panel when selecting a new node
    hideDetailPanel();

    // Check if this is a meta node (collapsed stage) in simple view
    if (isSimpleView && attrs.nodeType === 'meta') {
      const stageId = attrs.stage as string;
      const stageLabel = attrs.label as string;
      // Find all original nodes in this stage
      const stageNodes = lineageData.nodes.filter(n => n.stage === stageId);
      const sidebar = document.getElementById('sidebar-content');
      if (sidebar) {
        renderStageOverview(sidebar, stageLabel, stageId, stageNodes, lineageData.edges);
      }
      return;
    }

    renderSidebar({
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
    });
  });

  renderer.on('clickStage', () => {
    renderSidebar(null);
  });

  // Hover tooltip
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

  // Zoom-based LOD: auto-collapse when zoomed out, expand when zoomed in
  let isAnimating = false;
  const COLLAPSE_THRESHOLD = 0.75; // Collapse when ratio > this (zoomed out)
  const EXPAND_THRESHOLD = 0.5; // Expand when ratio < this (zoomed in)
  const lodIcon = document.getElementById(
    'lod-icon'
  ) as HTMLImageElement | null;

  // Store COMPLETE original node state at startup
  interface OriginalNodeState {
    x: number;
    y: number;
    label: string;
    nodeType: string;
    size: number;
    borderColor: string;
    color: string;
  }
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

  // Store original edges
  const originalAllEdges = [...state.allEdges];
  const originalSimpleEdges = [...state.simpleEdges];

  // Derive stage metadata from lineage data
  // All meta nodes go on a straight horizontal line at y=0.5
  const stageInfo: Record<string, { label: string; x: number; y: number }> = {};
  lineageData.stages.forEach((stage) => {
    const centerX = (stage.xStart + stage.xEnd) / 2;
    stageInfo[stage.id] = { label: stage.label, x: centerX, y: 0.5 };
  });

  const META_NODE_SIZE = 24;

  // Derive stage order from lineage data (already sorted by xStart)
  const stageOrder = lineageData.stages.map((s) => s.id);

  // Only create edges between adjacent stages in simple view
  const stageEdges = new Set<string>();
  for (let i = 0; i < stageOrder.length - 1; i++) {
    stageEdges.add(`${stageOrder[i]}->${stageOrder[i + 1]}`);
  }

  // Animation helper
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
    // Group nodes by stage
    const stageNodes = new Map<string, string[]>();
    graph.forEachNode((nodeId, attrs) => {
      const stage = attrs.stage as string;
      if (stage && stage !== 'unknown') {
        if (!stageNodes.has(stage)) stageNodes.set(stage, []);
        stageNodes.get(stage)!.push(nodeId);
      }
    });

    // Track representatives and animation targets
    const representatives = new Set<string>();
    const animationTargets = new Map<string, { x: number; y: number }>();

    stageNodes.forEach((nodeIds, stage) => {
      const info = stageInfo[stage];
      if (!info || nodeIds.length === 0) return;

      // First node is representative
      const repId = nodeIds[0];
      representatives.add(repId);
      animationTargets.set(repId, { x: info.x, y: info.y });

      // Style representative as meta node
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

      // Hide all other nodes in this stage
      for (let i = 1; i < nodeIds.length; i++) {
        graph.setNodeAttribute(nodeIds[i], 'hidden', true);
      }
    });

    // Create meta edges between stage representatives
    const metaEdges: LineageEdgeData[] = [];
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
          color: '#666666',
          isSimple: true,
        });
      }
    });

    state.simpleEdges = metaEdges;
    state.showAllEdges = false;

    // Animate representatives to stage centers
    animatePositions(animationTargets, 400, () => {
      renderer.refresh();
    });
  }

  function expandToDetailed() {
    // Restore ALL nodes to original state
    const animationTargets = new Map<string, { x: number; y: number }>();

    originalNodeState.forEach((original, nodeId) => {
      // Restore all attributes
      graph.setNodeAttribute(nodeId, 'label', original.label);
      graph.setNodeAttribute(nodeId, 'nodeType', original.nodeType);
      graph.setNodeAttribute(nodeId, 'size', original.size);
      graph.setNodeAttribute(nodeId, 'borderColor', original.borderColor);
      graph.setNodeAttribute(nodeId, 'color', original.color);
      graph.setNodeAttribute(nodeId, 'hidden', false);

      // Check if this node needs to animate back
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

    // Restore original edges
    state.allEdges = [...originalAllEdges];
    state.simpleEdges = [...originalSimpleEdges];
    state.showAllEdges = true;

    // Animate or just refresh
    if (animationTargets.size > 0) {
      animatePositions(animationTargets, 400, () => {
        renderer.refresh();
      });
    } else {
      renderer.refresh();
    }
  }

  // Camera listener for zoom-based LOD
  renderer.on('afterRender', () => {
    if (isAnimating) return;

    const ratio = renderer.getCamera().ratio;

    if (!isSimpleView && ratio > COLLAPSE_THRESHOLD) {
      // Zoomed out enough - collapse to simple view
      isSimpleView = true;
      if (lodIcon) {
        lodIcon.src = '/icons/simple.svg';
        lodIcon.alt = 'Simple view';
      }
      collapseToSimple();
    } else if (isSimpleView && ratio < EXPAND_THRESHOLD) {
      // Zoomed in enough - expand to detailed view
      isSimpleView = false;
      if (lodIcon) {
        lodIcon.src = '/icons/detail.svg';
        lodIcon.alt = 'Detailed view';
      }
      expandToDetailed();
    }
  });

  // Setup expand/popout button - toggles sidebar floating state
  const expandBtn = document.getElementById('sidebar-expand');
  const sidebar = document.getElementById('sidebar');
  if (expandBtn && sidebar) {
    expandBtn.addEventListener('click', () => {
      sidebar.classList.toggle('floating');
      expandBtn.textContent = sidebar.classList.contains('floating')
        ? '↙'
        : '↗';
    });
  }

  // Setup close button for detail panel
  const detailPanelClose = document.getElementById('detail-panel-close');
  if (detailPanelClose) {
    detailPanelClose.addEventListener('click', hideDetailPanel);
  }

  // Fit camera to show all stages - start at edge of detail view
  const camera = renderer.getCamera();
  camera.setState({ x: 0.5, y: 0.5, ratio: 0.5 });
}

document.addEventListener('DOMContentLoaded', main);
