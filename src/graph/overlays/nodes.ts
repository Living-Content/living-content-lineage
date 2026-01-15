import type Graph from 'graphology';
import type Sigma from 'sigma';
import type { AssetType, NodeType } from '../../types.js';
import {
  ASSET_TYPE_ICONS,
  DEFAULT_NODE_SIZE,
  getCssVar,
  NODE_ICON_PATHS,
  NODE_STYLES,
} from '../../ui/theme.js';

interface OverlayEntry {
  icon: HTMLImageElement;
  label?: HTMLDivElement;
}

const overlayCache = new WeakMap<HTMLElement, Map<string, OverlayEntry>>();

function getOverlayCache(container: HTMLElement): Map<string, OverlayEntry> {
  const cached = overlayCache.get(container);
  if (cached) return cached;
  const next = new Map<string, OverlayEntry>();
  overlayCache.set(container, next);
  return next;
}

export function renderNodeOverlays(graph: Graph, renderer: Sigma): void {
  const container = document.getElementById('icon-overlay');
  if (!container) return;
  const cache = getOverlayCache(container);

  const camera = renderer.getCamera();
  const ratio = camera.ratio;
  const showLabels = ratio < 1.2;

  graph.forEachNode((nodeId, attrs) => {
    const cached = cache.get(nodeId);
    if (attrs.hidden === true) {
      if (cached) {
        cached.icon.style.display = 'none';
        if (cached.label) cached.label.style.display = 'none';
      }
      return;
    }
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

    let entry = cached;
    if (!entry) {
      const iconEl = document.createElement('img');
      iconEl.className = 'node-icon';
      container.appendChild(iconEl);
      entry = { icon: iconEl };
      cache.set(nodeId, entry);
    }

    const iconEl = entry.icon;
    iconEl.style.display = 'block';
    if (iconEl.src !== iconPath) {
      iconEl.src = iconPath;
    }
    iconEl.style.left = `${pos.x}px`;
    iconEl.style.top = `${pos.y}px`;
    const iconSize = Math.min(size * 1.2, 18);
    iconEl.style.width = `${iconSize}px`;
    iconEl.style.height = `${iconSize}px`;
    const accentBlue = getCssVar('--color-icon-accent-blue', '#3b82f6');
    const accentAmber = getCssVar('--color-icon-accent-amber', '#f59e0b');
    if (style.iconColor === accentBlue) {
      iconEl.style.filter = getCssVar(
        '--filter-icon-blue',
        'invert(45%) sepia(67%) saturate(2000%) hue-rotate(203deg) brightness(97%) contrast(96%)'
      );
    } else if (style.iconColor === accentAmber) {
      iconEl.style.filter = getCssVar(
        '--filter-icon-amber',
        'invert(62%) sepia(83%) saturate(1500%) hue-rotate(16deg) brightness(97%) contrast(95%)'
      );
    } else {
      iconEl.style.filter = '';
    }

    if (!showLabels) {
      if (entry.label) entry.label.style.display = 'none';
      return;
    }
    const label = attrs.label as string;
    if (!label) {
      if (entry.label) entry.label.style.display = 'none';
      return;
    }
    if (!entry.label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'node-label';
      container.appendChild(labelEl);
      entry.label = labelEl;
    }
    const labelEl = entry.label;
    labelEl.style.display = 'block';
    labelEl.style.left = `${pos.x}px`;
    labelEl.style.top = `${pos.y + size + 10}px`;
    labelEl.textContent = label;
  });
}
