import type Sigma from 'sigma';
import type { Stage } from '../../types.js';

interface StagePosition {
  stage: Stage;
  screenX: number;
}

export function calculateStagePositions(
  renderer: Sigma,
  stages: Stage[]
): StagePosition[] {
  return stages.map((stage) => {
    const viewportPos = renderer.graphToViewport({ x: stage.xStart, y: 0 });
    return { stage, screenX: viewportPos.x };
  });
}

export function renderStageLabels(stagePositions: StagePosition[]): void {
  const container = document.getElementById('stage-labels');
  if (!container) return;

  container.innerHTML = '';

  stagePositions.forEach((pos, idx) => {
    if (idx > 0) {
      const divider = document.createElement('div');
      divider.className = 'stage-divider';
      divider.style.left = `${pos.screenX}px`;
      container.appendChild(divider);
    }

    const labelDiv = document.createElement('div');
    labelDiv.className = 'stage-label';
    labelDiv.style.left = `${pos.screenX + 15}px`;
    labelDiv.textContent = pos.stage.label;
    container.appendChild(labelDiv);
  });
}
