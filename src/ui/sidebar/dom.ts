export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function formatTimestamp(timestamp: string): string {
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

export function createMetaRow(label: string, value: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'meta-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'meta-label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'meta-value';
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

export function addSection(
  container: HTMLElement,
  title: string,
  content: HTMLElement
): void {
  const section = document.createElement('div');
  section.className = 'sidebar-content-section';

  const header = document.createElement('div');
  header.className = 'content-header';
  header.textContent = title;

  section.appendChild(header);
  section.appendChild(content);
  container.appendChild(section);
}
