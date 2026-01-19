/**
 * Pixi.js application initialization and layer hierarchy setup.
 * Extracts WebGL initialization from graphController for better modularity.
 */
import { Application, Container } from 'pixi.js';

export interface LayerGroup {
  selectionLayer: Container;
  nodeLayer: Container;
  edgeLayer: Container;
  workflowNodeLayer: Container;
  workflowEdgeLayer: Container;
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
 * Order: selection → nodes → edges → workflow nodes → workflow edges
 */
export function createLayerHierarchy(viewport: Container): LayerGroup {
  const selectionLayer = new Container();
  const nodeLayer = new Container();
  const edgeLayer = new Container();
  const workflowNodeLayer = new Container();
  const workflowEdgeLayer = new Container();

  viewport.addChild(selectionLayer, nodeLayer, edgeLayer, workflowNodeLayer, workflowEdgeLayer);

  // Workflow layers start hidden (shown during LOD collapse)
  workflowNodeLayer.visible = false;
  workflowEdgeLayer.visible = false;

  return {
    selectionLayer,
    nodeLayer,
    edgeLayer,
    workflowNodeLayer,
    workflowEdgeLayer,
  };
}
