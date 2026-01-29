/**
 * Pixi.js application initialization and container hierarchy setup.
 * Implements 3-level view hierarchy: session, overview, detail.
 * Each level has its own container with independent zoom.
 */
import { Application, Container } from 'pixi.js';
import type { ViewLevel } from '../../../config/types.js';
import { ZOOM_DEFAULT } from '../../../config/viewport.js';

export interface ViewContainers {
  contentSession: Container;
  workflowOverview: Container;
  workflowDetail: Container;
}

export interface PixiContext {
  app: Application;
  viewport: Container;
  containers: ViewContainers;
}

/**
 * Initialize Pixi.js application with WebGL renderer.
 */
export async function initializePixi(htmlContainer: HTMLElement): Promise<PixiContext> {
  const app = new Application();
  await app.init({
    resizeTo: htmlContainer,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  htmlContainer.appendChild(app.canvas);

  const viewport = new Container();
  app.stage.addChild(viewport);

  const containers = createViewContainers(viewport);

  return { app, viewport, containers };
}

/**
 * Create the container hierarchy for the 3-level view system.
 * Each level gets its own container with independent zoom.
 */
export function createViewContainers(viewport: Container): ViewContainers {
  const contentSession = new Container();
  const workflowOverview = new Container();
  const workflowDetail = new Container();

  viewport.addChild(workflowDetail, workflowOverview, contentSession);

  // contentSession and workflowOverview start hidden (detail view is default)
  contentSession.visible = false;
  workflowOverview.visible = false;

  // Initialize all containers to default zoom scale
  contentSession.scale.set(ZOOM_DEFAULT);
  workflowOverview.scale.set(ZOOM_DEFAULT);
  workflowDetail.scale.set(ZOOM_DEFAULT);

  return { contentSession, workflowOverview, workflowDetail };
}

/**
 * Map ViewLevel to container key.
 */
const LEVEL_TO_KEY: Record<ViewLevel, keyof ViewContainers> = {
  'content-session': 'contentSession',
  'workflow-overview': 'workflowOverview',
  'workflow-detail': 'workflowDetail',
};

/**
 * Get the container for a given view level.
 */
export function getContainerForLevel(containers: ViewContainers, level: ViewLevel): Container {
  return containers[LEVEL_TO_KEY[level]];
}
