/**
 * Pixi.js application initialization and layer hierarchy setup.
 * Implements 3-level view hierarchy: session, overview, detail.
 */
import { Application, Container } from 'pixi.js';

export interface LayerGroup {
  // Content Session view (zoom < 0.15)
  sessionLayer: Container;

  // Workflow Overview view (zoom 0.15 - 0.35)
  overviewLayer: Container;
  connectorLayer: Container;

  // Workflow Detail view (zoom > 0.35)
  detailEdgeLayer: Container;
  detailNodeLayer: Container;
}

export interface PixiContext {
  app: Application;
  viewport: Container;
  layers: LayerGroup;
}

/**
 * Initialize Pixi.js application with WebGL renderer.
 */
export async function initializePixi(container: HTMLElement): Promise<PixiContext> {
  const app = new Application();
  await app.init({
    resizeTo: container,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  container.appendChild(app.canvas);

  const viewport = new Container();
  app.stage.addChild(viewport);

  const layers = createLayerHierarchy(viewport);

  return { app, viewport, layers };
}

/**
 * Create the layer hierarchy for the 3-level view system.
 * Order (back to front): session → overview/connectors → detail edges → detail nodes
 */
export function createLayerHierarchy(viewport: Container): LayerGroup {
  // Session view layer (zoomed way out)
  const sessionLayer = new Container();

  // Overview layers (middle zoom)
  const overviewLayer = new Container();
  const connectorLayer = new Container();

  // Detail layers (zoomed in)
  const detailEdgeLayer = new Container();
  const detailNodeLayer = new Container();

  viewport.addChild(
    sessionLayer,
    overviewLayer,
    connectorLayer,
    detailEdgeLayer,
    detailNodeLayer
  );

  // Session and overview layers start hidden (detail view is default)
  sessionLayer.visible = false;
  overviewLayer.visible = false;
  connectorLayer.visible = false;

  return {
    sessionLayer,
    overviewLayer,
    connectorLayer,
    detailEdgeLayer,
    detailNodeLayer,
  };
}
