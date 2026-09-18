import { deepMerge, isObject, type Dict } from '@vitral/core';
import type { ChartOptions, ChartType, ChartYAxis } from './types';

/**
 * A description of every chart option (its kind, allowed values, default and
 * meaning) as plain data a visual editor can walk to build its form.
 * `defaultChartOptions` is read out of it, so the two cannot disagree.
 */
export type ChartOptionSchema =
    | { type: 'boolean'; default?: boolean; description?: string }
    | { type: 'number'; default?: number; min?: number; max?: number; step?: number; description?: string }
    | { type: 'string' | 'color' | 'template' | 'size'; default?: string; description?: string }
    | { type: 'enum'; values: readonly (string | number)[]; default?: string | number; description?: string }
    | { type: 'object'; properties: Record<string, ChartOptionSchema>; description?: string }
    | { type: 'array'; items: ChartOptionSchema; default?: unknown[]; description?: string }
    | { type: 'union'; anyOf: ChartOptionSchema[]; default?: unknown; description?: string };

const bool = (d?: boolean, description?: string): ChartOptionSchema => ({ type: 'boolean', default: d, description });
const num = (d?: number, description?: string, range: { min?: number; max?: number; step?: number } = {}): ChartOptionSchema => ({ type: 'number', default: d, description, ...range });
const str = (d?: string, description?: string): ChartOptionSchema => ({ type: 'string', default: d, description });
const color = (d?: string, description?: string): ChartOptionSchema => ({ type: 'color', default: d, description });
const size = (d?: string, description?: string): ChartOptionSchema => ({ type: 'size', default: d, description });
const template = (d?: string, description?: string): ChartOptionSchema => ({ type: 'template', default: d, description });
const oneOf = <T extends string | number>(values: readonly T[], d?: T, description?: string): ChartOptionSchema => ({ type: 'enum', values, default: d, description });
const objectSchema = (properties: Record<string, ChartOptionSchema>, description?: string): Extract<ChartOptionSchema, { type: 'object' }> => ({ type: 'object', properties, description });
const obj = (properties: Record<string, ChartOptionSchema>, description?: string): ChartOptionSchema => objectSchema(properties, description);
const list = (items: ChartOptionSchema, d?: unknown[], description?: string): ChartOptionSchema => ({ type: 'array', items, default: d, description });
const either = (anyOf: ChartOptionSchema[], d?: unknown, description?: string): ChartOptionSchema => ({ type: 'union', anyOf, default: d, description });

export const chartTypes: readonly ChartType[] = [
    'line',
    'area',
    'bar',
    'lollipop',
    'scatter',
    'bubble',
    'heatmap',
    'candlestick',
    'pie',
    'donut',
    'radar',
    'waterfall',
    'rangeBar',
    'rangeArea',
    'histogram',
    'boxPlot',
    'stream',
    'bullet',
    'treemap',
    'calendar',
    'sunburst',
    'radialBar',
    'gauge',
    'funnel'
];

const textStyle = obj({ fontSize: size(undefined, 'CSS font size; the theme’s by default'), fontWeight: either([str(), num()]), fontFamily: str(), color: color() });
const titleSchema = obj({
    text: str(undefined, 'Shown above the chart'),
    align: oneOf(['left', 'center', 'right'] as const, 'left'),
    margin: num(8, 'Space under it, in pixels'),
    offsetX: num(0),
    offsetY: num(0),
    style: textStyle
});
const axisLine = obj({ show: bool(true), color: color() });
const markerShape = oneOf(['circle', 'square', 'diamond', 'triangle'] as const, 'circle');
const annotationLabel = obj({
    text: str(),
    position: oneOf(['left', 'center', 'right', 'top', 'bottom'] as const),
    textAnchor: oneOf(['start', 'middle', 'end'] as const),
    offsetX: num(0),
    offsetY: num(0),
    borderColor: color(),
    style: obj({ fontSize: size(), fontWeight: either([str(), num()]), color: color(), background: color() })
});
const axisLabels = (formatter: string) =>
    obj({
        show: bool(true),
        formatter: template(formatter, 'Template for each tick: {value}, with a preset such as {value|compact}'),
        rotate: num(0, 'Degrees', { min: -90, max: 90 }),
        hideOverlappingLabels: bool(true),
        offsetX: num(0),
        offsetY: num(0),
        style: textStyle,
        datetimeFormatter: obj(
            { year: str('yyyy'), month: str("MMM yyyy"), day: str('d MMM'), hour: str('HH:mm'), minute: str('HH:mm'), second: str('HH:mm:ss') },
            'formatDate patterns for datetime ticks, by the boundary a tick falls on'
        )
    });
const yaxisSchema = obj({
    show: bool(true),
    seriesName: either([str(), list(str())], undefined, 'The series this axis measures'),
    opposite: bool(false, 'On the right'),
    min: num(),
    max: num(),
    tickAmount: num(5, 'About how many intervals', { min: 1, max: 20, step: 1 }),
    forceNiceScale: bool(true, 'Snap to 1, 2, 5 × 10ⁿ'),
    reversed: bool(false),
    decimalsInFloat: num(undefined, 'Decimals on the labels', { min: 0, max: 10, step: 1 }),
    labels: axisLabels('{value}'),
    title: obj({ text: str(), style: textStyle }),
    axisBorder: obj({ show: bool(false), color: color() }),
    axisTicks: obj({ show: bool(false), color: color() })
});
const rangeList = (extra: Record<string, ChartOptionSchema> = {}) => list(obj({ from: num(), to: num(), color: color(), ...extra }), []);

export type ChartObjectSchema = Extract<ChartOptionSchema, { type: 'object' }>;

export const chartOptionsSchema: ChartObjectSchema = objectSchema({
    chart: obj({
        type: oneOf(chartTypes, 'line'),
        height: either([num(), size()], 320, 'Pixels, or a CSS length'),
        width: either([num(), size()], '100%'),
        id: str(undefined, 'Names the chart for a brush'),
        group: str(undefined, 'Charts in one group share crosshair, tooltip and zoom'),
        stacked: bool(false),
        stackType: oneOf(['normal', '100%'] as const, 'normal'),
        background: color(undefined, 'Behind the whole chart'),
        fontFamily: str(),
        foreColor: color(undefined, 'Text colour'),
        sparkline: obj({ enabled: bool(false, 'Just the marks: no axes, grid, legend or toolbar') }),
        zoom: obj({
            enabled: bool(true, 'Drag across the plot to zoom'),
            type: oneOf(['x', 'y', 'xy'] as const, 'x'),
            autoScaleYaxis: bool(false),
            allowMouseWheelZoom: bool(false, 'Off by default so the page still scrolls'),
            wheelModifier: oneOf(['ctrl', 'none'] as const, 'ctrl')
        }),
        pan: obj({ enabled: bool(true), modifier: oneOf(['shift', 'none'] as const, 'shift') }),
        selection: obj({
            enabled: bool(false),
            type: oneOf(['x'] as const, 'x'),
            xaxis: obj({ min: num(), max: num() }),
            fill: obj({ color: color(), opacity: num(undefined, undefined, { min: 0, max: 1, step: 0.05 }) }),
            stroke: obj({ color: color() })
        }),
        brush: obj({ enabled: bool(false), target: str(undefined, 'The chart.id this brush drives'), autoScaleYaxis: bool(true) }),
        toolbar: obj({
            show: bool(true),
            tools: obj({ download: bool(true), selection: bool(false), zoom: bool(true), zoomin: bool(true), zoomout: bool(true), pan: bool(true), reset: bool(true) }),
            export: obj({ filename: str('chart'), csv: obj({ headerCategory: str('category'), headerValue: str('value') }) }),
            autoSelected: oneOf(['zoom', 'pan', 'selection'] as const, 'zoom')
        }),
        animations: obj({
            enabled: bool(true, 'Always off under prefers-reduced-motion'),
            speed: num(500, 'Milliseconds', { min: 0, max: 3000, step: 50 }),
            dynamicAnimation: obj({ enabled: bool(true), speed: num(300) })
        }),
        accessibility: obj({
            description: str(undefined, 'Replaces the generated summary'),
            keyboard: bool(true, 'Arrow keys read the data point by point'),
            dataTable: bool(false, 'A visually hidden table of the data')
        })
    }),
    colors: list(color(), ['var(--vt-chart-1)', 'var(--vt-chart-2)', 'var(--vt-chart-3)', 'var(--vt-chart-4)', 'var(--vt-chart-5)', 'var(--vt-chart-6)', 'var(--vt-chart-7)', 'var(--vt-chart-8)'], 'The series palette; the theme’s by default'),
    labels: list(str(), undefined, 'Slice names (pie, donut) or spoke names (radar)'),
    xaxis: obj({
        type: oneOf(['category', 'numeric', 'datetime'] as const, 'category'),
        categories: list(either([str(), num()]), undefined),
        min: num(),
        max: num(),
        tickAmount: num(undefined, 'About how many ticks', { min: 1, max: 30, step: 1 }),
        position: oneOf(['bottom', 'top'] as const, 'bottom'),
        labels: axisLabels('{value}'),
        title: obj({ text: str(), offsetY: num(0), style: textStyle }),
        axisBorder: axisLine,
        axisTicks: obj({ show: bool(true), color: color(), height: num(5) }),
        crosshairs: obj({
            show: bool(true),
            width: either([num(), oneOf(['barWidth'] as const)], 1),
            position: oneOf(['back', 'front'] as const, 'back'),
            stroke: obj({ color: color(), width: num(1), dashArray: num(3) }),
            fill: obj({ color: color(), opacity: num(undefined, undefined, { min: 0, max: 1, step: 0.05 }) })
        }),
        tooltip: obj({ enabled: bool(false, 'A readout of x on the axis') })
    }),
    yaxis: either([yaxisSchema, list(yaxisSchema)], undefined, 'One axis, or several; each can measure named series'),
    grid: obj({
        show: bool(true),
        borderColor: color(),
        strokeDashArray: num(0),
        position: oneOf(['back', 'front'] as const, 'back'),
        xaxis: obj({ lines: obj({ show: bool(false) }) }),
        yaxis: obj({ lines: obj({ show: bool(true) }) }),
        row: obj({ colors: list(color()), opacity: num(0.5, undefined, { min: 0, max: 1, step: 0.05 }) }),
        column: obj({ colors: list(color()), opacity: num(0.5, undefined, { min: 0, max: 1, step: 0.05 }) }),
        padding: obj({ top: num(0), right: num(10), bottom: num(0), left: num(10) })
    }),
    stroke: obj({
        show: bool(true),
        curve: either([oneOf(['straight', 'smooth', 'monotoneCubic', 'stepline'] as const), list(oneOf(['straight', 'smooth', 'monotoneCubic', 'stepline'] as const))], 'smooth'),
        width: either([num(undefined, undefined, { min: 0, max: 20, step: 0.5 }), list(num())], 2),
        dashArray: either([num(), list(num())], 0),
        lineCap: oneOf(['butt', 'round', 'square'] as const, 'round'),
        colors: list(color())
    }),
    fill: obj({
        type: either([oneOf(['solid', 'gradient'] as const), list(oneOf(['solid', 'gradient'] as const))], 'solid'),
        opacity: either([num(undefined, undefined, { min: 0, max: 1, step: 0.05 }), list(num())], 1),
        colors: list(color()),
        gradient: obj({ type: oneOf(['vertical', 'horizontal'] as const, 'vertical'), opacityFrom: num(0.5), opacityTo: num(0.05), stops: list(num(), [0, 100]) })
    }),
    markers: obj({
        size: either([num(undefined, undefined, { min: 0, max: 30, step: 1 }), list(num())], 0),
        colors: list(color()),
        strokeColors: either([color(), list(color())], undefined),
        strokeWidth: num(2),
        shape: either([markerShape, list(markerShape)], 'circle'),
        hover: obj({ size: num(), sizeOffset: num(3) })
    }),
    dataLabels: obj({
        enabled: bool(false),
        enabledOnSeries: list(num()),
        formatter: template('{value}'),
        offsetX: num(0),
        offsetY: num(0),
        textAnchor: oneOf(['start', 'middle', 'end'] as const, 'middle'),
        style: textStyle,
        background: obj({ enabled: bool(false), color: color(), borderRadius: num(2), padding: num(4) })
    }),
    legend: obj({
        show: bool(true),
        showForSingleSeries: bool(false),
        position: oneOf(['top', 'right', 'bottom', 'left'] as const, 'bottom'),
        horizontalAlign: oneOf(['left', 'center', 'right'] as const, 'center'),
        formatter: template('{series}'),
        fontSize: size(),
        markers: obj({ size: num(10), shape: markerShape }),
        onItemClick: obj({ toggleDataSeries: bool(true) }),
        onItemHover: obj({ highlightDataSeries: bool(true) })
    }),
    tooltip: obj({
        enabled: bool(true),
        trigger: oneOf(['hover', 'click'] as const, 'hover'),
        shared: bool(true),
        intersect: bool(false),
        followCursor: bool(false),
        marker: obj({ show: bool(true) }),
        x: obj({ show: bool(true), formatter: template(), format: str(undefined, 'formatDate pattern for datetime x values') }),
        y: obj({ formatter: template('{value}'), title: obj({ formatter: template('{series}') }) }),
        z: obj({ formatter: template('{value}'), title: str('Size') }),
        custom: template(undefined, 'A panel template with {title} and {rows}')
    }),
    plotOptions: obj({
        bar: obj({
            horizontal: bool(false),
            borderRadius: num(3, undefined, { min: 0, max: 30, step: 1 }),
            borderRadiusApplication: oneOf(['end', 'around'] as const, 'end'),
            borderRadiusWhenStacked: oneOf(['last', 'all'] as const, 'last'),
            columnWidth: size('70%'),
            barHeight: size('70%'),
            distributed: bool(false),
            dataLabels: obj({
                position: oneOf(['top', 'center', 'bottom'] as const, 'center'),
                total: obj({ enabled: bool(false), formatter: template('{value}'), style: textStyle })
            }),
            colors: obj({ ranges: rangeList() })
        }),
        lollipop: obj({ stemWidth: num(2), markerSize: num(10) }),
        waterfall: obj({
            /** Columns drawn from zero to the running total rather than as a step. */
            totals: list(num(), [], 'Indices of the columns that are subtotals'),
            upColor: color(undefined, 'A step that adds'),
            downColor: color(undefined, 'A step that takes away'),
            totalColor: color(undefined, 'A subtotal column'),
            connectors: bool(true, 'The thin line carrying each step to the next')
        }),
        histogram: obj({ bins: num(undefined, 'How many bins; Sturges’ rule decides when this is left out', { min: 1, max: 200, step: 1 }) }),
        boxPlot: obj({ upColor: color(undefined, 'A box whose median sits above the middle of its range'), downColor: color(undefined, 'A box whose median sits below it') }),
        calendar: obj({
            from: str(undefined, 'The first day to draw; the first day in the data otherwise'),
            to: str(undefined, 'The last day to draw'),
            weekStart: num(0, 'Which weekday is the top row: 0 is Sunday', { min: 0, max: 6, step: 1 }),
            min: num(0, 'The value drawn at the palest shade'),
            max: num(undefined, 'The value drawn at the fullest shade; the largest one otherwise'),
            shadeSteps: num(4, 'How many shades the scale has', { min: 1, max: 12, step: 1 }),
            gap: num(2, 'The space between two days'),
            radius: num(2, 'How round a day is')
        }),
        sunburst: obj({ hollow: size('25%', 'The hole in the middle, as a share of the radius') }),
        radialBar: obj({
            min: num(0, 'The value a ring starts from'),
            max: num(100, 'The value a full ring stands for'),
            startAngle: num(undefined, 'Where the rings begin, in degrees clockwise from twelve o’clock'),
            endAngle: num(undefined, 'Where they end'),
            hollow: obj({ size: size('45%', 'The hole in the middle, as a share of the outer radius'), background: color() }),
            trackGap: num(4, 'The space between two rings'),
            offsetX: num(0),
            offsetY: num(0)
        }),
        treemap: obj({
            distributed: bool(false, 'Colour every box by rank rather than by the series it belongs to'),
            radius: num(2, 'How round the corners of a box are', { min: 0, max: 24, step: 1 })
        }),
        bullet: obj({
            ranges: list(obj({ from: num(0), to: num(0), color: color() }), [], 'The bands behind the bars, read as one scale'),
            targetWidth: num(3, 'How thick the mark to beat is drawn', { min: 1, max: 12, step: 1 }),
            targetColor: color(undefined, 'The mark to beat')
        }),
        stream: obj({ offset: oneOf(['wiggle', 'silhouette', 'zero'] as const, 'wiggle', 'Where the stack floats: cancelling the slopes, centred, or on the axis') }),
        funnel: obj({
            /** A funnel narrowing to a point, rather than to the width of its last stage. */
            neck: size('0%', 'How wide the last stage is drawn, as a share of the first'),
            gap: num(4, 'Pixels between the stages', { min: 0, max: 40, step: 1 }),
            horizontal: bool(false, 'Stages across rather than down')
        }),
        pie: obj({
            startAngle: num(0, undefined, { min: -360, max: 360 }),
            endAngle: num(360, undefined, { min: -360, max: 360 }),
            expandOnClick: bool(true),
            customScale: num(1, undefined, { min: 0.3, max: 1.5, step: 0.05 }),
            offsetX: num(0),
            offsetY: num(0),
            dataLabels: obj({ offset: num(0), minAngleToShowLabel: num(10) }),
            donut: obj({
                size: size('62%'),
                background: color('transparent'),
                labels: obj({
                    show: bool(true),
                    name: obj({ show: bool(true), style: textStyle }),
                    value: obj({ show: bool(true), formatter: template('{value}'), style: textStyle }),
                    total: obj({ show: bool(true), showAlways: bool(false), label: str(undefined, 'Defaults to the locale’s “Total”'), formatter: template('{value}') })
                })
            })
        }),
        radar: obj({
            size: num(undefined, 'Radius in pixels'),
            offsetX: num(0),
            offsetY: num(0),
            grid: oneOf(['web', 'polygon', 'none'] as const, 'web'),
            polygons: obj({ strokeColors: color(), strokeWidth: num(1), connectorColors: color(), fill: obj({ colors: list(color()) }) })
        }),
        heatmap: obj({
            radius: num(2),
            enableShades: bool(true),
            shadeSteps: num(5, undefined, { min: 2, max: 20, step: 1 }),
            shadeIntensity: num(0.85, undefined, { min: 0, max: 1, step: 0.05 }),
            distributed: bool(false),
            useFillColorAsStroke: bool(false),
            colorScale: obj({ ranges: rangeList({ name: str() }), inverse: bool(false), min: num(), max: num() })
        }),
        candlestick: obj({
            colors: obj({ upward: color('var(--vt-success-color)'), downward: color('var(--vt-danger-color)') }),
            hollowRising: bool(false),
            wick: obj({ useFillColor: bool(true) })
        }),
        bubble: obj({ minBubbleRadius: num(4), maxBubbleRadius: num(28) })
    }),
    annotations: obj({
        position: oneOf(['front', 'back'] as const, 'front'),
        yaxis: list(
            obj({ y: num(), y2: num(), yAxisIndex: num(0), borderColor: color(), fillColor: color(), opacity: num(0.15), strokeDashArray: num(4), width: size('100%'), label: annotationLabel }),
            []
        ),
        xaxis: list(obj({ x: either([num(), str()]), x2: either([num(), str()]), borderColor: color(), fillColor: color(), opacity: num(0.15), strokeDashArray: num(4), label: annotationLabel }), []),
        points: list(
            obj({
                x: either([num(), str()]),
                y: num(),
                yAxisIndex: num(0),
                seriesIndex: num(0),
                marker: obj({ size: num(5), fillColor: color(), strokeColor: color(), strokeWidth: num(2) }),
                label: annotationLabel
            }),
            []
        )
    }),
    responsive: list(obj({ breakpoint: num(undefined, 'Applies at this width in pixels or narrower'), options: obj({}, 'Any options, merged over the rest') }), []),
    theme: obj({ monochrome: obj({ enabled: bool(false), color: color('var(--vt-chart-1)'), shadeTo: oneOf(['light', 'dark'] as const, 'light'), shadeIntensity: num(0.65) }) }),
    noData: obj({ text: str(undefined, 'Defaults to the locale’s text'), align: oneOf(['left', 'center', 'right'] as const, 'center'), verticalAlign: oneOf(['top', 'middle', 'bottom'] as const, 'middle'), style: textStyle }),
    title: titleSchema,
    subtitle: titleSchema,
    states: obj({
        hover: obj({ filter: obj({ type: oneOf(['none', 'lighten', 'darken'] as const, 'lighten') }) }),
        active: obj({ allowMultipleDataPointsSelection: bool(false), filter: obj({ type: oneOf(['none', 'lighten', 'darken'] as const, 'darken') }) })
    })
});

/** The defaults an options object is merged over, read from the schema. */
export function defaultsOf(schema: ChartOptionSchema): unknown {
    if (schema.type === 'object') {
        const out: Dict = {};
        for (const [key, child] of Object.entries(schema.properties)) {
            const value = defaultsOf(child);
            if (value !== undefined) out[key] = value;
        }
        return Object.keys(out).length ? out : undefined;
    }
    if (schema.type === 'union' && schema.default === undefined) {
        const first = schema.anyOf.find((s) => s.type === 'object');
        return first ? defaultsOf(first) : undefined;
    }
    return 'default' in schema ? schema.default : undefined;
}

export const defaultChartOptions = Object.freeze(defaultsOf(chartOptionsSchema) as ChartOptions);

/**
 * Types drawn as a field of cells rather than as marks on a pair of axes:
 * they have no scales, their hit testing is by rectangle, and the legend and
 * the shared tooltip have nothing to say about them.
 */
export const cellTypes = new Set<ChartType>(['heatmap', 'treemap', 'calendar']);

/** The defaults each chart type brings over the common ones. */
export const chartTypeDefaults: Record<ChartType, ChartOptions> = {
    line: { markers: { size: 0 } },
    area: { fill: { type: 'gradient', opacity: 0.35 }, stroke: { width: 2 } },
    bar: { stroke: { show: false, width: 0 }, xaxis: { crosshairs: { width: 'barWidth' } }, grid: { padding: { left: 0, right: 0 } } },
    lollipop: { stroke: { show: false, width: 0 }, xaxis: { crosshairs: { width: 'barWidth' } }, plotOptions: { bar: { dataLabels: { position: 'top' } } } },
    scatter: { markers: { size: 7 }, stroke: { show: false, width: 0 }, tooltip: { shared: false, intersect: true }, xaxis: { type: 'numeric', crosshairs: { show: false } }, chart: { zoom: { type: 'xy' } } },
    bubble: { fill: { opacity: 0.75 }, stroke: { show: false, width: 0 }, tooltip: { shared: false, intersect: true }, xaxis: { type: 'numeric', crosshairs: { show: false } }, chart: { zoom: { type: 'xy' } } },
    heatmap: { dataLabels: { enabled: true }, stroke: { show: true, width: 2 }, legend: { show: false }, tooltip: { shared: false, intersect: true }, grid: { show: false }, xaxis: { crosshairs: { show: false } }, chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } } },
    candlestick: { stroke: { show: false, width: 1 }, xaxis: { crosshairs: { width: 'barWidth' } } },
    pie: { dataLabels: { enabled: true, formatter: '{percent|percent}' }, stroke: { show: true, width: 2 }, legend: { position: 'right' }, tooltip: { shared: false, intersect: true }, chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } } },
    donut: { dataLabels: { enabled: true, formatter: '{percent|percent}' }, stroke: { show: true, width: 2 }, legend: { position: 'right' }, tooltip: { shared: false, intersect: true }, chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } } },
    radar: { markers: { size: 6, strokeWidth: 1 }, fill: { opacity: 0.2 }, stroke: { width: 2, curve: 'straight' }, tooltip: { shared: true }, chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } } },
    // A waterfall is one series read across, so a legend of one name says nothing.
    waterfall: { stroke: { show: false, width: 0 }, legend: { show: false }, dataLabels: { enabled: true }, xaxis: { crosshairs: { width: 'barWidth' } }, grid: { padding: { left: 0, right: 0 } } },
    rangeBar: { stroke: { show: false, width: 0 }, xaxis: { crosshairs: { width: 'barWidth' } }, grid: { padding: { left: 0, right: 0 } } },
    rangeArea: { fill: { opacity: 0.25 }, stroke: { width: 2 } },
    // Bins touch: a gap between them would suggest values that fall nowhere.
    histogram: { stroke: { show: true, width: 1 }, legend: { show: false }, plotOptions: { bar: { columnWidth: '100%' } }, xaxis: { crosshairs: { width: 'barWidth' } }, grid: { padding: { left: 0, right: 0 } } },
    boxPlot: { stroke: { show: false, width: 1 }, legend: { show: false }, xaxis: { crosshairs: { width: 'barWidth' } } },
    // A bullet is one measure against its target: the bands say how it is
    // doing, so the grid would only repeat them.
    bullet: {
        stroke: { show: false, width: 0 },
        legend: { show: false },
        grid: { show: false, padding: { left: 0, right: 0 } },
        plotOptions: { bar: { horizontal: true, barHeight: '40%' } },
        xaxis: { crosshairs: { show: false } },
        chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } }
    },
    // A treemap is all fill: the axes measure nothing and the legend names the
    // groups, which the boxes already carry.
    treemap: {
        dataLabels: { enabled: true, formatter: '{seriesName}' },
        stroke: { show: true, width: 2 },
        tooltip: { shared: false, intersect: true },
        grid: { show: false },
        xaxis: { crosshairs: { show: false } },
        chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } }
    },
    // A sunburst names what it can and leaves the rest to the tooltip.
    sunburst: {
        // The ring is read for what each part is, not for its number.
        dataLabels: { enabled: true, formatter: '{seriesName}' },
        legend: { show: false },
        stroke: { show: true, width: 1 },
        tooltip: { shared: false, intersect: true },
        grid: { show: false },
        chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } }
    },
    // Rings and gauges are read off the track behind them, not off an axis.
    radialBar: {
        dataLabels: { enabled: true },
        legend: { position: 'right' },
        stroke: { show: false, width: 0 },
        tooltip: { shared: false, intersect: true },
        grid: { show: false },
        chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } }
    },
    gauge: {
        // The reading in the middle is the gauge's data label, and the arc is
        // a band rather than most of a disc.
        plotOptions: { radialBar: { hollow: { size: '78%' } } },
        dataLabels: { enabled: true, formatter: '{percent|percent:0}' },
        legend: { show: false },
        stroke: { show: false, width: 0 },
        tooltip: { shared: false, intersect: true },
        grid: { show: false },
        chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } }
    },
    // A calendar is a grid of days: nothing about it is a scale.
    calendar: {
        dataLabels: { enabled: false },
        legend: { show: false },
        stroke: { show: false, width: 0 },
        tooltip: { shared: false, intersect: true },
        grid: { show: false },
        xaxis: { crosshairs: { show: false } },
        chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } }
    },
    // A stream is read for its shape, and a scale off a floating baseline
    // measures nothing, so the axis and the grid stay out of the way.
    stream: { chart: { stacked: true }, fill: { opacity: 0.85 }, stroke: { curve: 'monotoneCubic', width: 0, show: false }, yaxis: { show: false }, grid: { show: false }, tooltip: { shared: true } },
    funnel: {
        dataLabels: { enabled: true },
        legend: { show: false },
        grid: { show: false },
        tooltip: { shared: false, intersect: true },
        xaxis: { crosshairs: { show: false } },
        chart: { zoom: { enabled: false }, toolbar: { tools: { zoomin: false, zoomout: false, pan: false, reset: false, zoom: false } } }
    }
};

const sparkline: ChartOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false } },
    grid: { show: false, padding: { top: 2, right: 2, bottom: 2, left: 2 } },
    xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false }, title: { text: undefined } },
    yaxis: { show: false },
    legend: { show: false },
    dataLabels: { enabled: false },
    title: { text: undefined },
    subtitle: { text: undefined }
};

export interface ResolvedChartOptions extends ChartOptions {
    /** Every y axis, each with its defaults filled in. */
    yaxes: ChartYAxis[];
}

/**
 * The options a chart actually uses at `width`: the defaults, the type's
 * defaults, the given options, then every `responsive` entry whose breakpoint
 * the width is under, widest first, so the narrowest one wins.
 */
export function resolveChartOptions(options: ChartOptions | undefined, type: ChartType, width = Infinity): ResolvedChartOptions {
    const given = options ?? {};
    const layers: Dict[] = [defaultChartOptions as Dict, chartTypeDefaults[type] as Dict, given as Dict];
    const responsive = [...(given.responsive ?? [])].filter((r) => width <= r.breakpoint).sort((a, b) => b.breakpoint - a.breakpoint);
    for (const r of responsive) layers.push(r.options as Dict);
    let merged = deepMerge<Dict>(...layers.map(stripYaxis));
    if (merged.chart?.sparkline?.enabled) merged = deepMerge(merged, stripYaxis(sparkline as Dict));
    // Axes: the last layer that names them decides how many there are; each takes the defaults.
    const named = [...layers, ...(merged.chart?.sparkline?.enabled ? [sparkline as Dict] : [])].map((l) => l.yaxis).filter((y) => y !== undefined);
    const baseY = (chartOptionsSchema.properties.yaxis as { anyOf: ChartOptionSchema[] }).anyOf[0]!;
    const yDefaults = defaultsOf(baseY) as Dict;
    let yaxes: Dict[] = [{}];
    for (const y of named) {
        if (Array.isArray(y)) yaxes = y as Dict[];
        else if (isObject(y)) yaxes = yaxes.map((axis) => deepMerge(axis, y));
    }
    const resolvedY = yaxes.map((y) => deepMerge(yDefaults, y) as ChartYAxis);
    return { ...(merged as ChartOptions), yaxis: resolvedY, yaxes: resolvedY };
}

function stripYaxis(layer: Dict): Dict {
    if (!layer || !('yaxis' in layer)) return layer;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { yaxis: _y, ...rest } = layer;
    return rest;
}

/** Reads a value out of a per-series option: an array cycles, a single value applies to all. */
export function perSeries<T>(value: T | T[] | undefined, index: number, fallback: T): T {
    if (Array.isArray(value)) return value.length ? (value[index % value.length] ?? fallback) : fallback;
    return value ?? fallback;
}
