import ChartVue from './Chart.vue';
import { ChartCenter, ChartLegend, ChartNoData, ChartTooltip } from './parts';

/**
 * The chart, and as properties the parts a template composes it from:
 * `<Chart.Tooltip>`, `<Chart.Legend>`, `<Chart.Center>`, `<Chart.NoData>`.
 * `Root` is the chart itself. Each part is also a named export.
 */
export const Chart = /* @__PURE__ */ Object.assign(ChartVue, {
    Root: ChartVue,
    Tooltip: ChartTooltip,
    Legend: ChartLegend,
    Center: ChartCenter,
    NoData: ChartNoData
});

export { ChartTooltip, ChartLegend, ChartCenter, ChartNoData };
export type * from './types';
