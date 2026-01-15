import type Graph from 'graphology';
import type Sigma from 'sigma';
import type { AssetType, NodeType } from '../../types.js';
import {
  ASSET_TYPE_ICONS,
  DEFAULT_NODE_SIZE,
  NODE_ICON_PATHS,
  NODE_STYLES,
} from '../../ui/theme.js';

export function renderNodeOverlays(graph: Graph, renderer: Sigma): void {
  const container = document.getElementById('icon-overlay');
  if (!container) return;

  container.innerHTML = '';

  const camera = renderer.getCamera();
  const ratio = camera.ratio;
  const showLabels = ratio < 1.2;

  graph.forEachNode((nodeId, attrs) => {
    if (attrs.hidden === true) return;
    const nodeType = attrs.nodeType as NodeType;
    const assetType = attrs.assetType as AssetType | undefined;
    const iconPath =
      nodeType === 'compute'
        ? NODE_ICON_PATHS.compute
        : nodeType === 'data'
          ? (assetType && ASSET_TYPE_ICONS[assetType]) || NODE_ICON_PATHS[nodeType]
          : NODE_ICON_PATHS[nodeType];
    const style = NODE_STYLES[nodeType];
    if (!style || !iconPath) return;

    const pos = renderer.graphToViewport({
      x: attrs.x as number,
      y: attrs.y as number,
    });
    const displayData = renderer.getNodeDisplayData(nodeId);
    const size = displayData?.size ?? DEFAULT_NODE_SIZE;

    const iconEl = document.createElement('img');
    iconEl.className = 'node-icon';
    iconEl.src = iconPath;
    iconEl.style.left = `${pos.x}px`;
    iconEl.style.top = `${pos.y}px`;
    const iconSize = Math.min(size * 1.2, 18);
    iconEl.style.width = `${iconSize}px`;
    iconEl.style.height = `${iconSize}px`;
    if (style.iconColor !== '#1a1a1a') {
      if (style.iconColor === '#3b82f6') {
        iconEl.style.filter =
          'invert(45%) sepia(67%) saturate(2000%) hue-rotate(203deg) brightness(97%) contrast(96%)';
      } else if (style.iconColor === '#f59e0b') {
        iconEl.style.filter =
          'invert(62%) sepia(83%) saturate(1500%) hue-rotate(16deg) brightness(97%) contrast(95%)';
      }
    }
    container.appendChild(iconEl);

    if (!showLabels) return;
    const label = attrs.label as string;
    if (!label) return;
    const labelEl = document.createElement('div');
    labelEl.className = 'node-label';
    labelEl.style.left = `${pos.x}px`;
    labelEl.style.top = `${pos.y + size + 10}px`;
    labelEl.textContent = label;
    container.appendChild(labelEl);
  });
}
