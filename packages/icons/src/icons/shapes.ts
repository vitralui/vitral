// Shapes: plain geometry, flat and solid.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'shapes';

export const circle: IconDef = { name: 'circle', category, tags: ['round', 'dot', 'radio', 'shape'], body: '<circle cx="12" cy="12" r="10"/>' };
export const square: IconDef = { name: 'square', category, tags: ['box', 'stop', 'shape'], body: '<rect x="3" y="3" width="18" height="18" rx="2"/>' };
export const triangle: IconDef = { name: 'triangle', category, tags: ['shape', 'delta', 'warning'], body: '<path d="M10.3 3.9a2 2 0 0 1 3.4 0l8 13.6A2 2 0 0 1 20 20.5H4a2 2 0 0 1-1.7-3z"/>' };
export const diamond: IconDef = { name: 'diamond', category, tags: ['rhombus', 'shape', 'gem'], body: '<path d="M10.6 2.6a2 2 0 0 1 2.8 0l8 8a2 2 0 0 1 0 2.8l-8 8a2 2 0 0 1-2.8 0l-8-8a2 2 0 0 1 0-2.8z"/>' };
export const pentagon: IconDef = { name: 'pentagon', category, tags: ['shape', 'five sides'], body: '<path d="M12 2.6L21.51 9.51L17.88 20.69L6.12 20.69L2.49 9.51z"/>' };
export const hexagon: IconDef = { name: 'hexagon', category, tags: ['shape', 'six sides', 'polygon'], body: '<path d="M12 2L20.66 7L20.66 17L12 22L3.34 17L3.34 7z"/>' };
export const octagon: IconDef = { name: 'octagon', category, tags: ['shape', 'eight sides', 'stop'], body: '<path d="M8.17 2.76L15.83 2.76L21.24 8.17L21.24 15.83L15.83 21.24L8.17 21.24L2.76 15.83L2.76 8.17z"/>' };
export const rectangleHorizontal: IconDef = { name: 'rectangleHorizontal', category, tags: ['shape', 'landscape', 'wide'], body: '<rect x="2" y="6" width="20" height="12" rx="2"/>' };
export const rectangleVertical: IconDef = { name: 'rectangleVertical', category, tags: ['shape', 'portrait', 'tall'], body: '<rect x="6" y="2" width="12" height="20" rx="2"/>' };
export const circleDashed: IconDef = { name: 'circleDashed', category, tags: ['draft', 'pending', 'shape'], body: '<path d="M13.39 2.1A10 10 0 0 1 18.02 4.01M19.99 5.98A10 10 0 0 1 21.9 10.61M21.9 13.39A10 10 0 0 1 19.99 18.02M18.02 19.99A10 10 0 0 1 13.39 21.9M10.61 21.9A10 10 0 0 1 5.98 19.99M4.01 18.02A10 10 0 0 1 2.1 13.39M2.1 10.61A10 10 0 0 1 4.01 5.98M5.98 4.01A10 10 0 0 1 10.61 2.1"/>' };
export const squareDashed: IconDef = { name: 'squareDashed', category, tags: ['draft', 'selection', 'shape'], body: '<path d="M3 7V5a2 2 0 0 1 2-2h2M11 3h2M17 3h2a2 2 0 0 1 2 2v2M21 11v2M21 17v2a2 2 0 0 1-2 2h-2M13 21h-2M7 21H5a2 2 0 0 1-2-2v-2M3 13v-2"/>' };
export const cube: IconDef = { name: 'cube', category, tags: ['box', '3d', 'block', 'package'], body: '<path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5zM3.5 7.25L12 12l8.5-4.75M12 12v9.5"/>' };
export const cylinder: IconDef = { name: 'cylinder', category, tags: ['database', '3d', 'can', 'storage'], body: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/>' };
export const cone: IconDef = { name: 'cone', category, tags: ['3d', 'traffic', 'shape'], body: '<ellipse cx="12" cy="18" rx="8" ry="3"/><path d="M12 2.5L4 18M12 2.5L20 18"/>' };
export const pyramid: IconDef = { name: 'pyramid', category, tags: ['3d', 'egypt', 'shape'], body: '<path d="M12 2.5L2.5 17l9.5 4.5 9.5-4.5zM12 2.5v19"/>' };
export const sphere: IconDef = { name: 'sphere', category, tags: ['ball', '3d', 'globe'], body: '<circle cx="12" cy="12" r="10"/><path d="M2 12a10 4 0 0 0 20 0"/>' };
export const shapes: IconDef = { name: 'shapes', category, tags: ['geometry', 'primitives', 'objects'], body: '<circle cx="17" cy="7" r="4"/><rect x="3" y="13" width="8" height="8" rx="2"/><path d="M7 2.5l4.5 7.5h-9z"/>' };
export const infinity: IconDef = { name: 'infinity', category, tags: ['forever', 'loop', 'unlimited'], body: '<path d="M12 12c-2-2.5-3.5-4-6-4a4 4 0 0 0 0 8c2.5 0 4-1.5 6-4s3.5-4 6-4a4 4 0 0 1 0 8c-2.5 0-4-1.5-6-4z"/>' };
export const spiral: IconDef = { name: 'spiral', category, tags: ['swirl', 'hypnotic', 'vortex'], body: '<path d="M12 12a1.5 1.5 0 0 1 3 0 3 3 0 0 1-3 3 4.5 4.5 0 0 1-4.5-4.5A6 6 0 0 1 13.5 4.5a7.5 7.5 0 0 1 7.5 7.5 9 9 0 0 1-9 9"/>' };
export const blob: IconDef = { name: 'blob', category, tags: ['organic', 'shape', 'splash'], body: '<path d="M12 3c4 0 8 2.5 8 7.5 0 4.5-3 10.5-8.5 10.5C6 21 3 17 3 13c0-5 4-10 9-10z"/>' };
