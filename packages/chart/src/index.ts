/**
 * `@vitral/chart`: SVG charts with no framework in them.
 *
 * - the engine: options schema and defaults, scales, formats, scene building,
 *   hit testing, the group bus, text alternatives (also at `@vitral/chart/engine`);
 * - `createChart()`: a DOM renderer with the legend, tooltip, toolbar,
 *   keyboard, zoom, brush and live readout, which the framework components wrap;
 * - `chartStyle`: the class map and stylesheet (also at `@vitral/chart/style`,
 *   and as CSS at `@vitral/chart/chart.css`). Its tokens (`--vt-chart-*`) come
 *   from `@vitral/themes`, so every preset styles it.
 */
export * from './engine/index';
export * from './style/index';
export { createChart, type ChartConfig, type ChartEventMap, type ChartEventName, type ChartHandle, type ChartHooks, type ChartPointEvent, type ChartUpdate } from './chart';
export type { ChartTooltipRenderContext, DownloadKind, HookResult, LegendItemContext, TooltipRow } from './render/html';
export type { PieCenter } from './render/svg';
/**
 * The pass-through types the chart has always exported, which are the shared
 * ones from `@vitral/dom` under the names this package uses.
 */
export { mergeAttrs } from '@vitral/dom';
export type { PassThrough as ChartPassThrough, PassThroughContext as ChartPassThroughContext, PassThroughValue as ChartPassThroughValue } from '@vitral/dom';
export { serializeSvg, svgToPng } from './dom/export';
