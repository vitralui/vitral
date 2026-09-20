/**
 * The chart's options, in the shape ApexCharts made familiar. Everything
 * visual and structural is plain data (strings, numbers, booleans, arrays), so
 * an options object survives `JSON.stringify` and a visual editor can
 * write it. Formatting is a string template (`'{value|compact} users'`, see
 * `formatChartValue`); a function is accepted wherever a template is, as an
 * extra for code that needs it.
 */

export type ChartType =
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
    /** A bar that floats: each one starts where the running total left off. */
    | 'waterfall'
    /** A bar between two numbers rather than from zero: `y: [low, high]`. */
    | 'rangeBar'
    /** The band between two numbers, across the categories. */
    | 'rangeArea'
    /** Counts of values falling in bins the chart works out for itself. */
    | 'histogram'
    /** Five numbers a category: the box, the median and the whiskers. */
    | 'boxPlot'
    /** A stacked area floating on a baseline of its own, rather than on zero. */
    | 'stream'
    /** One bar against a target and the bands it falls in. */
    | 'bullet'
    /** Boxes whose areas are the values, packed into the plot. */
    | 'treemap'
    /** A year of days as a grid of weeks, shaded by value. */
    | 'calendar'
    /** A pie of several rings, one a level of a tree. */
    | 'sunburst'
    /** Rings, each as long a share of the circle as its value is of the maximum. */
    | 'radialBar'
    /** One radial bar drawn as an arc, with the value in the middle. */
    | 'gauge'
    /** Stages of a process, each as wide as its share of the first. */
    | 'funnel';

/** A template string, or (not serialisable) a function returning the text. */
export type ChartFormatter = string | ((value: unknown, context: ChartFormatContext) => string);

export interface ChartFormatContext {
    seriesIndex: number;
    dataPointIndex: number;
    seriesName?: string;
    category?: string | number;
    percent?: number;
}

export interface ChartTextStyle {
    fontSize?: string;
    fontWeight?: string | number;
    fontFamily?: string;
    color?: string;
}

export interface ChartTitle {
    text?: string;
    align?: 'left' | 'center' | 'right';
    margin?: number;
    offsetX?: number;
    offsetY?: number;
    style?: ChartTextStyle;
}

export interface ChartAxisLabels {
    show?: boolean;
    /** A template: `'{value|compact}'`, `'{value|date:dd MMM}'`… */
    formatter?: ChartFormatter;
    /**
     * Which end of the label sits at the tick. Unset, each axis keeps the
     * alignment that reads best where it is: a value axis' labels end at the
     * plot (and start at it when the axis is `opposite`), a category label is
     * centred under its tick. Setting it overrides that — a left-aligned
     * column of y labels lines its numbers up on the digit rather than on the
     * decimal point, which is what a table of figures beside a chart wants.
     */
    align?: 'left' | 'center' | 'right';
    /** Degrees; negative leans up to the left. */
    rotate?: number;
    hideOverlappingLabels?: boolean;
    offsetX?: number;
    offsetY?: number;
    style?: ChartTextStyle;
    /** Date patterns per tick unit, for datetime axes. */
    datetimeFormatter?: { year?: string; month?: string; day?: string; hour?: string; minute?: string; second?: string };
}

export interface ChartAxisLine {
    show?: boolean;
    color?: string;
}

export interface ChartCrosshairs {
    show?: boolean;
    /** Pixels, or `'barWidth'` to shade the whole category. */
    width?: number | 'barWidth';
    position?: 'back' | 'front';
    stroke?: { color?: string; width?: number; dashArray?: number };
    fill?: { color?: string; opacity?: number };
}

export interface ChartXAxis {
    type?: 'category' | 'numeric' | 'datetime';
    categories?: (string | number)[];
    min?: number;
    max?: number;
    tickAmount?: number;
    position?: 'bottom' | 'top';
    labels?: ChartAxisLabels;
    title?: { text?: string; offsetY?: number; style?: ChartTextStyle };
    axisBorder?: ChartAxisLine;
    axisTicks?: ChartAxisLine & { height?: number };
    crosshairs?: ChartCrosshairs;
    tooltip?: { enabled?: boolean };
}

export interface ChartYAxis {
    show?: boolean;
    /** Which series this axis measures (by name); unset, the first axis measures every series without one. */
    seriesName?: string | string[];
    opposite?: boolean;
    min?: number;
    max?: number;
    tickAmount?: number;
    /** Snap the ends to 1, 2 or 5 × 10ⁿ. Defaults to true. */
    forceNiceScale?: boolean;
    reversed?: boolean;
    decimalsInFloat?: number;
    labels?: ChartAxisLabels;
    title?: { text?: string; style?: ChartTextStyle };
    axisBorder?: ChartAxisLine;
    axisTicks?: ChartAxisLine;
}

export interface ChartGrid {
    show?: boolean;
    borderColor?: string;
    strokeDashArray?: number;
    position?: 'back' | 'front';
    xaxis?: { lines?: { show?: boolean } };
    yaxis?: { lines?: { show?: boolean } };
    /** Alternating bands between the horizontal lines. */
    row?: { colors?: string[]; opacity?: number };
    column?: { colors?: string[]; opacity?: number };
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
}

export type ChartCurve = 'straight' | 'smooth' | 'monotoneCubic' | 'stepline';

export interface ChartStroke {
    show?: boolean;
    curve?: ChartCurve | ChartCurve[];
    width?: number | number[];
    dashArray?: number | number[];
    lineCap?: 'butt' | 'round' | 'square';
    colors?: string[];
}

export interface ChartFill {
    type?: 'solid' | 'gradient' | ('solid' | 'gradient')[];
    opacity?: number | number[];
    colors?: string[];
    gradient?: {
        type?: 'vertical' | 'horizontal';
        opacityFrom?: number;
        opacityTo?: number;
        /** Percentages where the gradient starts and ends. */
        stops?: number[];
    };
}

export type ChartMarkerShape = 'circle' | 'square' | 'diamond' | 'triangle';

export interface ChartMarkers {
    size?: number | number[];
    colors?: string[];
    strokeColors?: string | string[];
    strokeWidth?: number;
    shape?: ChartMarkerShape | ChartMarkerShape[];
    hover?: { size?: number; sizeOffset?: number };
}

export interface ChartDataLabels {
    enabled?: boolean;
    enabledOnSeries?: number[];
    formatter?: ChartFormatter;
    offsetX?: number;
    offsetY?: number;
    textAnchor?: 'start' | 'middle' | 'end';
    style?: ChartTextStyle;
    background?: { enabled?: boolean; color?: string; borderRadius?: number; padding?: number };
}

/** The shape of a chart's movement, in the names ApexCharts made familiar. */
export type ChartEasing = 'linear' | 'easein' | 'easeout' | 'easeinout';

/** Which one number stands for a whole series in the legend. */
export type ChartLegendValueSource = 'total' | 'last' | 'first' | 'min' | 'max' | 'average';

export interface ChartLegend {
    show?: boolean;
    showForSingleSeries?: boolean;
    position?: 'top' | 'right' | 'bottom' | 'left';
    horizontalAlign?: 'left' | 'center' | 'right';
    /** A template over `{series}` and `{value}` (the total of a pie slice). */
    formatter?: ChartFormatter;
    fontSize?: string;
    markers?: { size?: number; shape?: ChartMarkerShape };
    /**
     * A figure beside each series name, so the key doubles as a readout: the
     * series' total, where it ended, or its range — the question a legend is
     * usually read next to. `source` picks which number; `formatter` dresses
     * it, and is given the number and the series it belongs to.
     */
    value?: { show?: boolean; source?: ChartLegendValueSource; formatter?: ChartFormatter };
    /** Pressing an entry shows and hides its series. On by default. */
    onItemClick?: { toggleDataSeries?: boolean };
    /**
     * Hovering an entry dims the other series. Off by default: an entry that
     * both answers the pointer and answers the press asks the reader to work
     * out which of the two just happened, so the legend does one thing unless
     * it is told otherwise.
     */
    onItemHover?: { highlightDataSeries?: boolean };
}

export interface ChartTooltip {
    enabled?: boolean;
    /** `'click'` keeps the readout until the next click, for touch. */
    trigger?: 'hover' | 'click';
    /** One readout for every series at the pointed category. Defaults to true on line, area and bar charts. */
    shared?: boolean;
    /** Only when the pointer is on a mark. */
    intersect?: boolean;
    followCursor?: boolean;
    /** Swatches before each row. */
    marker?: { show?: boolean };
    x?: { show?: boolean; formatter?: ChartFormatter; format?: string };
    y?: { formatter?: ChartFormatter; title?: { formatter?: ChartFormatter } };
    z?: { formatter?: ChartFormatter; title?: string };
    /**
     * A whole-panel template, with `{title}` and one `{rows}` block, or a
     * function returning HTML-free text rows. The `tooltip` slot replaces it all.
     */
    custom?: string | ((context: ChartTooltipContext) => string);
}

export interface ChartTooltipContext {
    dataPointIndex: number;
    seriesIndex: number;
    title: string;
    rows: { name: string; value: string; color: string; seriesIndex: number }[];
}

export interface ChartBarOptions {
    horizontal?: boolean;
    borderRadius?: number;
    /** Round only the growing end (`'end'`), or every corner. */
    borderRadiusApplication?: 'end' | 'around';
    borderRadiusWhenStacked?: 'last' | 'all';
    /** Of the category's slot. */
    columnWidth?: string;
    barHeight?: string;
    /** A colour per category instead of per series. */
    distributed?: boolean;
    dataLabels?: { position?: 'top' | 'center' | 'bottom'; total?: { enabled?: boolean; formatter?: ChartFormatter; style?: ChartTextStyle } };
    colors?: { ranges?: { from: number; to: number; color: string }[] };
}

export interface ChartPlotOptions {
    bar?: ChartBarOptions;
    lollipop?: { stemWidth?: number; markerSize?: number };
    waterfall?: {
        /** Indices of the columns drawn from zero to the running total rather than as a step. */
        totals?: number[];
        upColor?: string;
        downColor?: string;
        totalColor?: string;
        /** The thin line carrying each step to the next. On by default. */
        connectors?: boolean;
    };
    /** How many bins; Sturges' rule decides when this is left out. */
    histogram?: { bins?: number };
    boxPlot?: { upColor?: string; downColor?: string };
    radialBar?: {
        /** The value at the start of the ring and at the end of it. */
        min?: number;
        max?: number;
        /** Where the rings begin and end, in degrees clockwise from twelve o'clock. */
        startAngle?: number;
        endAngle?: number;
        /** The hole in the middle, as a share of the outer radius. */
        hollow?: { size?: string | number; background?: string };
        /** The space between two rings. */
        trackGap?: number;
        offsetX?: number;
        offsetY?: number;
    };
    /** A sunburst's hole in the middle, as a share of its radius. */
    sunburst?: { hollow?: string };
    /** Boxes packed by area. */
    treemap?: { distributed?: boolean; radius?: number };
    calendar?: {
        /** The range to draw; the data's own first and last day otherwise. */
        from?: string | number;
        to?: string | number;
        /** Which weekday is the top row: 0 is Sunday. */
        weekStart?: number;
        /** The value at the palest shade and at the fullest. */
        min?: number;
        max?: number;
        shadeSteps?: number;
        gap?: number;
        radius?: number;
    };
    /** Where a streamgraph's stack floats. */
    stream?: { offset?: 'wiggle' | 'silhouette' | 'zero' };
    bullet?: {
        /** The bands behind the bars: poor, fair, good, read as one scale. */
        ranges?: { from: number; to: number; color?: string }[];
        /** How thick the mark to beat is drawn. */
        targetWidth?: number;
        targetColor?: string;
    };
    funnel?: {
        /** How wide the last stage is drawn, as a share of the first: `'0%'` narrows to a point. */
        neck?: string;
        gap?: number;
        horizontal?: boolean;
    };
    pie?: {
        startAngle?: number;
        endAngle?: number;
        /** A click pulls the slice out, and keeps it selected. */
        expandOnClick?: boolean;
        customScale?: number;
        offsetX?: number;
        offsetY?: number;
        dataLabels?: { offset?: number; minAngleToShowLabel?: number };
        donut?: {
            size?: string;
            background?: string;
            labels?: {
                show?: boolean;
                name?: { show?: boolean; style?: ChartTextStyle };
                value?: { show?: boolean; formatter?: ChartFormatter; style?: ChartTextStyle };
                total?: { show?: boolean; showAlways?: boolean; label?: string; formatter?: ChartFormatter };
            };
        };
    };
    radar?: {
        size?: number;
        offsetX?: number;
        offsetY?: number;
        /** `'web'` rings and spokes, or `'polygon'` shaded bands. */
        grid?: 'web' | 'polygon' | 'none';
        polygons?: { strokeColors?: string; strokeWidth?: number; connectorColors?: string; fill?: { colors?: string[] } };
    };
    heatmap?: {
        radius?: number;
        enableShades?: boolean;
        /** Shade steps; a continuous ramp makes near values indistinguishable. */
        shadeSteps?: number;
        shadeIntensity?: number;
        distributed?: boolean;
        useFillColorAsStroke?: boolean;
        colorScale?: { ranges?: { from: number; to: number; color: string; name?: string }[]; inverse?: boolean; min?: number; max?: number };
    };
    candlestick?: {
        colors?: { upward?: string; downward?: string };
        /** Rising candles drawn hollow. */
        hollowRising?: boolean;
        wick?: { useFillColor?: boolean };
    };
    bubble?: { minBubbleRadius?: number; maxBubbleRadius?: number };
}

export interface ChartAnnotationLabel {
    text?: string;
    position?: 'left' | 'center' | 'right' | 'top' | 'bottom';
    textAnchor?: 'start' | 'middle' | 'end';
    offsetX?: number;
    offsetY?: number;
    borderColor?: string;
    style?: ChartTextStyle & { background?: string };
}

export interface ChartAnnotations {
    position?: 'front' | 'back';
    yaxis?: { y: number; y2?: number; yAxisIndex?: number; borderColor?: string; fillColor?: string; opacity?: number; strokeDashArray?: number; width?: string; label?: ChartAnnotationLabel }[];
    xaxis?: { x: number | string; x2?: number | string; borderColor?: string; fillColor?: string; opacity?: number; strokeDashArray?: number; label?: ChartAnnotationLabel }[];
    points?: { x: number | string; y: number; yAxisIndex?: number; seriesIndex?: number; marker?: { size?: number; fillColor?: string; strokeColor?: string; strokeWidth?: number }; label?: ChartAnnotationLabel }[];
}

export interface ChartToolbar {
    show?: boolean;
    tools?: { download?: boolean; selection?: boolean; zoom?: boolean; zoomin?: boolean; zoomout?: boolean; pan?: boolean; reset?: boolean };
    export?: { filename?: string; csv?: { headerCategory?: string; headerValue?: string } };
    /** Which drag the plot starts in. */
    autoSelected?: 'zoom' | 'pan' | 'selection';
}

export interface ChartSettings {
    type?: ChartType;
    height?: number | string;
    width?: number | string;
    id?: string;
    /** Charts in one group share their crosshair, tooltip and zoom. */
    group?: string;
    stacked?: boolean;
    stackType?: 'normal' | '100%';
    background?: string;
    fontFamily?: string;
    foreColor?: string;
    sparkline?: { enabled?: boolean };
    zoom?: {
        enabled?: boolean;
        type?: 'x' | 'y' | 'xy';
        /** Rescale the y axis to what the window shows. */
        autoScaleYaxis?: boolean;
        /** Off by default: a chart in a scrolling page must not steal the wheel. */
        allowMouseWheelZoom?: boolean;
        /** With the wheel on, it still wants this key down. */
        wheelModifier?: 'ctrl' | 'none';
        /**
         * Milliseconds a finger rests before its drag zooms, so a swipe over
         * the chart still reads it rather than selecting a window. 300 by
         * default; `0` makes a finger drag like a mouse.
         */
        touchDelay?: number;
    };
    /** A drag with Shift pans instead of zooming. */
    pan?: { enabled?: boolean; modifier?: 'shift' | 'none' };
    /** The range a brush chart shows over its target; also the initial window. */
    selection?: { enabled?: boolean; type?: 'x'; xaxis?: { min?: number; max?: number }; fill?: { color?: string; opacity?: number }; stroke?: { color?: string } };
    /** This chart is a brush: its selection drives the chart whose `chart.id` is `target`. */
    brush?: { enabled?: boolean; target?: string; autoScaleYaxis?: boolean };
    toolbar?: ChartToolbar;
    animations?: {
        enabled?: boolean;
        speed?: number;
        /** The shape of the movement, for both the first draw and every change after it. */
        easing?: ChartEasing;
        /** Series enter one after another rather than together, `delay` apart. */
        animateGradually?: { enabled?: boolean; delay?: number };
        /** How new data reaches the screen once the chart is already drawn. */
        dynamicAnimation?: { enabled?: boolean; speed?: number };
    };
    /** Accessibility extras. */
    accessibility?: {
        /** Replaces the generated summary that names the chart. */
        description?: string;
        /** The chart takes focus, and the arrows read it point by point. Defaults to true. */
        keyboard?: boolean;
        /** A visually hidden table of the data after the chart. Defaults to false. */
        dataTable?: boolean;
    };
}

export interface ChartResponsive {
    /** Applies when the chart is this wide or narrower, in pixels. */
    breakpoint: number;
    options: ChartOptions;
}

export interface ChartOptions {
    chart?: ChartSettings;
    colors?: string[];
    /** Slice names of a pie or donut, spoke names of a radar. */
    labels?: string[];
    xaxis?: ChartXAxis;
    yaxis?: ChartYAxis | ChartYAxis[];
    grid?: ChartGrid;
    stroke?: ChartStroke;
    fill?: ChartFill;
    markers?: ChartMarkers;
    dataLabels?: ChartDataLabels;
    legend?: ChartLegend;
    tooltip?: ChartTooltip;
    plotOptions?: ChartPlotOptions;
    annotations?: ChartAnnotations;
    responsive?: ChartResponsive[];
    theme?: { monochrome?: { enabled?: boolean; color?: string; shadeTo?: 'light' | 'dark'; shadeIntensity?: number } };
    noData?: { text?: string; align?: 'left' | 'center' | 'right'; verticalAlign?: 'top' | 'middle' | 'bottom'; style?: ChartTextStyle };
    title?: ChartTitle;
    subtitle?: ChartTitle;
    states?: { hover?: { filter?: { type?: 'none' | 'lighten' | 'darken' } }; active?: { allowMultipleDataPointsSelection?: boolean; filter?: { type?: 'none' | 'lighten' | 'darken' } } };
}

/** The options with every function-valued field taken out: what JSON can carry. */
export type ChartOptionsJSON = JsonOnly<ChartOptions>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (...args: any[]) => any;
type JsonOnly<T> = T extends Fn ? never : T extends (infer U)[] ? JsonOnly<U>[] : T extends object ? { [K in keyof T]: JsonOnly<Exclude<T[K], Fn>> } : T;

// ---- series -----------------------------------------------------------------------

export type ChartPointInput =
    | number
    | null
    | [x: number | string, y: number | null]
    | [x: number | string, open: number, high: number, low: number, close: number]
    | { x: number | string | Date; y: number | null | number[]; z?: number; /** A bullet chart's mark to beat. */ target?: number; /** A sunburst's parent node, by name. */ parent?: string; fillColor?: string; goals?: unknown };

export interface ChartSeriesInput {
    name?: string;
    /** The mark for this series, in a combined chart (`line` over `bar`). */
    type?: ChartType;
    color?: string;
    /** Several stacks side by side: series with the same group stack together. */
    group?: string;
    data: ChartPointInput[];
    hidden?: boolean;
}

/** An array of series; a pie, a donut or a single radar may also take a bare array of numbers. */
export type ChartSeries = ChartSeriesInput[] | number[];
