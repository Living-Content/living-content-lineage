import type { LineageEdgeData, LineageNodeData } from '../../types.js';
import { clearElement } from './dom.js';

export function renderStageOverview(
  container: HTMLElement,
  nodes: LineageNodeData[],
  edges: LineageEdgeData[]
): void {
  clearElement(container);

  const badge = document.createElement('div');
  badge.className = 'sidebar-type-badge';
  badge.textContent = 'Stage';
  container.appendChild(badge);

  const summary = document.createElement('div');
  summary.className = 'stage-summary';
  summary.textContent = `${nodes.length} node${nodes.length !== 1 ? 's' : ''}`;
  container.appendChild(summary);

  const computeNodes = nodes.filter((node) => node.nodeType === 'compute');
  const dataNodes = nodes.filter((node) => node.nodeType === 'data');
  const attestNodes = nodes.filter((node) => node.nodeType === 'attestation');

  const groups: Array<{ label: string; nodes: LineageNodeData[] }> = [
    { label: 'Computations', nodes: computeNodes },
    { label: 'Data', nodes: dataNodes },
    { label: 'Attestations', nodes: attestNodes },
  ];

  groups.forEach((group) => {
    if (group.nodes.length === 0) return;
    const groupEl = document.createElement('div');
    groupEl.className = 'stage-group';

    const header = document.createElement('div');
    header.className = 'stage-group-header';
    header.textContent = group.label;

    const list = document.createElement('div');
    list.className = 'stage-node-list';

    group.nodes.forEach((node) => {
      const item = document.createElement('div');
      item.className = 'stage-node-item';

      const icon = document.createElement('span');
      icon.className = `stage-node-icon ${node.nodeType}`;

      const label = document.createElement('span');
      label.className = 'stage-node-label';
      label.textContent = node.label;

      item.appendChild(icon);
      item.appendChild(label);

      if (node.duration) {
        const meta = document.createElement('span');
        meta.className = 'stage-node-meta';
        meta.textContent = node.duration;
        item.appendChild(meta);
      } else if (node.assetType) {
        const meta = document.createElement('span');
        meta.className = 'stage-node-meta';
        meta.textContent = node.assetType;
        item.appendChild(meta);
      }

      list.appendChild(item);
    });

    groupEl.appendChild(header);
    groupEl.appendChild(list);
    container.appendChild(groupEl);
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const internalEdges = edges.filter(
    (edge) =>
      nodeIds.has(edge.source) && nodeIds.has(edge.target) && !edge.isGate
  );
  const incomingEdges = edges.filter(
    (edge) => !nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
  const outgoingEdges = edges.filter(
    (edge) => nodeIds.has(edge.source) && !nodeIds.has(edge.target)
  );

  if (
    internalEdges.length > 0 ||
    incomingEdges.length > 0 ||
    outgoingEdges.length > 0
  ) {
    const flowGroup = document.createElement('div');
    flowGroup.className = 'stage-group';

    const header = document.createElement('div');
    header.className = 'stage-group-header';
    header.textContent = 'Flow';

    const flowList = document.createElement('div');
    flowList.className = 'stage-flow';

    if (incomingEdges.length > 0) {
      const item = document.createElement('div');
      item.className = 'flow-item';
      const arrow = document.createElement('span');
      arrow.className = 'flow-arrow';
      arrow.textContent = '→';
      item.appendChild(arrow);
      item.appendChild(
        document.createTextNode(`${incomingEdges.length} incoming`)
      );
      flowList.appendChild(item);
    }
    if (internalEdges.length > 0) {
      const item = document.createElement('div');
      item.className = 'flow-item';
      const arrow = document.createElement('span');
      arrow.className = 'flow-arrow';
      arrow.textContent = '⟷';
      item.appendChild(arrow);
      item.appendChild(
        document.createTextNode(`${internalEdges.length} internal`)
      );
      flowList.appendChild(item);
    }
    if (outgoingEdges.length > 0) {
      const item = document.createElement('div');
      item.className = 'flow-item';
      const arrow = document.createElement('span');
      arrow.className = 'flow-arrow';
      arrow.textContent = '→';
      item.appendChild(arrow);
      item.appendChild(
        document.createTextNode(`${outgoingEdges.length} outgoing`)
      );
      flowList.appendChild(item);
    }

    flowGroup.appendChild(header);
    flowGroup.appendChild(flowList);
    container.appendChild(flowGroup);
  }
}
