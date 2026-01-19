/**
 * Pixi.js application initialization and layer hierarchy setup.
 * Extracts WebGL initialization from graphController for better modularity.
 */
import { Application, Container } from 'pixi.js';

export interface LayerGroup {
  selectionLayer: Container;
  edgeLayer: Container;
  nodeLayer: Container;
  dotLayer: Container;
  stageEdgeLayer: Container;
  stageNodeLayer: Container;
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
 * Order: selection → edges → nodes → dots → stage edges → stage nodes
 */
export function createLayerHierarchy(viewport: Container): LayerGroup {
  const selectionLayer = new Container();
  const edgeLayer = new Container();
  const nodeLayer = new Container();
  const dotLayer = new Container();
  const stageEdgeLayer = new Container();
  const stageNodeLayer = new Container();

  viewport.addChild(selectionLayer, edgeLayer, nodeLayer, dotLayer, stageEdgeLayer, stageNodeLayer);

  // Stage layers start hidden (shown during LOD collapse)
  stageEdgeLayer.visible = false;
  stageNodeLayer.visible = false;

  return {
    selectionLayer,
    edgeLayer,
    nodeLayer,
    dotLayer,
    stageEdgeLayer,
    stageNodeLayer,
  };
}
