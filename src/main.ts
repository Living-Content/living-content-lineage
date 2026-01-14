/**
 * Main entry point for the lineage visualization POC.
 * Clean horizontal flow with connector ports and attestation nodes below.
 */

import Graph from "graphology";
import Sigma from "sigma";
import { createNodeBorderProgram } from "@sigma/node-border";
import { createSampleLineageGraph } from "./sampleData.js";
import type { LineageNodeData, LineageEdgeData, Stage } from "./types.js";

const NODE_STYLES: Record<string, { color: string; borderColor: string; iconColor: string; borderStyle?: string }> = {
  data: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  compute: { color: "#ffffff", borderColor: "#6366f1", iconColor: "#6366f1", borderStyle: "dashed" }, // indigo/blue
  attestation: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  filter: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  join: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  store: { color: "#fef3c7", borderColor: "#a855f7", iconColor: "#d97706", borderStyle: "solid" }, // purple ring, yellow fill
  media: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  meta: { color: "#f0f4f8", borderColor: "#3b82f6", iconColor: "#3b82f6" }, // blue border for meta nodes
};

// SVG icon paths (served from public/icons)
const NODE_ICON_PATHS: Record<string, string> = {
  data: "/icons/data.svg",
  compute: "/icons/compute.svg",
  attestation: "/icons/attestation.svg",
  filter: "/icons/filter.svg",
  join: "/icons/join.svg",
  store: "/icons/store.svg",
  media: "/icons/media.svg",
  meta: "/icons/collection.svg",
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

function initializeGraph(): GraphState {
  const graph = new Graph();
  const lineageData = createSampleLineageGraph();

  lineageData.nodes.forEach((node) => {
    const style = NODE_STYLES[node.nodeType] ?? { color: "#ffffff", borderColor: "#333", iconColor: "#333" };
    graph.addNode(node.id, {
      x: node.x ?? 0,
      y: node.y ?? 0,
      size: node.nodeType === "attestation" ? 16 : 14,
      color: style.color,
      borderColor: style.borderColor,
      iconColor: style.iconColor,
      borderSize: 0.15,
      label: node.label,
      nodeType: node.nodeType,
      shape: node.shape,
      stage: node.stage,
      manifest: node.manifest,
      role: node.role,
      type: "bordered",
      // Human metadata
      humanDescription: node.humanDescription,
      humanInputs: node.humanInputs,
      humanOutputs: node.humanOutputs,
      verifiedBy: node.verifiedBy,
      verifiedAt: node.verifiedAt,
      duration: node.duration,
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
  const container = document.getElementById("stage-labels");
  if (!container) return;

  container.innerHTML = "";

  stagePositions.forEach((pos, idx) => {
    if (idx > 0) {
      const divider = document.createElement("div");
      divider.className = "stage-divider";
      divider.style.left = `${pos.screenX}px`;
      container.appendChild(divider);
    }

    const labelDiv = document.createElement("div");
    labelDiv.className = "stage-label";
    labelDiv.style.left = `${pos.screenX + 15}px`;
    labelDiv.textContent = pos.stage.label;
    container.appendChild(labelDiv);
  });
}

function renderEdges(
  state: GraphState,
  renderer: Sigma
): void {
  const container = document.getElementById("edge-overlay");
  if (!container) return;

  container.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.pointerEvents = "none";

  // Add arrowhead marker - chevron style (>) with line meeting at point
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");
  // Chevron path: two lines forming > with the main line meeting at the point
  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "path");
  chevron.setAttribute("d", "M 0 0 L 8 5 L 0 10");
  chevron.setAttribute("fill", "none");
  chevron.setAttribute("stroke", "#1a1a1a");
  chevron.setAttribute("stroke-width", "1.5");
  chevron.setAttribute("stroke-linecap", "round");
  chevron.setAttribute("stroke-linejoin", "round");
  marker.appendChild(chevron);
  defs.appendChild(marker);
  svg.appendChild(defs);

  const edgesToShow = state.showAllEdges ? state.allEdges : state.simpleEdges;
  const { graph } = state;

  const portSize = 6;
  const defaultNodeRadius = 12;
  const metaNodeRadius = 20;

  // Track which ports have been rendered to avoid duplicates
  const renderedOutputPorts = new Set<string>();
  const renderedInputPorts = new Set<string>();

  // First pass: render ports for all connected nodes (once per node) - skip gate edges
  // Using subtle dark gray ports that don't distract
  edgesToShow.filter(e => !e.isGate).forEach((edge) => {
    const sourceAttrs = graph.getNodeAttributes(edge.source);
    const targetAttrs = graph.getNodeAttributes(edge.target);
    if (!sourceAttrs || !targetAttrs) return;
    // Skip if either node is explicitly hidden
    if (sourceAttrs.hidden === true || targetAttrs.hidden === true) return;

    const sourceRole = sourceAttrs.role as string;
    const targetRole = targetAttrs.role as string;
    const sourceIsMeta = sourceAttrs.nodeType === "meta";
    const targetIsMeta = targetAttrs.nodeType === "meta";
    const sourceRadius = sourceIsMeta ? metaNodeRadius : defaultNodeRadius;
    const targetRadius = targetIsMeta ? metaNodeRadius : defaultNodeRadius;

    // Draw output port (right side) for source node - unless it's a sink
    if (!renderedOutputPorts.has(edge.source) && sourceRole !== "sink") {
      const sourcePos = renderer.graphToViewport({
        x: sourceAttrs.x as number,
        y: sourceAttrs.y as number,
      });
      const sourcePortX = sourcePos.x + sourceRadius;

      const sourcePort = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      sourcePort.setAttribute("x", String(sourcePortX - 2));
      sourcePort.setAttribute("y", String(sourcePos.y - portSize / 2));
      sourcePort.setAttribute("width", String(portSize + 4));
      sourcePort.setAttribute("height", String(portSize));
      sourcePort.setAttribute("rx", "2");
      sourcePort.setAttribute("fill", "#4b5563"); // subtle gray
      svg.appendChild(sourcePort);
      renderedOutputPorts.add(edge.source);
    }

    // Draw input port (left side) for target node - unless it's a source
    if (!renderedInputPorts.has(edge.target) && targetRole !== "source") {
      const targetPos = renderer.graphToViewport({
        x: targetAttrs.x as number,
        y: targetAttrs.y as number,
      });
      const targetPortX = targetPos.x - targetRadius;

      const targetPort = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      targetPort.setAttribute("x", String(targetPortX - portSize - 2));
      targetPort.setAttribute("y", String(targetPos.y - portSize / 2));
      targetPort.setAttribute("width", String(portSize + 4));
      targetPort.setAttribute("height", String(portSize));
      targetPort.setAttribute("rx", "2");
      targetPort.setAttribute("fill", "#4b5563"); // subtle gray
      svg.appendChild(targetPort);
      renderedInputPorts.add(edge.target);
    }
  });

  // Second pass: draw regular edges (non-gate)
  edgesToShow.filter(e => !e.isGate).forEach((edge) => {
    const sourceAttrs = graph.getNodeAttributes(edge.source);
    const targetAttrs = graph.getNodeAttributes(edge.target);
    if (!sourceAttrs || !targetAttrs) return;
    if (sourceAttrs.hidden || targetAttrs.hidden) return;

    const sourceIsMeta = sourceAttrs.nodeType === "meta";
    const targetIsMeta = targetAttrs.nodeType === "meta";
    const sourceRadius = sourceIsMeta ? metaNodeRadius : defaultNodeRadius;
    const targetRadius = targetIsMeta ? metaNodeRadius : defaultNodeRadius;

    const sourcePos = renderer.graphToViewport({
      x: sourceAttrs.x as number,
      y: sourceAttrs.y as number,
    });
    const targetPos = renderer.graphToViewport({
      x: targetAttrs.x as number,
      y: targetAttrs.y as number,
    });

    const sourcePortX = sourcePos.x + sourceRadius;
    const targetPortX = targetPos.x - targetRadius;

    // Draw edge path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const startX = sourcePortX + portSize + 2;
    const endX = targetPortX - portSize - 4;
    const startY = sourcePos.y;
    const endY = targetPos.y;

    let d: string;
    const radius = 5;

    if (Math.abs(startY - endY) < 3) {
      // Straight horizontal line
      d = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      const goingUp = endY < startY;
      const r = Math.min(radius, Math.abs(endY - startY) / 2);

      if (goingUp) {
        // Source is below target - route up near target
        const turnX = endX - 25;
        d = `M ${startX} ${startY} `;
        d += `L ${turnX - r} ${startY} `;
        d += `Q ${turnX} ${startY} ${turnX} ${startY - r} `;
        d += `L ${turnX} ${endY + r} `;
        d += `Q ${turnX} ${endY} ${turnX + r} ${endY} `;
        d += `L ${endX} ${endY}`;
      } else {
        // Source is above target - route down near target
        const turnX = endX - 25;
        d = `M ${startX} ${startY} `;
        d += `L ${turnX - r} ${startY} `;
        d += `Q ${turnX} ${startY} ${turnX} ${startY + r} `;
        d += `L ${turnX} ${endY - r} `;
        d += `Q ${turnX} ${endY} ${turnX + r} ${endY} `;
        d += `L ${endX} ${endY}`;
      }
    }

    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#1a1a1a");
    path.setAttribute("stroke-width", "1");
    path.setAttribute("marker-end", "url(#arrowhead)");

    svg.appendChild(path);
  });

  // Third pass: draw gate edges (electrical plug style connector)
  // In screen coordinates: larger screen Y = DOWN
  // Source node is at top (main flow), target (attestation) is below it (larger screen Y)
  edgesToShow.filter(e => e.isGate).forEach((edge) => {
    const sourceAttrs = graph.getNodeAttributes(edge.source);
    const targetAttrs = graph.getNodeAttributes(edge.target);
    if (!sourceAttrs || !targetAttrs) return;
    if (sourceAttrs.hidden || targetAttrs.hidden) return;

    const sourceIsMeta = sourceAttrs.nodeType === "meta";
    const sourceRadius = sourceIsMeta ? metaNodeRadius : defaultNodeRadius;

    const sourcePos = renderer.graphToViewport({
      x: sourceAttrs.x as number,
      y: sourceAttrs.y as number,
    });
    const targetPos = renderer.graphToViewport({
      x: targetAttrs.x as number,
      y: targetAttrs.y as number,
    });

    const plugWidth = 12;
    const plugHeight = 16;
    const prongWidth = 3;
    const prongHeight = 6;

    // Determine direction: is target below source in screen coords?
    const goingDown = targetPos.y > sourcePos.y;

    // Plug connector below the source node (larger screen Y = down)
    const plugX = sourcePos.x;
    const plugY = goingDown
      ? sourcePos.y + sourceRadius + 6  // Below source
      : sourcePos.y - sourceRadius - 6 - plugHeight;  // Above source

    // Draw plug body (rounded rectangle)
    const plugBody = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    plugBody.setAttribute("x", String(plugX - plugWidth/2));
    plugBody.setAttribute("y", String(plugY));
    plugBody.setAttribute("width", String(plugWidth));
    plugBody.setAttribute("height", String(plugHeight));
    plugBody.setAttribute("rx", "3");
    plugBody.setAttribute("fill", "#22c55e");
    svg.appendChild(plugBody);

    // Draw two prongs (extending toward target)
    const prongSpacing = 3;
    const prong1Y = goingDown ? plugY + plugHeight : plugY - prongHeight;

    const prong1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    prong1.setAttribute("x", String(plugX - prongSpacing - prongWidth/2));
    prong1.setAttribute("y", String(prong1Y));
    prong1.setAttribute("width", String(prongWidth));
    prong1.setAttribute("height", String(prongHeight));
    prong1.setAttribute("rx", "1");
    prong1.setAttribute("fill", "#22c55e");
    svg.appendChild(prong1);

    const prong2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    prong2.setAttribute("x", String(plugX + prongSpacing - prongWidth/2));
    prong2.setAttribute("y", String(prong1Y));
    prong2.setAttribute("width", String(prongWidth));
    prong2.setAttribute("height", String(prongHeight));
    prong2.setAttribute("rx", "1");
    prong2.setAttribute("fill", "#22c55e");
    svg.appendChild(prong2);

    // Draw vertical line from plug to attestation node
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const startY = goingDown ? prong1Y + prongHeight : prong1Y;
    const endY = goingDown
      ? targetPos.y - defaultNodeRadius - 8  // Stop before target (above it)
      : targetPos.y + defaultNodeRadius + 8; // Stop after target (below it)

    const d = `M ${plugX} ${startY} L ${plugX} ${endY}`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#22c55e");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);

    // Arrow pointing into attestation node
    const arrowSize = 6;
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    if (goingDown) {
      // Arrow pointing down
      arrow.setAttribute("points", `${plugX},${endY + 8} ${plugX - arrowSize},${endY} ${plugX + arrowSize},${endY}`);
    } else {
      // Arrow pointing up
      arrow.setAttribute("points", `${plugX},${endY - 8} ${plugX - arrowSize},${endY} ${plugX + arrowSize},${endY}`);
    }
    arrow.setAttribute("fill", "#22c55e");
    svg.appendChild(arrow);
  });

  container.appendChild(svg);
}

function renderNodeOverlays(graph: Graph, renderer: Sigma): void {
  const container = document.getElementById("icon-overlay");
  if (!container) return;

  container.innerHTML = "";

  const camera = renderer.getCamera();
  const ratio = camera.ratio;
  const showLabels = ratio < 1.2;

  graph.forEachNode((nodeId, attrs) => {
    if (attrs.hidden === true) return;
    const nodeType = attrs.nodeType as string;
    const iconPath = NODE_ICON_PATHS[nodeType];
    const style = NODE_STYLES[nodeType];
    if (!style) return;

    const pos = renderer.graphToViewport({ x: attrs.x as number, y: attrs.y as number });
    const displayData = renderer.getNodeDisplayData(nodeId);
    const size = displayData?.size ?? 14;

    // Render SVG icon
    if (iconPath) {
      const iconEl = document.createElement("img");
      iconEl.className = "node-icon";
      iconEl.src = iconPath;
      iconEl.style.left = `${pos.x}px`;
      iconEl.style.top = `${pos.y}px`;
      iconEl.style.width = `${size * 1.2}px`;
      iconEl.style.height = `${size * 1.2}px`;
      // Apply color via CSS filter for currentColor SVGs
      if (style.iconColor !== "#1a1a1a") {
        // Convert hex to HSL filter (simplified - blue for compute, yellow for store)
        if (style.iconColor === "#3b82f6") {
          iconEl.style.filter = "invert(45%) sepia(67%) saturate(2000%) hue-rotate(203deg) brightness(97%) contrast(96%)";
        } else if (style.iconColor === "#f59e0b") {
          iconEl.style.filter = "invert(62%) sepia(83%) saturate(1500%) hue-rotate(16deg) brightness(97%) contrast(95%)";
        }
      }
      container.appendChild(iconEl);
    }

    if (showLabels) {
      const label = attrs.label as string;
      if (label) {
        const labelEl = document.createElement("div");
        labelEl.className = "node-label";
        labelEl.style.left = `${pos.x}px`;
        labelEl.style.top = `${pos.y + size + 10}px`;
        labelEl.textContent = label;
        container.appendChild(labelEl);
      }
    }
  });
}

function renderSidebar(nodeData: LineageNodeData | null): void {
  const sidebar = document.getElementById("sidebar-content");
  if (!sidebar) return;

  if (!nodeData) {
    sidebar.innerHTML = '<p class="sidebar-placeholder">Select a node to view details</p>';
    return;
  }

  const mainRows: Array<{ label: string; value: string }> = [];
  const detailRows: Array<{ label: string; value: string }> = [];

  // Main info
  if (nodeData.humanDescription) {
    mainRows.push({ label: "description", value: nodeData.humanDescription });
  }

  if (nodeData.verifiedBy) {
    mainRows.push({ label: "verified by", value: nodeData.verifiedBy });
  }

  if (nodeData.verifiedAt) {
    mainRows.push({ label: "when", value: nodeData.verifiedAt });
  }

  if (nodeData.duration) {
    mainRows.push({ label: "took", value: nodeData.duration });
  }

  // Detail rows (hidden by default)
  detailRows.push({ label: "type", value: nodeData.nodeType });
  detailRows.push({ label: "id", value: nodeData.id });

  if (nodeData.manifest) {
    detailRows.push({ label: "generator", value: nodeData.manifest.claim_generator_info.name });
  }

  const mainHtml = mainRows
    .map(row => `<div class="sidebar-row"><span class="sidebar-label">${row.label}</span><span class="sidebar-value">${row.value}</span></div>`)
    .join("");

  const detailHtml = detailRows
    .map(row => `<div class="sidebar-row"><span class="sidebar-label">${row.label}</span><span class="sidebar-value">${row.value}</span></div>`)
    .join("");

  sidebar.innerHTML = `
    ${mainHtml}
    <div class="sidebar-details" id="sidebar-details" style="display: none;">${detailHtml}</div>
    <button class="details-toggle" id="details-toggle">Show details</button>
  `;

  // Attach toggle handler
  const btn = document.getElementById("details-toggle");
  const details = document.getElementById("sidebar-details");
  if (btn && details) {
    btn.onclick = () => {
      if (details.style.display === "none") {
        details.style.display = "block";
        btn.textContent = "Hide details";
      } else {
        details.style.display = "none";
        btn.textContent = "Show details";
      }
    };
  }
}

function main(): void {
  const container = document.getElementById("sigma-container");
  if (!container) {
    console.error("Could not find sigma container");
    return;
  }

  const state = initializeGraph();
  const { graph } = state;
  const lineageData = createSampleLineageGraph();

  const NodeBorderProgram = createNodeBorderProgram({
    borders: [
      { size: { value: 0.15 }, color: { attribute: "borderColor" } },
    ],
  });

  // Custom hover renderer that shows highlight ring but no label
  const drawHoverRing = (
    context: CanvasRenderingContext2D,
    data: { x: number; y: number; size: number; color: string; borderColor?: string },
  ) => {
    const size = data.size + 4;
    context.beginPath();
    context.arc(data.x, data.y, size, 0, Math.PI * 2);
    context.closePath();
    context.lineWidth = 2;
    context.strokeStyle = data.borderColor ?? "#3b82f6";
    context.stroke();
  };

  const renderer = new Sigma(graph, container, {
    allowInvalidContainer: true,
    renderLabels: false,
    renderEdgeLabels: false,
    enableEdgeEvents: false,
    labelRenderedSizeThreshold: Infinity,
    zoomingRatio: 1.2,
    defaultNodeColor: "#ffffff",
    minCameraRatio: 0.2,
    maxCameraRatio: 4,
    nodeProgramClasses: {
      bordered: NodeBorderProgram,
    },
    defaultNodeType: "bordered",
    defaultDrawNodeHover: drawHoverRing,
    defaultDrawNodeLabel: () => {},
  });

  const updateOverlays = () => {
    const stagePositions = calculateStagePositions(renderer, lineageData.stages);
    renderStageLabels(stagePositions);
    renderEdges(state, renderer);
    renderNodeOverlays(graph, renderer);
  };

  renderer.on("afterRender", updateOverlays);

  renderer.on("clickNode", ({ node }) => {
    const attrs = graph.getNodeAttributes(node);
    renderSidebar({
      id: node,
      label: attrs.label as string,
      nodeType: attrs.nodeType as LineageNodeData["nodeType"],
      shape: attrs.shape as LineageNodeData["shape"],
      manifest: attrs.manifest as LineageNodeData["manifest"],
      humanDescription: attrs.humanDescription as string | undefined,
      humanInputs: attrs.humanInputs as string[] | undefined,
      humanOutputs: attrs.humanOutputs as string[] | undefined,
      verifiedBy: attrs.verifiedBy as string | undefined,
      verifiedAt: attrs.verifiedAt as string | undefined,
      duration: attrs.duration as string | undefined,
    });
  });

  renderer.on("clickStage", () => {
    renderSidebar(null);
  });

  // Cursor change on hover
  renderer.on("enterNode", () => {
    container.style.cursor = "pointer";
  });

  renderer.on("leaveNode", () => {
    container.style.cursor = "grab";
  });

  // Setup simple view toggle - collapses each stage into a meta node
  const toggleSimpleBtn = document.getElementById("toggle-simple");
  const toggleIcon = document.getElementById("toggle-icon") as HTMLImageElement | null;
  let isSimpleView = false;
  let isAnimating = false;

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

  // Stage metadata for meta nodes
  const stageInfo: Record<string, { label: string; x: number; y: number }> = {
    input: { label: "Input", x: 140, y: 200 },
    retrieve: { label: "Retrieve", x: 340, y: 200 },
    generate: { label: "Generate", x: 640, y: 200 },
    image: { label: "Image", x: 940, y: 200 },
    output: { label: "Output", x: 1180, y: 200 },
  };

  const META_NODE_SIZE = 24;

  // Compute stage-to-stage edges from original edges
  const stageEdges = new Set<string>();
  originalAllEdges.forEach(edge => {
    const sourceStage = graph.getNodeAttribute(edge.source, "stage") as string;
    const targetStage = graph.getNodeAttribute(edge.target, "stage") as string;
    if (sourceStage && targetStage && sourceStage !== targetStage) {
      stageEdges.add(`${sourceStage}->${targetStage}`);
    }
  });

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
        x: graph.getNodeAttribute(nodeId, "x") as number,
        y: graph.getNodeAttribute(nodeId, "y") as number,
      });
    });

    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      targets.forEach((target, nodeId) => {
        const start = startPositions.get(nodeId)!;
        graph.setNodeAttribute(nodeId, "x", start.x + (target.x - start.x) * eased);
        graph.setNodeAttribute(nodeId, "y", start.y + (target.y - start.y) * eased);
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
      if (stage && stage !== "unknown") {
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
      graph.setNodeAttribute(repId, "label", info.label);
      graph.setNodeAttribute(repId, "nodeType", "meta");
      graph.setNodeAttribute(repId, "size", META_NODE_SIZE);
      graph.setNodeAttribute(repId, "borderColor", NODE_STYLES.meta.borderColor);
      graph.setNodeAttribute(repId, "color", NODE_STYLES.meta.color);
      graph.setNodeAttribute(repId, "hidden", false);

      // Hide all other nodes in this stage
      for (let i = 1; i < nodeIds.length; i++) {
        graph.setNodeAttribute(nodeIds[i], "hidden", true);
      }
    });

    // Create meta edges between stage representatives
    const metaEdges: LineageEdgeData[] = [];
    stageEdges.forEach(edgeKey => {
      const [sourceStage, targetStage] = edgeKey.split("->") as [string, string];
      const sourceNodes = stageNodes.get(sourceStage);
      const targetNodes = stageNodes.get(targetStage);
      if (sourceNodes?.[0] && targetNodes?.[0]) {
        metaEdges.push({
          id: `meta-${sourceStage}-${targetStage}`,
          source: sourceNodes[0],
          target: targetNodes[0],
          color: "#666666",
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
      graph.setNodeAttribute(nodeId, "label", original.label);
      graph.setNodeAttribute(nodeId, "nodeType", original.nodeType);
      graph.setNodeAttribute(nodeId, "size", original.size);
      graph.setNodeAttribute(nodeId, "borderColor", original.borderColor);
      graph.setNodeAttribute(nodeId, "color", original.color);
      graph.setNodeAttribute(nodeId, "hidden", false);

      // Check if this node needs to animate back
      const currentX = graph.getNodeAttribute(nodeId, "x") as number;
      const currentY = graph.getNodeAttribute(nodeId, "y") as number;
      const dx = Math.abs(currentX - original.x);
      const dy = Math.abs(currentY - original.y);

      if (dx > 1 || dy > 1) {
        animationTargets.set(nodeId, { x: original.x, y: original.y });
      } else {
        graph.setNodeAttribute(nodeId, "x", original.x);
        graph.setNodeAttribute(nodeId, "y", original.y);
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

  if (toggleSimpleBtn) {
    toggleSimpleBtn.addEventListener("click", () => {
      if (isAnimating) return;

      isSimpleView = !isSimpleView;

      if (toggleIcon) {
        toggleIcon.src = isSimpleView ? "/icons/detail.svg" : "/icons/simple.svg";
        toggleIcon.alt = isSimpleView ? "Detailed view" : "Simple view";
      }

      if (isSimpleView) {
        collapseToSimple();
      } else {
        expandToDetailed();
      }
    });
  }

  // Setup expand/popout button - toggles sidebar floating state
  const expandBtn = document.getElementById("sidebar-expand");
  const sidebar = document.getElementById("sidebar");
  if (expandBtn && sidebar) {
    expandBtn.addEventListener("click", () => {
      sidebar.classList.toggle("floating");
      expandBtn.textContent = sidebar.classList.contains("floating") ? "↙" : "↗";
    });
  }


  const camera = renderer.getCamera();
  camera.setState({ x: 0.5, y: 0.5, ratio: 0.7 });
}

document.addEventListener("DOMContentLoaded", main);
