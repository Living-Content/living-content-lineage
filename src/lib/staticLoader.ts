/**
 * Static loader control.
 * Controls the HTML static loader that shows before Svelte mounts.
 */

export function setLoaderStatus(stage: string): void {
  const stageEl = document.querySelector('#static-loader .loader-stage');
  if (stageEl) {
    stageEl.textContent = stage;
  }
}

export function hideStaticLoader(): void {
  const staticLoader = document.getElementById('static-loader');
  if (staticLoader) {
    staticLoader.classList.add('fade-out');
    setTimeout(() => staticLoader.remove(), 300);
  }
}
