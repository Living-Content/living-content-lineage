/**
 * Content session card for highest zoom-out level.
 * Shows session metadata with workflow count.
 *
 * Layout:
 * ┌───────────────────────────────────────┐
 * │  Content Session abc123               │
 * │  3 workflows                          │
 * └───────────────────────────────────────┘
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getCssVar, getCssVarColorHex } from '../../../../themes/theme.js';
import {
  CONTENT_SESSION_CARD_WIDTH,
  CONTENT_SESSION_CARD_HEIGHT,
  CONTENT_SESSION_CARD_RADIUS,
  CONTENT_SESSION_CARD_PADDING,
} from '../../../../config/cards.js';

const CARD_WIDTH = CONTENT_SESSION_CARD_WIDTH;
const CARD_HEIGHT = CONTENT_SESSION_CARD_HEIGHT;
const CARD_RADIUS = CONTENT_SESSION_CARD_RADIUS;
const CARD_PADDING = CONTENT_SESSION_CARD_PADDING;

export interface ContentSessionCardData {
  sessionId: string;
  workflowCount: number;
  x: number;
  y: number;
}

export interface ContentSessionCard extends Container {
  cardData: ContentSessionCardData;
  setSelected: (selected: boolean) => void;
  setHovered: (hovered: boolean) => void;
}

/**
 * Extracts short ID from session ID (first 8 chars).
 */
const getShortId = (sessionId: string): string => {
  return sessionId.slice(0, 8);
};

/**
 * Creates a content session card Pixi container.
 */
export const createContentSessionCard = (
  data: ContentSessionCardData,
  callbacks?: {
    onClick?: (sessionId: string) => void;
    onHover?: (sessionId: string) => void;
    onHoverEnd?: () => void;
  }
): ContentSessionCard => {
  const container = new Container() as ContentSessionCard;
  container.label = `content-session-card-${data.sessionId}`;
  container.cardData = data;

  // Theme colors
  const bgColor = getCssVarColorHex('--color-node-bg');
  const borderColor = getCssVarColorHex('--color-border-strong');
  const titleColor = getCssVarColorHex('--color-title-primary');
  const mutedColor = getCssVarColorHex('--color-text-muted');
  const selectionColor = getCssVarColorHex('--color-selection-ring');

  // Card background - origin at 0,0 (top-left)
  const background = new Graphics();
  background.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
  background.fill({ color: bgColor, alpha: 0.95 });
  background.stroke({ width: 1, color: borderColor, alpha: 1 });
  container.addChild(background);

  // Content session title
  const titleStyle = new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: 28,
    fontWeight: 'bold',
    fill: titleColor,
    letterSpacing: -0.3,
  });
  const title = new Text({
    text: `Content Session ${getShortId(data.sessionId)}`,
    style: titleStyle,
  });
  title.position.set(CARD_PADDING, CARD_PADDING + 8);
  container.addChild(title);

  // Workflow count
  const countStyle = new TextStyle({
    fontFamily: getCssVar('--font-sans'),
    fontSize: 18,
    fill: mutedColor,
    letterSpacing: 0.3,
  });
  const countStr = `${data.workflowCount} workflow${data.workflowCount !== 1 ? 's' : ''}`;
  const countText = new Text({
    text: countStr,
    style: countStyle,
  });
  countText.position.set(CARD_PADDING, CARD_PADDING + 56);
  container.addChild(countText);

  // Selection/hover overlay
  const overlay = new Graphics();
  container.addChild(overlay);

  // Position - card origin is top-left
  container.position.set(data.x, data.y);

  // Interaction
  container.eventMode = 'static';
  container.cursor = 'pointer';

  let isSelected = false;

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
    callbacks?.onHover?.(data.sessionId);
  });

  container.on('pointerout', () => {
    container.setHovered(false);
    callbacks?.onHoverEnd?.();
  });

  container.on('pointertap', () => {
    callbacks?.onClick?.(data.sessionId);
  });

  return container;
};
