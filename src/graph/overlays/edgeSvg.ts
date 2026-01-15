export function createEdgeSvgContainer(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'none';
  return svg;
}

export function addArrowheadMarker(svg: SVGSVGElement): void {
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
