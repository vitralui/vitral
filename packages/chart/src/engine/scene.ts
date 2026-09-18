import type { Locale } from '@vitral/core';
import type { Pt } from './geometry';
import type { ResolvedChartOptions } from './options';
import type { NormalizedSeries } from './series';
import type { ChartType } from './types';

/**
 * What a chart looks like, as data: rectangles, paths, text and where each
 * data point is. A renderer only draws it; hit testing, the tooltip and the
 * keyboard read it. Colours are CSS values (often a palette colour, `var(--vt-chart-1)`), and
 * `tone` flags name a themed colour the renderer looks up in its tokens.
 */

export interface SceneText {
    x: number;
    y: number;
    text: string;
    anchor: 'start' | 'middle' | 'end';
    baseline?: 'auto' | 'middle' | 'hanging';
    rotate?: number;
    style?: { fontSize?: string; fontWeight?: string | number; fontFamily?: string; color?: string };
}

export interface SceneTick {
    /** Pixel along the axis. */
    pos: number;
    value: number | string;
    label?: SceneText;
}

export interface SceneAxis {
    side: 'left' | 'right' | 'top' | 'bottom';
    /** The axis line's position across the plot (x for a vertical axis, y for a horizontal one). */
    at: number;
    ticks: SceneTick[];
    line: boolean;
    tickMarks: boolean;
    tickLength: number;
    title?: SceneText;
    color?: string;
}

export interface SceneFill {
    color: string;
    opacity: number;
    gradient?: { vertical: boolean; from: number; to: number; stops: [number, number] };
}

export interface SceneLabel extends SceneText {
    background?: { color?: string; radius: number; padding: number };
    /** Drawn over a filled mark: take the contrasting text colour. */
    onFill?: boolean;
}

export interface SceneMarker {
    x: number;
    y: number;
    size: number;
    shape: 'circle' | 'square' | 'diamond' | 'triangle';
    fill: string;
    stroke?: string;
    strokeWidth: number;
}

/** A data point's place and value, for hit testing, the tooltip and the keyboard. */
export interface SceneDatum {
    series: number;
    /** The point's index in its series. */
    index: number;
    /** The column (category or shared x) it belongs to, on index-based charts. */
    column: number;
    x: number;
    y: number;
    /** Hit radius or half-size, in pixels. */
    r?: number;
    value: number | null;
    /** Formatted value, as the tooltip shows it. */
    text: string;
    /** Category, x value or slice name, formatted. */
    label: string;
    color: string;
    /** Candle values, bubble size… formatted, for extra tooltip rows. */
    extra?: { name: string; text: string }[];
}

export interface SceneLineSeries {
    kind: 'line';
    series: number;
    name: string;
    color: string;
    path: string;
    area?: string;
    fill?: SceneFill;
    width: number;
    dash: number;
    cap: 'butt' | 'round' | 'square';
    markers: SceneMarker[];
    labels: SceneLabel[];
}

export interface SceneBar {
    series: number;
    index: number;
    column: number;
    path: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    /** Lollipop stem and head. */
    stem?: { x1: number; y1: number; x2: number; y2: number; width: number };
    head?: SceneMarker;
}

export interface SceneBarSeries {
    kind: 'bar';
    series: number;
    name: string;
    color: string;
    opacity: number;
    bars: SceneBar[];
    labels: SceneLabel[];
    /** A waterfall's hairlines from each step to the next, as one path. */
    connectors?: string;
}

export interface SceneCandle {
    series: number;
    index: number;
    column: number;
    x: number;
    width: number;
    body: { y: number; height: number };
    wick: { y1: number; y2: number };
    rising: boolean;
    color: string;
    hollow: boolean;
    /** A box plot's median, drawn across the body. */
    median?: number;
    /** A box plot's whisker caps: the short bars at the ends. */
    caps?: boolean;
}

export interface SceneCandleSeries {
    kind: 'candle';
    series: number;
    name: string;
    color: string;
    candles: SceneCandle[];
}

export interface ScenePointSeries {
    kind: 'points';
    series: number;
    name: string;
    color: string;
    opacity: number;
    markers: (SceneMarker & { index: number })[];
    labels: SceneLabel[];
}

export interface SceneCell {
    series: number;
    index: number;
    column: number;
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    color: string;
    /** 0–1 shade share; high shades want light text. */
    level: number;
    stroke: boolean;
    label?: SceneLabel;
}

export interface SceneHeatmap {
    kind: 'heatmap';
    cells: SceneCell[];
    rows: { series: number; name: string; y: number; height: number }[];
    strokeWidth: number;
}

export interface SceneSlice {
    series: number;
    path: string;
    /** The wedge's path when it is pulled out or hovered. */
    hoverPath: string;
    selectedPath: string;
    color: string;
    value: number;
    percent: number;
    start: number;
    end: number;
    mid: number;
    label?: SceneLabel;
    /** Where the wedge moves when selected. */
    offset: Pt;
}

export interface ScenePie {
    kind: 'pie';
    cx: number;
    cy: number;
    inner: number;
    outer: number;
    slices: SceneSlice[];
    total: number;
    donut: boolean;
    background?: string;
    strokeWidth: number;
}

export interface SceneRadar {
    kind: 'radar';
    cx: number;
    cy: number;
    radius: number;
    grid: 'web' | 'polygon' | 'none';
    rings: { path: string; fill?: string }[];
    spokes: { x1: number; y1: number; x2: number; y2: number }[];
    axisLabels: SceneText[];
    tickLabels: SceneText[];
    polygons: { series: number; name: string; color: string; path: string; fill: SceneFill; width: number; markers: SceneMarker[]; labels: SceneLabel[] }[];
    strokeColor?: string;
    connectorColor?: string;
    strokeWidth: number;
}

export type SceneMarks = SceneLineSeries | SceneBarSeries | SceneCandleSeries | ScenePointSeries;

export interface SceneAnnotation {
    kind: 'xline' | 'yline' | 'xrange' | 'yrange' | 'point';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color?: string;
    fill?: string;
    opacity: number;
    dash: number;
    marker?: SceneMarker;
    label?: SceneText & { borderColor?: string; fill?: string };
}

export interface SceneColumn {
    /** Its index among the columns. */
    index: number;
    /** Pixel centre along the category axis. */
    pos: number;
    /** Half its width, for the crosshair band. */
    half: number;
    label: string;
    value: number | string;
    /** Inside the zoom window. */
    visible: boolean;
}

export interface ChartScene {
    type: ChartType;
    width: number;
    height: number;
    plot: { x: number; y: number; width: number; height: number };
    horizontal: boolean;
    title?: SceneText;
    subtitle?: SceneText;
    grid: {
        show: boolean;
        position: 'back' | 'front';
        color?: string;
        dash: number;
        /** Lines across the plot, at these pixels. */
        horizontal: number[];
        vertical: number[];
        bands: { x: number; y: number; width: number; height: number; color: string; opacity: number }[];
    };
    axes: SceneAxis[];
    marks: SceneMarks[];
    heatmap?: SceneHeatmap;
    pie?: ScenePie;
    radar?: SceneRadar;
    annotations: { back: SceneAnnotation[]; front: SceneAnnotation[] };
    /** Index-based charts: the categories (or shared x values) across the plot. */
    columns: SceneColumn[];
    /** Every data point, in series then index order. */
    data: SceneDatum[];
    /** Series that are drawn (not hidden), in order. */
    visibleSeries: number[];
    /** The x domain on show and in full, in domain units (index units for categories). */
    xDomain: { full: [number, number]; view: [number, number]; kind: 'category' | 'numeric' | 'datetime' };
    /** Maps a pixel along the category/x axis back to the domain. */
    xInvert: (pixel: number) => number;
    yDomains: [number, number][];
    yInvert: (pixel: number, axis?: number) => number;
    /** Nothing to draw. */
    empty: boolean;
    /** Formatters the tooltip and the summary share. */
    formatX: (value: number | string) => string;
    formatY: (value: number | null, seriesIndex: number, index: number) => string;
}

export interface SceneInput {
    type: ChartType;
    series: NormalizedSeries[];
    hidden: ReadonlySet<number>;
    options: ResolvedChartOptions;
    width: number;
    height: number;
    locale: Locale;
    /** The zoom window, in x domain units; y windows by axis. */
    window?: { x?: [number, number] | null; y?: [number, number] | null; /** Fit the y axis to what the x window shows (a brush's target). */ autoScaleY?: boolean };
    /** Measures text in pixels; a character-count estimate otherwise. */
    measure?: (text: string, fontSize: number) => number;
    /** Base font sizes in pixels, read from the theme. */
    fonts?: { label?: number; title?: number; subtitle?: number; dataLabel?: number };
    /** A pie slice pulled out. */
    selected?: ReadonlySet<string>;
}
