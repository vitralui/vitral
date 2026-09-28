/**
 * `@vitral/tour`: a guided tour with no framework in it.
 *
 * - `createTour()`: the tour, its hooks and its methods,
 *   with conditional steps, waits, steps that move on by themselves, progress
 *   as text, dots or a bar, and a tour that remembers where the reader got to;
 * - the engine: the placement, the progress and the overlay's shape as plain
 *   arithmetic (also at `@vitral/tour/engine`);
 * - the classes and tokens are `@vitral/styles`' `tourStyle`, so a tour
 *   follows whatever preset the page is themed with.
 */
export * from './engine/index';
export { createTour, type TourHandle } from './tour';
export { tourView, type TourView } from './render/popover';
