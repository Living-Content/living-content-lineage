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
  const sidebarContainer = document.getElementById('sidebar');
  const sidebarTitle = document.getElementById('sidebar-title');
  const detailPanel = document.getElementById('detail-panel');
  const detailContent = document.getElementById('detail-panel-content');
  let sidebarDetailMode = false;
  let detailToggle: HTMLButtonElement | null = null;

  if (!sidebar) {
    throw new Error('Sidebar container missing');
  }
  const sidebarEl = sidebar;

  function showDetailPanel(): void {
    if (!detailPanel) return;
    sidebarDetailMode = true;
    sidebarContainer?.classList.add('detail-open');
    if (detailToggle) {
      detailToggle.disabled = true;
      detailToggle.setAttribute('aria-disabled', 'true');
    }
    detailPanel.classList.add('visible');
  }

  function hideDetailPanel(): void {
    if (!detailPanel) return;
    sidebarDetailMode = false;
    sidebarContainer?.classList.remove('detail-open');
    if (detailToggle) {
      detailToggle.disabled = false;
      detailToggle.removeAttribute('aria-disabled');
    }
    detailPanel.classList.remove('visible');
  }

  function renderEmpty(): void {
    if (sidebarTitle) sidebarTitle.textContent = 'CONTEXT';
    sidebarEl.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'sidebar-placeholder';
    placeholder.textContent = 'Select a node to view details';
    sidebarEl.appendChild(placeholder);
    if (detailPanel) {
      detailPanel.classList.remove('visible');
    }
    sidebarContainer?.classList.remove('detail-open');
    sidebarContainer?.classList.add('hidden');
  }

  function renderNode(nodeData: LineageNodeData): void {
    sidebarContainer?.classList.remove('hidden');
    if (sidebarTitle) sidebarTitle.textContent = nodeData.label;

    renderSummaryView(sidebarEl, nodeData);

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

    detailToggle = null;
    if (hasDetailContent) {
      const link = document.createElement('button');
      link.className = 'view-details-link';
      link.textContent = 'Details';
      link.addEventListener('click', showDetailPanel);
      if (sidebarDetailMode) {
        link.disabled = true;
        link.setAttribute('aria-disabled', 'true');
      }
      sidebarEl.appendChild(link);
      detailToggle = link;
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
    sidebarContainer?.classList.remove('hidden');
    if (sidebarTitle) sidebarTitle.textContent = stageLabel;
    renderStageOverview(sidebarEl, nodes, edges);
    if (detailPanel) {
      detailPanel.classList.remove('visible');
    }
    sidebarContainer?.classList.remove('detail-open');
  }

  return {
    renderEmpty,
    renderNode,
    renderStageOverview: renderStageOverviewView,
    hideDetailPanel,
  };
}
