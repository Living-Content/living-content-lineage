import type { LineageEdgeData, LineageNodeData } from '../../types.js';
import { renderDetailView } from './detailView.js';
import { renderSummaryView } from './summaryView.js';
import { renderStageOverview } from './stageOverview.js';

export interface SidebarController {
  renderEmpty: () => void;
  renderNode: (nodeData: LineageNodeData) => void;
  renderStageOverview: (
    stageLabel: string,
    nodes: LineageNodeData[],
    edges: LineageEdgeData[]
  ) => void;
  hideDetailPanel: () => void;
}

export function createSidebarController(): SidebarController {
  const sidebar = document.getElementById('sidebar-content');
  const sidebarTitle = document.getElementById('sidebar-title');
  const detailPanel = document.getElementById('detail-panel');
  const detailContent = document.getElementById('detail-panel-content');
  let sidebarDetailMode = false;

  if (!sidebar) {
    throw new Error('Sidebar container missing');
  }

  function showDetailPanel(): void {
    if (!detailPanel) return;
    sidebarDetailMode = true;
    detailPanel.classList.add('visible');
  }

  function hideDetailPanel(): void {
    if (!detailPanel) return;
    sidebarDetailMode = false;
    detailPanel.classList.remove('visible');
  }

  function renderEmpty(): void {
    if (sidebarTitle) sidebarTitle.textContent = 'CONTEXT';
    sidebar.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'sidebar-placeholder';
    placeholder.textContent = 'Select a node to view details';
    sidebar.appendChild(placeholder);
    if (detailPanel) {
      detailPanel.classList.remove('visible');
    }
  }

  function renderNode(nodeData: LineageNodeData): void {
    if (sidebarTitle) sidebarTitle.textContent = nodeData.label;

    renderSummaryView(sidebar, nodeData);

    const hasDetailContent =
      Boolean(nodeData.assetManifest?.sourceCode) ||
      Boolean(nodeData.assetManifest?.content?.response) ||
      Boolean(nodeData.assetManifest?.content?.query) ||
      Boolean(nodeData.assetManifest?.assertions?.length) ||
      Boolean(nodeData.assetManifest?.ingredients?.length);

    if (hasDetailContent && detailContent) {
      renderDetailView(detailContent, nodeData);
    } else if (detailContent) {
      detailContent.innerHTML = '';
    }

    if (hasDetailContent) {
      const link = document.createElement('button');
      link.className = 'view-details-link';
      link.textContent = 'Details';
      link.addEventListener('click', showDetailPanel);
      sidebar.appendChild(link);
    }

    if (detailPanel && !sidebarDetailMode) {
      detailPanel.classList.remove('visible');
    }
  }

  function renderStageOverviewView(
    stageLabel: string,
    nodes: LineageNodeData[],
    edges: LineageEdgeData[]
  ): void {
    if (sidebarTitle) sidebarTitle.textContent = stageLabel;
    renderStageOverview(sidebar, nodes, edges);
    if (detailPanel) {
      detailPanel.classList.remove('visible');
    }
  }

  return {
    renderEmpty,
    renderNode,
    renderStageOverview: renderStageOverviewView,
    hideDetailPanel,
  };
}
