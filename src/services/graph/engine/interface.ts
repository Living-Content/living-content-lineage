/**
 * GraphEngine interface.
 * Defines the minimal stable contract between Svelte (owner) and Pixi (renderer).
 *
 * IMPORTANT: This file must NOT import Svelte stores.
 * Svelte decides WHEN things happen via edge-triggered effects.
 * Engine executes deterministically via explicit commands.
 */
import type { Phase } from '../../../config/types.js';

/**
 * Selection target - either a node or a step.
 * Matches the shape from traceState but without store dependency.
 */
export type SelectionTarget =
  | { type: 'step'; stepId: string; data: unknown }
  | { type: 'node'; nodeId: string; data: unknown }
  | null;

export interface CenterOnNodeOptions {
  zoom?: boolean;
  onComplete?: () => void;
}

export interface ZoomToBoundsOptions {
  onComplete?: () => void;
}

/**
 * GraphEngine interface.
 * No subscriptions. No stores. Only explicit commands.
 */
export interface GraphEngine {
  destroy(): void;

  /**
   * Selection changed.
   * Engine tracks previous internally for edge detection.
   */
  setSelection(selection: SelectionTarget): void;

  /**
   * Phase filter changed.
   */
  setPhaseFilter(phase: Phase | null): void;

  /**
   * Detail panel state changed.
   */
  setDetailPanelOpen(open: boolean, wasOpen: boolean): void;

  /**
   * Expansion state changed.
   * Used by engine to determine centering behavior.
   */
  setExpanded(expanded: boolean): void;

  /**
   * Resize the viewport to new dimensions.
   */
  resize(width: number, height: number): void;

  /**
   * Center the viewport on a specific node.
   */
  centerOnNode(nodeId: string, options?: CenterOnNodeOptions): void;

  /**
   * Zoom out to fit content within viewport bounds.
   */
  zoomToBounds(nodeId?: string, options?: ZoomToBoundsOptions): void;

  /**
   * Show/hide title overlay secondary elements (UUID, date, divider).
   */
  setTitleSecondaryVisible(visible: boolean): void;

  /**
   * Transition to a new view level (with fade animation).
   */
  transitionToLevel(level: 'content-session' | 'workflow-overview' | 'workflow-detail'): void;
}

/**
 * Initial inputs passed to bootstrap.
 * These are the initial values for engine state.
 */
export interface InitialInputs {
  selection: SelectionTarget;
  phaseFilter: Phase | null;
  detailPanelOpen: boolean;
  isExpanded: boolean;
}

/**
 * Callbacks emitted by the engine to the owner.
 * Pixi reports events, Svelte decides policy.
 */
export interface EngineCallbacks {
  onSimpleViewChange: (simple: boolean) => void;
  onViewportChange: (state: ViewportChangeEvent) => void;
  onViewLevelChange: (level: 'content-session' | 'workflow-overview' | 'workflow-detail') => void;
}

export interface ViewportChangeEvent {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export interface HoverPayload {
  title: string;
  nodeType: string;
  screenX: number;
  screenY: number;
  size: number;
}

/**
 * Callbacks passed to bootstrap for graph events.
 */
export interface BootstrapCallbacks extends EngineCallbacks {
  onLoaded: (data: unknown) => void;
  onError: (error: { message: string; details?: string }) => void;
  onHover: (payload: HoverPayload) => void;
  onHoverEnd: () => void;
}
