import type { ChartOptions, ChartSeries } from '@vitral/chart';
import type { BaseProps } from '../../base/types';

// The option and series types are `@vitral/chart`'s, shared with every adapter. The SFC
// compiler only has to know these props are objects, so it is told not to
// follow the aliases into another package (`@vue-ignore`).
type Options = /* @vue-ignore */ ChartOptions;
type Series = /* @vue-ignore */ ChartSeries;

/** The option and series types, re-exported so an application needs only this package. */
export type { ChartOptions, ChartSeries };

export type ChartKind =
    | 'line'
    | 'area'
    | 'bar'
    | 'lollipop'
    | 'scatter'
    | 'bubble'
    | 'heatmap'
    | 'candlestick'
    | 'pie'
    | 'donut'
    | 'radar'
    | 'waterfall'
    | 'rangeBar'
    | 'rangeArea'
    | 'histogram'
    | 'boxPlot'
    | 'funnel';

export interface ChartProps extends BaseProps {
    /** The kind of chart; overrides `options.chart.type`. Defaults to `'line'`. */
    type?: ChartKind;
    /** The data, in any shape ApexCharts takes: `[{ name, data: [...] }]`, or plain numbers for a pie. */
    series?: Series;
    /** ApexCharts-shaped options. Everything visual is plain data, so the object survives JSON. */
    options?: Options;
    /** Overrides `options.chart.height`: pixels, or a CSS length. */
    height?: number | string;
    /** Overrides `options.chart.width`. */
    width?: number | string;
}

export interface ChartPointEvent {
    seriesIndex: number;
    dataPointIndex: number;
    /** The category (or shared x value) index. */
    column: number;
    value: number | null;
    selected?: boolean;
}

export type ChartEmits = {
    /** A data point was chosen by click, Enter or Space. */
    dataPointSelection: [event: ChartPointEvent];
    dataPointMouseEnter: [event: ChartPointEvent];
    dataPointMouseLeave: [event: ChartPointEvent];
    /** A legend entry was pressed; `hidden` is the series' new state. */
    legendClick: [event: { seriesIndex: number; seriesName: string; hidden: boolean }];
    /** The x window changed; null when zoomed all the way out. */
    zoomed: [event: { min: number; max: number } | null];
    /** A range was picked in selection mode (or on a brush). */
    selection: [event: { min: number; max: number }];
    /** Any click on the plot. */
    click: [event: { seriesIndex: number; dataPointIndex: number; column: number; originalEvent: MouseEvent }];
};

export interface ChartTooltipSlotProps {
    title: string;
    rows: { name: string; value: string; color: string; seriesIndex: number; extra?: { name: string; text: string }[] }[];
    seriesIndex: number;
    dataPointIndex: number;
    column: number;
}

export interface ChartSlots {
    /** Replaces the tooltip's content. */
    tooltip?: (props: ChartTooltipSlotProps) => unknown;
    /** Shown instead of the chart when there is no data. */
    noData?: () => unknown;
    /** Replaces a legend entry's text. */
    legend?: (props: { name: string; seriesIndex: number; hidden: boolean; color: string }) => unknown;
    /** Replaces a donut's centre text. */
    center?: (props: { name: string; value: string; total: string }) => unknown;
}
