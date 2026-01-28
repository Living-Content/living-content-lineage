/**
 * Pixi.js application initialization and layer hierarchy setup.
 * Extracts WebGL initialization from graphController for better modularity.
 */
import { Application, Container } from 'pixi.js';

export interface LayerGroup {
  nodeLayer: Container;
  edgeLayer: Container;
  connectorLayer: Container;
  stepNodeLayer: Container;
  stepEdgeLayer: Container;
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
 * Create the layer hierarchy for rendering order.
 * Order: edges → nodes → connector → step nodes → step edges
 */
export function createLayerHierarchy(viewport: Container): LayerGroup {
  const edgeLayer = new Container();
  const nodeLayer = new Container();
  const connectorLayer = new Container();
  const stepNodeLayer = new Container();
  const stepEdgeLayer = new Container();

  viewport.addChild(edgeLayer, nodeLayer, connectorLayer, stepNodeLayer, stepEdgeLayer);

  // Step layers start hidden (shown during LOD collapse to step view)
  stepNodeLayer.visible = false;
  stepEdgeLayer.visible = false;

  return {
    nodeLayer,
    edgeLayer,
    connectorLayer,
    stepNodeLayer,
    stepEdgeLayer,
  };
}
