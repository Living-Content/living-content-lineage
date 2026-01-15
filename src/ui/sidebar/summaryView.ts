import type { LineageNodeData } from '../../types.js';
import { isPrimaryContentKey } from './constants.js';
import { clearElement, createMetaRow, formatTimestamp } from './dom.js';
import { buildImpactSection } from './impactSection.js';

export function renderSummaryView(
  container: HTMLElement,
  nodeData: LineageNodeData
): void {
  clearElement(container);

  if (nodeData.assetType) {
    const badge = document.createElement('div');
    badge.className = 'sidebar-type-badge';
    badge.textContent = nodeData.assetType;
    container.appendChild(badge);
  }

  if (nodeData.humanDescription) {
    const description = document.createElement('div');
    description.className = 'sidebar-description';
    description.textContent = nodeData.humanDescription;
    container.appendChild(description);
  }

  const meta = document.createElement('div');
  meta.className = 'sidebar-meta';

  if (nodeData.duration) {
    meta.appendChild(createMetaRow('duration', nodeData.duration));
  }

  const content = nodeData.assetManifest?.content;
  if (isPrimaryContentKey('model') && content?.model) {
    meta.appendChild(createMetaRow('model', String(content.model)));
  }
  if (isPrimaryContentKey('inputTokens') && content?.inputTokens !== undefined) {
    const outputTokens = content.outputTokens ?? 0;
    meta.appendChild(
      createMetaRow('tokens', `${content.inputTokens} in / ${outputTokens} out`)
    );
  }
  if (
    isPrimaryContentKey('temperature') &&
    content?.temperature !== undefined
  ) {
    meta.appendChild(createMetaRow('temp', String(content.temperature)));
  }
  if (isPrimaryContentKey('responseLength') && content?.responseLength) {
    meta.appendChild(
      createMetaRow(
        'length',
        `${content.responseLength.toLocaleString()} chars`
      )
    );
  }
  if (isPrimaryContentKey('durationMs') && content?.durationMs) {
    meta.appendChild(
      createMetaRow('api time', `${(content.durationMs / 1000).toFixed(2)}s`)
    );
  }

  const codeAssertion = nodeData.assetManifest?.assertions?.find(
    (assertion) => assertion.label === 'lco.code'
  );
  if (
    codeAssertion &&
    codeAssertion.data &&
    typeof codeAssertion.data === 'object'
  ) {
    const data = codeAssertion.data as { function?: string; module?: string };
    if (data.module) {
      meta.appendChild(createMetaRow('module', data.module));
    }
    if (data.function) {
      meta.appendChild(createMetaRow('function', data.function));
    }
  }

  if (nodeData.assetManifest?.signatureInfo?.time) {
    meta.appendChild(
      createMetaRow(
        'signed',
        formatTimestamp(nodeData.assetManifest.signatureInfo.time)
      )
    );
  }

  container.appendChild(meta);
  buildImpactSection(nodeData, container);
}
