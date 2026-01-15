import DOMPurify from 'dompurify';
import JSON5 from 'json5';
import { marked } from 'marked';
import type { LineageNodeData } from '../../types.js';
import { isSecondaryContentKey } from './constants.js';
import { addSection, clearElement, createMetaRow } from './dom.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

function parseJson(value: string): unknown | null {
  if (!looksLikeJson(value)) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function tryParseJsonFragment(value: string): {
  parsed: unknown;
  prefix: string;
  suffix: string;
} | null {
  const openings = new Set(['{', '[']);
  const closings: Record<string, string> = { '{': '}', '[': ']' };

  for (let i = 0; i < value.length; i += 1) {
    const startChar = value[i];
    if (!openings.has(startChar)) continue;

    const stack: string[] = [startChar];
    for (let j = i + 1; j < value.length; j += 1) {
      const ch = value[j];
      if (openings.has(ch)) {
        stack.push(ch);
        continue;
      }
      const last = stack[stack.length - 1];
      if (last && ch === closings[last]) {
        stack.pop();
        if (stack.length === 0) {
          const fragment = value.slice(i, j + 1);
          try {
            const parsed = JSON5.parse(fragment);
            return {
              parsed,
              prefix: value.slice(0, i),
              suffix: value.slice(j + 1),
            };
          } catch {
            break;
          }
        }
      }
    }
  }

  return null;
}

function looksLikeMarkdown(value: string): boolean {
  if (value.includes('```')) return true;
  if (/^#{1,6}\s/m.test(value)) return true;
  if (/(\n|^)[*-]\s+/m.test(value)) return true;
  if (/(\n|^)\d+\.\s+/m.test(value)) return true;
  if (/\[[^\]]+]\([^)]+\)/.test(value)) return true;
  if (/\*\*[^*]+\*\*/.test(value)) return true;
  return false;
}

function createMarkdownElement(value: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'detail-field-value detail-value-markdown';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'markdown-toggle';
  toggle.textContent = 'View raw';

  const rendered = document.createElement('div');
  rendered.className = 'markdown-rendered';

  const raw = document.createElement('pre');
  raw.className = 'markdown-raw';
  raw.textContent = value;

  const applyRendered = (html: string) => {
    rendered.innerHTML = DOMPurify.sanitize(html);
  };

  const parsed = marked.parse(value);
  if (typeof parsed === 'string') {
    applyRendered(parsed);
  } else {
    parsed
      .then((html) => applyRendered(html))
      .catch(() => {
        rendered.textContent = value;
      });
  }

  toggle.addEventListener('click', () => {
    const isRaw = wrapper.classList.toggle('show-raw');
    toggle.textContent = isRaw ? 'View rendered' : 'View raw';
  });

  wrapper.appendChild(toggle);
  wrapper.appendChild(rendered);
  wrapper.appendChild(raw);
  return wrapper;
}

function createContentValueElement(value: unknown): HTMLElement {
  if (Array.isArray(value)) {
    const list = document.createElement('ul');
    list.className = 'detail-field-value detail-value-list';
    value.forEach((item) => {
      const entry = document.createElement('li');
      const rendered = createContentValueElement(item);
      entry.appendChild(rendered);
      list.appendChild(entry);
    });
    return list;
  }

  if (isRecord(value)) {
    const pre = document.createElement('pre');
    pre.className = 'detail-field-value detail-value-pre';
    pre.textContent = JSON.stringify(value, null, 2);
    return pre;
  }

  if (typeof value === 'string') {
    const parsedJson = parseJson(value);
    if (parsedJson !== null) {
      const pre = document.createElement('pre');
      pre.className = 'detail-field-value detail-value-pre';
      pre.textContent = JSON.stringify(parsedJson, null, 2);
      return pre;
    }

    try {
      const parsedLoose = JSON5.parse(value);
      const pre = document.createElement('pre');
      pre.className = 'detail-field-value detail-value-pre';
      pre.textContent = JSON.stringify(parsedLoose, null, 2);
      return pre;
    } catch {
      // fall through
    }

    const fragment = tryParseJsonFragment(value);
    if (fragment) {
      const prefix = fragment.prefix.trim();
      const suffix = fragment.suffix.trim();
      const fragmentOnly = prefix.length === 0 && suffix.length === 0;

      if (fragmentOnly) {
        const pre = document.createElement('pre');
        pre.className = 'detail-field-value detail-value-pre';
        pre.textContent = JSON.stringify(fragment.parsed, null, 2);
        return pre;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'detail-field-value detail-value-fragment';

      if (prefix.length > 0) {
        const prefixEl = document.createElement('div');
        prefixEl.className = 'detail-fragment-context';
        prefixEl.textContent = fragment.prefix.trim();
        wrapper.appendChild(prefixEl);
      }

      const pre = document.createElement('pre');
      pre.className = 'detail-value-pre detail-fragment-json';
      pre.textContent = JSON.stringify(fragment.parsed, null, 2);
      wrapper.appendChild(pre);

      if (suffix.length > 0) {
        const suffixEl = document.createElement('div');
        suffixEl.className = 'detail-fragment-context';
        suffixEl.textContent = fragment.suffix.trim();
        wrapper.appendChild(suffixEl);
      }

      return wrapper;
    }

    if (looksLikeMarkdown(value)) {
      return createMarkdownElement(value);
    }

    if (isHttpUrl(value)) {
      const link = document.createElement('a');
      link.className = 'detail-field-value detail-value-link';
      link.href = value;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = value;
      return link;
    }

    if (value.includes('\n') || value.length > 120) {
      const pre = document.createElement('pre');
      pre.className = 'detail-field-value detail-value-pre';
      pre.textContent = value;
      return pre;
    }
  }

  const span = document.createElement('span');
  span.className = 'detail-field-value';
  span.textContent = String(value);
  return span;
}

function createContentBlockElement(value: unknown): HTMLElement {
  const element = createContentValueElement(value);
  element.classList.add('content-block');
  return element;
}

export function renderDetailView(
  container: HTMLElement,
  nodeData: LineageNodeData
): void {
  clearElement(container);

  const assetManifest = nodeData.assetManifest;
  if (!assetManifest) return;

  if (assetManifest.content?.query) {
    const block = createContentBlockElement(assetManifest.content.query);
    addSection(container, 'Query', block);
  }

  if (assetManifest.content?.response) {
    const block = createContentBlockElement(assetManifest.content.response);
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
      .filter(([key]) => isSecondaryContentKey(key))
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

        const valueEl = createContentValueElement(value);

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

      const data = createContentValueElement(assertion.data);
      data.classList.add('assertion-data');

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
