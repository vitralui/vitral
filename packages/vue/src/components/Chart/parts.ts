import { definePart } from '../../base/parts';

/**
 * The chart's content, written as children rather than as named slots:
 * `<Chart.Tooltip>`, `<Chart.Legend>`, `<Chart.Center>`, `<Chart.NoData>`.
 * Each draws nothing itself — the chart takes what is inside it and draws it
 * where that part belongs, with the same slot props.
 */
export const ChartTooltip = definePart('Tooltip', 'VtChartTooltip');
export const ChartLegend = definePart('Legend', 'VtChartLegend');
export const ChartCenter = definePart('Center', 'VtChartCenter');
export const ChartNoData = definePart('NoData', 'VtChartNoData');
