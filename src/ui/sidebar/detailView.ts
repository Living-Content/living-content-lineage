import type { LineageNodeData } from '../../types.js';
import { CONTENT_EXCLUDE_KEYS } from './constants.js';
import { addSection, clearElement, createMetaRow } from './dom.js';

export function renderDetailView(
  container: HTMLElement,
  nodeData: LineageNodeData
): void {
  clearElement(container);

  const assetManifest = nodeData.assetManifest;
  if (!assetManifest) return;

  if (assetManifest.content?.query) {
    const block = document.createElement('div');
    block.className = 'content-block';
    block.textContent = String(assetManifest.content.query);
    addSection(container, 'Query', block);
  }

  if (assetManifest.content?.response) {
    const block = document.createElement('div');
    block.className = 'content-block';
    block.textContent = String(assetManifest.content.response);
    addSection(container, 'Response', block);
  }

  if (assetManifest.sourceCode) {
    const pre = document.createElement('pre');
    pre.className = 'code-block';
    const code = document.createElement('code');
    code.textContent = assetManifest.sourceCode;
    pre.appendChild(code);
    addSection(container, 'Source Code', pre);
  }

  if (assetManifest.content) {
    const otherFields = Object.entries(assetManifest.content)
      .filter(([key]) => !CONTENT_EXCLUDE_KEYS.has(key))
      .filter(([, value]) => value !== undefined && value !== null);

    if (otherFields.length > 0) {
      const wrapper = document.createElement('div');
      wrapper.className = 'detail-fields';

      otherFields.forEach(([key, value]) => {
        const field = document.createElement('div');
        field.className = 'detail-field';

        const keyEl = document.createElement('span');
        keyEl.className = 'detail-field-key';
        keyEl.textContent = key;

        const valueEl = document.createElement('span');
        valueEl.className = 'detail-field-value';
        valueEl.textContent =
          typeof value === 'object'
            ? JSON.stringify(value, null, 2)
            : String(value);

        field.appendChild(keyEl);
        field.appendChild(valueEl);
        wrapper.appendChild(field);
      });

      addSection(container, 'Data', wrapper);
    }
  }

  if (assetManifest.assertions && assetManifest.assertions.length > 0) {
    const assertionsWrapper = document.createElement('div');
    assertionsWrapper.className = 'detail-fields';

    assetManifest.assertions.forEach((assertion) => {
      const block = document.createElement('div');
      block.className = 'assertion-block';

      const label = document.createElement('div');
      label.className = 'assertion-label';
      label.textContent = assertion.label;

      const data = document.createElement('pre');
      data.className = 'assertion-data';
      data.textContent = JSON.stringify(assertion.data, null, 2);

      block.appendChild(label);
      block.appendChild(data);
      assertionsWrapper.appendChild(block);
    });

    addSection(container, 'Assertions', assertionsWrapper);
  }

  if (assetManifest.ingredients && assetManifest.ingredients.length > 0) {
    const list = document.createElement('div');
    list.className = 'ingredients-list';
    assetManifest.ingredients.forEach((ingredient) => {
      const item = document.createElement('div');
      item.className = 'ingredient-item';

      const title = document.createElement('span');
      title.className = 'ingredient-title';
      title.textContent = ingredient.title;

      const rel = document.createElement('span');
      rel.className = 'ingredient-rel';
      rel.textContent = ingredient.relationship;

      item.appendChild(title);
      item.appendChild(rel);
      list.appendChild(item);
    });
    addSection(container, 'Ingredients', list);
  }

  if (assetManifest.signatureInfo) {
    const fields = document.createElement('div');
    fields.className = 'detail-fields';
    fields.appendChild(
      createMetaRow('algorithm', assetManifest.signatureInfo.alg)
    );
    fields.appendChild(
      createMetaRow('issuer', assetManifest.signatureInfo.issuer)
    );
    fields.appendChild(createMetaRow('time', assetManifest.signatureInfo.time));
    addSection(container, 'Signature', fields);
  }

  const manifestFields = document.createElement('div');
  manifestFields.className = 'detail-fields';
  if (assetManifest.format) {
    manifestFields.appendChild(createMetaRow('format', assetManifest.format));
  }
  if (assetManifest.instanceId) {
    manifestFields.appendChild(
      createMetaRow('instance_id', assetManifest.instanceId)
    );
  }
  if (assetManifest.claimGenerator) {
    manifestFields.appendChild(
      createMetaRow('generator', assetManifest.claimGenerator)
    );
  }
  if (manifestFields.childElementCount > 0) {
    addSection(container, 'Manifest', manifestFields);
  }
}
