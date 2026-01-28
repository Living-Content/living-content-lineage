/**
 * Compact workflow card for overview zoom level.
 * Shows workflow metadata with a horizontal step "fingerprint" strip.
 *
 * Layout:
 * ┌───────────────────────────────────────────────────────────────┐
 * │  ▌▌▌▌▌▌▌▌▌▌▌▌▌▌  Workflow abc12345                            │
 * │  ← step colors →  abc12345-1234-5678-9abc-def012345678         │
 * │                   JAN 27, 2026 · 9 steps                       │
 * └───────────────────────────────────────────────────────────────┘
 *   ^^^^^^^^^^^^^^^^^
 *   vertical bars arranged LEFT-TO-RIGHT, one per STEP
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Phase, StepUI, Trace } from '../../../../config/types.js';
import { getCssVar, getCssVarColorHex } from '../../../../themes/theme.js';
import type { CssVar } from '../../../../themes/types.generated.js';
import {
  WORKFLOW_CARD_WIDTH,
  WORKFLOW_CARD_HEIGHT,
  WORKFLOW_CARD_RADIUS,
  WORKFLOW_CARD_PADDING,
  WORKFLOW_STRIPE_AREA_WIDTH,
  WORKFLOW_STRIPE_BAR_GAP,
} from '../../../../config/cards.js';

const CARD_WIDTH = WORKFLOW_CARD_WIDTH;
const CARD_HEIGHT = WORKFLOW_CARD_HEIGHT;
const CARD_RADIUS = WORKFLOW_CARD_RADIUS;
const CARD_PADDING = WORKFLOW_CARD_PADDING;
const STRIPE_AREA_WIDTH = WORKFLOW_STRIPE_AREA_WIDTH;
const STRIPE_BAR_GAP = WORKFLOW_STRIPE_BAR_GAP;

export interface WorkflowCardData {
  workflowId: string;
  title?: string;
  steps: StepUI[];
  date?: Date;
  x: number;
  y: number;
}

export interface WorkflowCard extends Container {
  cardData: WorkflowCardData;
  setSelected: (selected: boolean) => void;
  setHovered: (hovered: boolean) => void;
}

/**
 * Gets the phase color as a hex number for Pixi.
 */
const getPhaseColorHex = (phase: Phase): number => {
  const varName = `--phase-${phase.toLowerCase()}` as CssVar;
  return getCssVarColorHex(varName);
};

/**
 * Truncates a string with ellipsis if it exceeds maxLength.
 */
const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

/**
 * Formats a date for display.
 */
const formatDate = (date?: Date): string => {
  if (!date) return '';
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/**
 * Extracts short ID from workflow ID (first 8 chars).
 */
const getShortId = (workflowId: string): string => {
  return workflowId.slice(0, 8);
};

/**
 * Creates a workflow card Pixi container.
 */
export const createWorkflowCard = (
  data: WorkflowCardData,
  callbacks?: {
    onClick?: (workflowId: string) => void;
    onHover?: (workflowId: string) => void;
    onHoverEnd?: () => void;
  }
): WorkflowCard => {
  const container = new Container() as WorkflowCard;
  container.label = `workflow-card-${data.workflowId}`;
  container.cardData = data;

  // Card background - use theme colors
  const background = new Graphics();
  const bgColor = getCssVarColorHex('--color-node-bg');
  const borderColor = getCssVarColorHex('--color-border-strong');
  background.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
  background.fill({ color: bgColor, alpha: 0.95 });
  background.stroke({ width: 1, color: borderColor, alpha: 1 });
  container.addChild(background);

  // Step stripes - vertical bars arranged LEFT-TO-RIGHT (horizontal fingerprint)
  const stripesContainer = new Graphics();
  const stripeAreaHeight = CARD_HEIGHT - CARD_PADDING * 2;
  const stripeBarWidth = Math.max(4, (STRIPE_AREA_WIDTH - (data.steps.length - 1) * STRIPE_BAR_GAP) / data.steps.length);
  const stripesStartX = CARD_PADDING;
  const stripesStartY = CARD_PADDING;

  data.steps.forEach((step, i) => {
    const x = stripesStartX + i * (stripeBarWidth + STRIPE_BAR_GAP);
    const color = getPhaseColorHex(step.phase);
    stripesContainer.roundRect(x, stripesStartY, stripeBarWidth, stripeAreaHeight, 3);
    stripesContainer.fill({ color, alpha: 0.85 });
  });
  container.addChild(stripesContainer);

  // Text content (right of stripes)
  const textX = CARD_PADDING + STRIPE_AREA_WIDTH + 28;
  const textStartY = CARD_PADDING + 12;

  // Theme colors for text
  const titleColor = getCssVarColorHex('--color-title-primary');
  const secondaryColor = getCssVarColorHex('--color-title-secondary');
  const mutedColor = getCssVarColorHex('--color-text-muted');

  // Title
  const titleStyle = new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: 24,
    fontWeight: 'bold',
    fill: titleColor,
    letterSpacing: -0.3,
  });
  const title = new Text({
    text: `Workflow ${getShortId(data.workflowId)}`,
    style: titleStyle,
  });
  title.position.set(textX, textStartY);
  container.addChild(title);

  // Full workflow ID
  const idStyle = new TextStyle({
    fontFamily: getCssVar('--font-mono'),
    fontSize: 16,
    fill: secondaryColor,
    letterSpacing: 0.3,
  });
  const workflowIdText = new Text({
    text: truncate(data.workflowId, 36),
    style: idStyle,
  });
  workflowIdText.position.set(textX, textStartY + 42);
  container.addChild(workflowIdText);

  // Date and step count
  const dateStr = formatDate(data.date);
  const stepCount = `${data.steps.length} step${data.steps.length !== 1 ? 's' : ''}`;
  const metaStr = dateStr ? `${dateStr} · ${stepCount}` : stepCount;

  const metaStyle = new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: 16,
    fill: mutedColor,
    letterSpacing: 0.3,
  });
  const metaText = new Text({
    text: metaStr,
    style: metaStyle,
  });
  metaText.position.set(textX, textStartY + 76);
  container.addChild(metaText);

  // Selection/hover overlay
  const overlay = new Graphics();
  container.addChild(overlay);

  // Position - card origin is top-left, position at workflow left edge
  container.position.set(data.x, data.y);

  // Interaction
  container.eventMode = 'static';
  container.cursor = 'pointer';

  let isSelected = false;
  const selectionColor = getCssVarColorHex('--color-selection-ring');

  const drawOverlay = (alpha: number): void => {
    overlay.clear();
    if (alpha > 0) {
      overlay.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
      overlay.stroke({ width: 2, color: selectionColor, alpha });
    }
  };

  container.setSelected = (selected: boolean): void => {
    isSelected = selected;
    drawOverlay(selected ? 0.8 : 0);
  };

  container.setHovered = (hovered: boolean): void => {
    if (isSelected) return;
    drawOverlay(hovered ? 0.4 : 0);
  };

  container.on('pointerover', () => {
    container.setHovered(true);
    callbacks?.onHover?.(data.workflowId);
  });

  container.on('pointerout', () => {
    container.setHovered(false);
    callbacks?.onHoverEnd?.();
  });

  container.on('pointertap', () => {
    callbacks?.onClick?.(data.workflowId);
  });

  return container;
};

/**
 * Creates workflow cards for all workflows in a trace collection.
 */
export const createWorkflowCards = (
  traces: { trace: Trace; x: number; y: number }[],
  callbacks?: {
    onClick?: (workflowId: string) => void;
    onHover?: (workflowId: string) => void;
    onHoverEnd?: () => void;
  }
): WorkflowCard[] => {
  return traces.map(({ trace, x, y }) =>
    createWorkflowCard(
      {
        workflowId: trace.workflowId ?? 'unknown',
        title: trace.title,
        steps: trace.steps,
        date: new Date(),
        x,
        y,
      },
      callbacks
    )
  );
};
