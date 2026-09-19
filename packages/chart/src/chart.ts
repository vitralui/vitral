import {
    anchorTo,
    en,
    formatMessage,
    isClient,
    loadStyle,
    overlayContainerOf,
    pushLayer,
    visuallyHidden,
    ZIndex,
    type ClassEntry,
    type Locale
} from '@vitral/core';
import { chartCsv, chartSummary, chartTable } from './engine/a11y';
import { buildChartScene } from './engine/build';
import { seriesColor } from './engine/common';
import { chartFormatter } from './engine/format';
import { brushChannel, chartBus, groupChannel, releaseInset, type ChartGroupMessage } from './engine/group';
import { chartKeyTarget, columnAt, datumAt, isFullWindow, normalizeWindow, panWindow, rectAt, zoomWindow } from './engine/interaction';
import { cellTypes, resolveChartOptions, type ResolvedChartOptions } from './engine/options';
import { sliceAt, spokeAt } from './engine/polar';
import type { ChartScene, SceneDatum } from './engine/scene';
import { normalizeSeries, type NormalizedSeries } from './engine/series';
import type { ChartOptions, ChartSeries, ChartSettings, ChartType } from './engine/types';
import { createOverlay } from '@vitral/controls';
import { mergeAttrs, partResolver, pointerDrag, type PassThrough as ChartPassThrough } from '@vitral/dom';
import { downloadChart, serializeSvg, svgToPng } from './dom/export';
import { createPortal, createRoot, h, s, type Child, type Props, type VElement } from '@vitral/dom';
import {
    hookChild,
    legendView,
    menuView,
    tableView,
    toolbarView,
    tooltipView,
    type ChartTooltipRenderContext,
    type DownloadKind,
    type DragMode,
    type HookResult,
    type LegendEntry,
    type LegendItemContext
} from './render/html';
import { annotationsView, axesView, gridView, heatmapView, marksView, pieView, pointKey, radarView, round, textAttrs, type PieCenter, type RenderState, type ViewContext } from './render/svg';
import { chartStyle } from './style';

// A chart drawn as SVG from the engine's scene, with no framework. The picture
// is an image named by a generated summary (its kind, series and ranges); the
// plot is also a focus stop where the arrow keys walk the data and a live
// region reads each point, and an optional hidden table carries the numbers.
// The legend is a row of toggle buttons, the toolbar a WAI-ARIA toolbar. A drag
// across the plot zooms (Shift pans), the wheel zooms only when enabled and with
// Ctrl, and a group or a brush keeps several charts on one crosshair and one
// window. Framework components wrap this: they hand it their props and turn
// its events into their own.

// ---- public types ------------------------------------------------------------------

export interface ChartPointEvent {
    seriesIndex: number;
    dataPointIndex: number;
    /** The category (or shared x value) index. */
    column: number;
    value: number | null;
    selected?: boolean;
}

export interface ChartEventMap {
    /** A data point was chosen by click, Enter or Space. */
    dataPointSelection: ChartPointEvent;
    dataPointMouseEnter: ChartPointEvent;
    dataPointMouseLeave: ChartPointEvent;
    /** A legend entry was pressed; `hidden` is the series' new state. */
    legendClick: { seriesIndex: number; seriesName: string; hidden: boolean };
    /** The x window changed; null when zoomed all the way out. */
    zoomed: { min: number; max: number } | null;
    /** A range was picked in selection mode (or on a brush). */
    selection: { min: number; max: number };
    /** Any click on the plot. */
    click: { seriesIndex: number; dataPointIndex: number; column: number; originalEvent: MouseEvent };
}

export type ChartEventName = keyof ChartEventMap;

export type { ChartTooltipRenderContext, HookResult, LegendItemContext };

/**
 * Optional renderers for the parts people most often replace, which is what a
 * framework maps its slots onto. Each returns text (never parsed as HTML), a
 * node, or nodes; nothing (null or undefined) keeps the built-in content. The
 * options object stays the primary way to configure a chart.
 */
export interface ChartHooks {
    /** Replaces the tooltip's content. */
    tooltip?: { render?: (context: ChartTooltipRenderContext) => HookResult };
    /** Replaces a legend entry's text. */
    legend?: { item?: (context: LegendItemContext) => HookResult };
    /** Shown instead of the chart when there is no data. */
    noData?: { render?: () => HookResult };
    /** Replaces a donut's centre text (drawn inside a `<foreignObject>`). */
    center?: { render?: (context: PieCenter) => HookResult };
}

export interface ChartConfig {
    /** The kind of chart; overrides `options.chart.type`. Defaults to `'line'`. */
    type?: ChartType;
    series?: ChartSeries;
    options?: ChartOptions;
    /** Overrides `options.chart.height`: pixels, or a CSS length. */
    height?: number | string;
    /** Overrides `options.chart.width`. */
    width?: number | string;
    /** The texts and number formats; English by default. */
    locale?: Locale;
    /** Drop the built-in classes and stylesheet; style through `pt` or `classes` instead. */
    unstyled?: boolean;
    /** Replacement classes per part (a string, or a function of the part's state). */
    classes?: Partial<Record<string, ClassEntry>>;
    /** Extra attributes per part: classes, styles, `aria-*`, `data-*`, listeners. */
    pt?: ChartPassThrough;
    hooks?: ChartHooks;
    /** Prefix of the ids the chart gives its elements; generated when unset. */
    id?: string;
    /** For a Content-Security-Policy: the nonce of the injected stylesheet. */
    nonce?: string;
    /** Wrap the injected stylesheet in this cascade layer. */
    cssLayer?: string | false;
    /** Where the download menu goes: an element, a selector, or a function; by default the nearest overlay host, else `<body>`. */
    overlayTarget?: HTMLElement | string | (() => HTMLElement | string | null | undefined);
    /** The base z-index of the download menu. Defaults to 1000. */
    zIndex?: number;
    /** Leave animations off. Defaults to the user's `prefers-reduced-motion`. */
    reducedMotion?: boolean;
}

/** What `update()` takes: any of the inputs, changed or not. */
export type ChartUpdate = Omit<ChartConfig, 'id' | 'nonce' | 'cssLayer' | 'reducedMotion'>;

export interface ChartHandle {
    /** Applies new inputs; unchanged ones (compared by value) cost nothing. */
    update(next: ChartUpdate): void;
    setLocale(locale: Locale): void;
    /** Measures the element (and the theme's font sizes) again and redraws. */
    resize(): void;
    /** Draws again, for inputs read through functions (hooks, pass-through) that changed. */
    refresh(): void;
    /** Zooms the x axis to `[min, max]`, in domain units. */
    zoomX(min: number, max: number): void;
    resetZoom(): void;
    toggleSeries(target: number | string): void;
    showSeries(target: number | string): void;
    hideSeries(target: number | string): void;
    /** The chart as a standalone SVG document, with its colours resolved. */
    exportSvg(): string;
    exportPng(scale?: number): Promise<Blob | null>;
    exportCsv(): string;
    /** Saves the chart as a file, as the toolbar's menu does. */
    download(kind: DownloadKind): Promise<void>;
    /** The laid-out scene: every mark and data point, in pixels. */
    scene(): ChartScene;
    on<K extends ChartEventName>(event: K, handler: (payload: ChartEventMap[K]) => void): () => void;
    off<K extends ChartEventName>(event: K, handler: (payload: ChartEventMap[K]) => void): void;
    /** Removes everything the chart added to the element, and every listener. */
    destroy(): void;
    readonly element: HTMLElement;
}

// ---- helpers -----------------------------------------------------------------------

function memo<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
    let last: A | undefined;
    let value: R;
    return (...args: A) => {
        if (!last || args.some((a, i) => !Object.is(a, last![i]))) {
            value = fn(...args);
            last = args;
        }
        return value;
    };
}

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

/** A copy of plain objects and arrays, to compare a later value against (functions and dates are kept). */
function snapshot<T>(value: T): T {
    if (Array.isArray(value)) return value.map(snapshot) as T;
    if (isPlain(value)) {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(value)) out[k] = snapshot(value[k]);
        return out as T;
    }
    return value;
}

function sameValue(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => sameValue(x, b[i]));
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (isPlain(a) && isPlain(b)) {
        const ka = Object.keys(a).filter((k) => a[k] !== undefined);
        const kb = Object.keys(b).filter((k) => b[k] !== undefined);
        return ka.length === kb.length && ka.every((k) => sameValue(a[k], b[k]));
    }
    return false;
}

const cssLength = (v: number | string | undefined, fallback: string) => (v === undefined ? fallback : typeof v === 'number' || /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v);
const sorted = (a: number, b: number): [number, number] => (a <= b ? [a, b] : [b, a]);
const withKey = (node: Child, key: string): Child => {
    if (node && typeof node === 'object' && !Array.isArray(node) && (node as VElement).kind === 'element') (node as VElement).key = key;
    return node;
};

let uid = 0;

interface Hover {
    column: number;
    series: number;
    index: number;
    x: number;
    y: number;
}

interface DragStart {
    x: number;
    y: number;
    kind: 'zoom' | 'pan' | 'selection' | 'brush-move' | 'brush-new';
    window: [number, number];
    brush: [number, number] | null;
}

type Tooltip = ChartTooltipRenderContext & { x: number; y: number };

// ---- the chart ---------------------------------------------------------------------

/**
 * Draws a chart into `element`, which becomes the chart's root (`.vt-chart`):
 * its own classes and styles are kept, and restored by `destroy()`.
 */
export function createChart(element: HTMLElement, config: ChartConfig = {}): ChartHandle {
    const cfg: ChartConfig = { ...config };
    let seriesSnapshot = snapshot(cfg.series);
    let optionsSnapshot = snapshot(cfg.options);
    let version = 0;
    const id = config.id ?? `vt-chart-${++uid}`;
    const helpId = `${id}-help`;
    const summaryId = `${id}-summary`;
    const menuId = `${id}-download`;
    const original = { class: element.getAttribute('class'), style: element.getAttribute('style') };
    const root = createRoot(element);
    const listeners = new Map<ChartEventName, Set<(payload: never) => void>>();
    let destroyed = false;

    function emit<K extends ChartEventName>(event: K, payload: ChartEventMap[K]) {
        listeners.get(event)?.forEach((fn) => (fn as (p: ChartEventMap[K]) => void)(payload));
    }

    const locale = () => cfg.locale ?? en;

    // ---- elements
    let canvasEl: HTMLElement | null = null;
    let svgEl: SVGSVGElement | null = null;
    let tooltipEl: HTMLElement | null = null;
    let triggerEl: HTMLButtonElement | null = null;
    let menuEl: HTMLElement | null = null;

    // ---- options, size, fonts
    let rootWidth = 0;
    let size = { width: 0, height: 0 };
    let fonts: { label?: number; title?: number; subtitle?: number; dataLabel?: number } = {};
    let fontFamily = 'sans-serif';

    // ---- state
    let hidden = new Set<number>();
    let hiddenSignature: string | undefined;
    let xWindow: [number, number] | null = null;
    let yWindow: [number, number] | null = null;
    let autoScaleY = false;
    let selected = new Set<string>();
    let hover: Hover | null = null;
    let pinned = false;
    let external = -1;
    let legendFocus = -1;
    let keyFocus: { series: number; column: number } | null = null;
    let readout = '';
    let mode: DragMode = 'zoom';
    let autoSelected: string | undefined | null = null;
    let modeSynced = false;
    let selectionRect: { x: number; y: number; width: number; height: number } | null = null;
    let brushWindow: [number, number] | null = null;
    let menuOpen = false;
    let tooltipSize = { width: 160, height: 60 };
    let lastHeightCss: string | undefined;
    const reducedMotion = cfg.reducedMotion ?? (isClient && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    // ---- derived values

    const optionsOf = memo((options: ChartOptions | undefined, type: ChartType, width: number, _v: number) => resolveChartOptions(options, type, width));
    const seriesOf = memo((series: ChartSeries | undefined, type: ChartType, labels: string[] | undefined, _v: number) => normalizeSeries(series, type, labels));
    const sceneOf = memo(
        (
            type: ChartType,
            series: NormalizedSeries[],
            hiddenSet: ReadonlySet<number>,
            options: ResolvedChartOptions,
            width: number,
            height: number,
            loc: Locale,
            x: [number, number] | null,
            y: [number, number] | null,
            autoY: boolean,
            fontSizes: typeof fonts,
            _family: string
        ) => buildChartScene({ type, series, hidden: hiddenSet, options, width, height, locale: loc, window: { x, y, autoScaleY: autoY }, measure, fonts: fontSizes })
    );

    function derive() {
        const type: ChartType = cfg.type ?? cfg.options?.chart?.type ?? 'line';
        const options = optionsOf(cfg.options, type, rootWidth || Infinity, version);
        const chart: ChartSettings = options.chart ?? {};
        const series = seriesOf(cfg.series, type, options.labels, version);
        const signature = series.map((x) => `${x.name}:${x.hidden}`).join('|');
        if (signature !== hiddenSignature) {
            hiddenSignature = signature;
            hidden = new Set(series.filter((x) => x.hidden).map((x) => x.index));
        }
        const pieLike = type === 'pie' || type === 'donut';
        const cartesian = !pieLike && type !== 'radar' && !cellTypes.has(type);
        const sparkline = !!chart.sparkline?.enabled;
        const isBrush = !!chart.brush?.enabled && !!chart.brush.target;
        const scene = sceneOf(type, series, hidden, options, size.width || 600, size.height || 260, locale(), isBrush ? null : xWindow, yWindow, autoScaleY, fonts, fontFamily);
        return {
            type,
            options,
            chart,
            series,
            scene,
            pieLike,
            cartesian,
            sparkline,
            isBrush,
            pointMode: type === 'scatter' || type === 'bubble',
            zoomEnabled: cartesian && chart.zoom?.enabled !== false && !sparkline,
            zoomType: chart.zoom?.type ?? 'x',
            zoomed: !!xWindow || !!yWindow,
            heightCss: cssLength(cfg.height ?? chart.height, '320px'),
            widthCss: cssLength(cfg.width ?? chart.width, '100%')
        };
    }

    const part = partResolver({
        style: chartStyle,
        unstyled: () => !!cfg.unstyled,
        classes: () => cfg.classes,
        pt: () => cfg.pt,
        props: () => ({ type: cfg.type, series: cfg.series, options: cfg.options })
    });

    // ---- measuring

    function measureSizes() {
        if (destroyed) return;
        const d = derive();
        rootWidth = element.clientWidth;
        const fallbackHeight = parseFloat(d.heightCss) || 320;
        const nextSize = { width: canvasEl?.clientWidth || element.clientWidth || 600, height: canvasEl?.clientHeight || Math.max(60, fallbackHeight - (d.sparkline ? 0 : 60)) };
        if (nextSize.width !== size.width || nextSize.height !== size.height) size = nextSize;
        if (!isClient) return;
        const style = getComputedStyle(element);
        const base = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const px = (name: string, fallback: number) => {
            const value = style.getPropertyValue(name).trim();
            const n = parseFloat(value);
            if (!value || Number.isNaN(n)) return fallback;
            return value.endsWith('rem') ? n * base : value.endsWith('em') ? n * (parseFloat(style.fontSize) || base) : n;
        };
        const next = { label: px('--vt-chart-axis-font-size', 12), title: px('--vt-chart-title-font-size', 15), subtitle: px('--vt-chart-subtitle-font-size', 12), dataLabel: px('--vt-chart-data-label-font-size', 11) };
        if (next.label !== fonts.label || next.title !== fonts.title || next.subtitle !== fonts.subtitle || next.dataLabel !== fonts.dataLabel) fonts = next;
        fontFamily = style.fontFamily || 'sans-serif';
    }

    // Text is measured on a canvas when there is one; a character estimate stands in otherwise.
    let context2d: CanvasRenderingContext2D | null | undefined;
    function measure(text: string, fontSize: number): number {
        if (context2d === undefined) {
            context2d = null;
            if (isClient && !/jsdom/i.test(navigator.userAgent)) context2d = document.createElement('canvas').getContext('2d');
        }
        if (!context2d) return text.length * fontSize * 0.58;
        context2d.font = `${fontSize}px ${fontFamily}`;
        return context2d.measureText(text).width;
    }

    // ---- scheduling

    let queued = false;
    function schedule() {
        if (queued || destroyed) return;
        queued = true;
        queueMicrotask(() => {
            if (queued) render();
        });
    }

    function announce(text: string) {
        readout = '';
        render();
        Promise.resolve().then(() => {
            readout = text;
            schedule();
        });
    }

    // ---- series and legend

    const seriesName = (index: number) => derive().series[index]?.name || String(index + 1);

    function toggleSeries(index: number) {
        const d = derive();
        if (index < 0 || index >= d.series.length) return;
        const next = new Set(hidden);
        const hide = !next.has(index);
        if (hide) next.add(index);
        else next.delete(index);
        // Never hide the last series: an empty chart explains nothing.
        if (next.size >= d.series.length) return;
        hidden = next;
        emit('legendClick', { seriesIndex: index, seriesName: seriesName(index), hidden: hide });
        announce(formatMessage(hide ? locale().chart.seriesHidden : locale().chart.seriesShown, { series: seriesName(index) }));
    }

    function onLegendHighlight(index: number) {
        const next = derive().options.legend?.onItemHover?.highlightDataSeries === false ? -1 : index;
        if (next === legendFocus) return;
        legendFocus = next;
        schedule();
    }

    const findSeries = (target: number | string) => (typeof target === 'number' ? target : derive().series.findIndex((x) => x.name === target));

    // ---- windows: zoom, pan, brush, group

    function setWindow(window: [number, number] | null, opts: { publish?: boolean; silent?: boolean } = {}) {
        const d = derive();
        const full = d.scene.xDomain.full;
        const next = window ? normalizeWindow(window, full, 0.005) : null;
        const value = next && !isFullWindow(next, full) ? next : null;
        const same = value?.[0] === xWindow?.[0] && value?.[1] === xWindow?.[1];
        xWindow = value;
        if (!value) yWindow = null;
        schedule();
        if (same) return;
        emit('zoomed', value ? { min: value[0], max: value[1] } : null);
        if (!opts.silent && value) {
            // Categories are named by the first and last one on show; other axes by the window's ends.
            const sc = derive().scene;
            const shown = sc.xDomain.kind === 'category' ? sc.columns.filter((c) => c.visible) : [];
            const from = shown.length ? shown[0]!.label : sc.formatX(value[0]);
            const to = shown.length ? shown[shown.length - 1]!.label : sc.formatX(value[1]);
            announce(formatMessage(locale().chart.zoomed, { from, to }));
        }
        if (opts.publish === false) return;
        const chart = d.chart;
        const source = chart.id ?? id;
        if (chart.group) chartBus.publish(groupChannel(chart.group), { kind: 'window', source, window: value });
        if (chart.id) {
            chartBus.lastWindow.set(brushChannel(chart.id), value);
            chartBus.publish(brushChannel(chart.id), { kind: 'window', source: chart.id, window: value });
        }
    }

    function zoomBy(factor: number, anchor?: number) {
        const full = derive().scene.xDomain.full;
        setWindow(zoomWindow(xWindow ?? full, full, factor, anchor));
    }

    const resetZoom = () => setWindow(null);

    function setBrush(window: [number, number] | null, publish = true) {
        const d = derive();
        const full = d.scene.xDomain.full;
        const next = window ? normalizeWindow(window, full, 0.005) : null;
        brushWindow = next;
        schedule();
        if (!publish || !d.chart.brush?.target) return;
        const channel = brushChannel(d.chart.brush.target);
        const value = next && !isFullWindow(next, full) ? next : null;
        chartBus.lastWindow.set(channel, value);
        chartBus.publish(channel, { kind: 'window', source: `brush:${id}`, window: value, autoScaleY: d.chart.brush.autoScaleYaxis !== false });
        if (next) emit('selection', { min: next[0], max: next[1] });
    }

    const subscriptions: (() => void)[] = [];
    let subscriptionKey: string | undefined;
    function subscribe(chart: ChartSettings, isBrush: boolean) {
        const key = `${chart.group}|${chart.id}|${chart.brush?.target}`;
        if (key === subscriptionKey) return;
        subscriptionKey = key;
        subscriptions.splice(0).forEach((off) => off());
        const source = chart.id ?? id;
        if (chart.group) {
            subscriptions.push(
                chartBus.subscribe(groupChannel(chart.group), (m: ChartGroupMessage) => {
                    if (m.source === source) return;
                    if (m.kind === 'hover') external = m.column;
                    else if (m.kind === 'leave') external = -1;
                    else if (m.kind === 'window') setWindow(m.window, { publish: false, silent: true });
                    schedule();
                })
            );
        }
        if (chart.id && !isBrush) {
            const channel = brushChannel(chart.id);
            const own = chart.id;
            subscriptions.push(
                chartBus.subscribe(channel, (m) => {
                    if (m.kind !== 'window' || m.source === own) return;
                    autoScaleY = !!m.autoScaleY;
                    setWindow(m.window, { publish: false, silent: true });
                })
            );
            const last = chartBus.lastWindow.get(channel);
            if (last) Promise.resolve().then(() => !destroyed && setWindow(last, { publish: false, silent: true }));
        }
        if (isBrush && chart.brush?.target) {
            const target = chart.brush.target;
            subscriptions.push(
                chartBus.subscribe(brushChannel(target), (m) => {
                    if (m.kind === 'window' && m.source === target) setBrush(m.window, false);
                })
            );
            const initial = chart.selection?.xaxis;
            Promise.resolve().then(() => {
                if (destroyed) return;
                if (initial && (initial.min !== undefined || initial.max !== undefined)) {
                    const full = derive().scene.xDomain.full;
                    setBrush([initial.min ?? full[0], initial.max ?? full[1]]);
                }
            });
        }
    }

    /** A domain value on the x axis as a pixel. */
    function toPixel(sc: ChartScene, value: number): number {
        const [a, b] = sc.xDomain.view;
        const span = b - a || 1;
        return sc.plot.x + ((value - a) / span) * sc.plot.width;
    }

    // ---- pointer

    function local(event: { clientX: number; clientY: number }) {
        const rect = svgEl?.getBoundingClientRect();
        return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
    }

    function hitTest(x: number, y: number): Hover | null {
        const d = derive();
        const sc = d.scene;
        if (sc.empty) return null;
        if (sc.pie) {
            const slice = sc.pie.slices[sliceAt(sc.pie, x, y)];
            return slice ? { column: -1, series: slice.series, index: 0, x, y } : null;
        }
        if (sc.radar) {
            const i = spokeAt(sc.radar, sc.columns.length, x, y);
            return i >= 0 ? { column: i, series: -1, index: i, x, y } : null;
        }
        if (sc.heatmap) {
            const r = rectAt(sc, x, y);
            return r ? { column: r.column, series: r.series, index: r.index, x, y } : null;
        }
        if (d.pointMode || d.options.tooltip?.intersect || !d.options.tooltip?.shared) {
            const datum = datumAt(sc, x, y, 12);
            const r = datum ? null : rectAt(sc, x, y);
            if (datum) return { column: datum.column, series: datum.series, index: datum.index, x, y };
            if (r) return { column: r.column, series: r.series, index: r.index, x, y };
            return null;
        }
        const column = columnAt(sc, x, y);
        if (column < 0) return null;
        const bar = rectAt(sc, x, y);
        return { column, series: bar?.series ?? -1, index: bar?.index ?? column, x, y };
    }

    const valueOf = (seriesIndex: number, column: number) => {
        const d = derive();
        return d.scene.data.find((x) => x.series === seriesIndex && (d.pieLike || x.column === column))?.value ?? null;
    };

    function setHover(next: Hover | null) {
        const prev = hover;
        if (prev && (!next || prev.series !== next.series || prev.index !== next.index) && prev.series >= 0) {
            emit('dataPointMouseLeave', { seriesIndex: prev.series, dataPointIndex: prev.index, column: prev.column, value: valueOf(prev.series, prev.column) });
        }
        if (next && next.series >= 0 && (!prev || prev.series !== next.series || prev.index !== next.index)) {
            emit('dataPointMouseEnter', { seriesIndex: next.series, dataPointIndex: next.index, column: next.column, value: valueOf(next.series, next.column) });
        }
        hover = next;
        schedule();
        const chart = derive().chart;
        if (chart.group && prev?.column !== next?.column) {
            const source = chart.id ?? id;
            chartBus.publish(groupChannel(chart.group), next && next.column >= 0 ? { kind: 'hover', source, column: next.column } : { kind: 'leave', source });
        }
    }

    function onPointermove(event: PointerEvent) {
        if (drag.active() || pinned) return;
        const trigger = derive().options.tooltip?.trigger;
        if (trigger === 'click' && event.pointerType !== 'mouse') return;
        const { x, y } = local(event);
        const next = hitTest(x, y);
        if (trigger === 'click' && !pinned) {
            // Click-triggered: the pointer only highlights; the panel waits for a click.
            hover = next ? { ...next } : null;
            schedule();
            return;
        }
        setHover(next);
    }

    function onPointerleave() {
        if (pinned || drag.active()) return;
        setHover(null);
    }

    function onClick(event: MouseEvent) {
        const { x, y } = local(event);
        const hit = hitTest(x, y);
        if (derive().options.tooltip?.trigger === 'click') {
            pinned = !!hit;
            setHover(hit);
        }
        emit('click', { seriesIndex: hit?.series ?? -1, dataPointIndex: hit?.index ?? -1, column: hit?.column ?? -1, originalEvent: event });
        if (hit && hit.series >= 0) selectPoint(hit.series, hit.index, hit.column);
    }

    function selectPoint(seriesIndex: number, index: number, column: number) {
        const d = derive();
        const k = pointKey(seriesIndex, index);
        const selectable = d.pieLike ? d.options.plotOptions?.pie?.expandOnClick !== false : true;
        let isSelected = false;
        if (selectable) {
            const next = d.options.states?.active?.allowMultipleDataPointsSelection ? new Set(selected) : new Set<string>(selected.has(k) ? [k] : []);
            if (next.has(k)) next.delete(k);
            else {
                next.add(k);
                isSelected = true;
            }
            selected = next;
            schedule();
        }
        emit('dataPointSelection', { seriesIndex, dataPointIndex: index, column, value: valueOf(seriesIndex, column), selected: isSelected });
    }

    const drag = pointerDrag<DragStart>({
        threshold: 4,
        onActive: () => schedule(),
        onStart: (start) => {
            setHover(null);
            pinned = false;
            const d = derive();
            return start.kind !== 'pan' || d.zoomEnabled || d.isBrush;
        },
        onMove: (start, info) => {
            const d = derive();
            const sc = d.scene;
            const { plot } = sc;
            const current = local(info.event);
            const clampX = (v: number) => Math.max(plot.x, Math.min(plot.x + plot.width, v));
            const clampY = (v: number) => Math.max(plot.y, Math.min(plot.y + plot.height, v));
            if (start.kind === 'pan') {
                const delta = sc.xInvert(start.x) - sc.xInvert(current.x);
                const full = sc.xDomain.full;
                const w = panWindow(start.window, full, delta);
                xWindow = isFullWindow(w, full) ? null : w;
                schedule();
                return;
            }
            if (start.kind === 'brush-move' && start.brush) {
                const span = start.window[1] - start.window[0];
                const perPixel = span / plot.width;
                setBrush(panWindow(start.brush, sc.xDomain.full, (current.x - start.x) * perPixel));
                return;
            }
            const horizontal = sc.horizontal;
            const xy = d.zoomType === 'xy' || d.zoomType === 'y';
            const onlyY = d.zoomType === 'y' && start.kind === 'zoom';
            const x0 = clampX(start.x);
            const x1 = clampX(current.x);
            const y0 = xy ? clampY(start.y) : plot.y;
            const y1 = xy ? clampY(current.y) : plot.y + plot.height;
            const rect = {
                x: onlyY || (horizontal && start.kind === 'zoom') ? plot.x : Math.min(x0, x1),
                width: onlyY || (horizontal && start.kind === 'zoom') ? plot.width : Math.abs(x1 - x0),
                y: horizontal ? Math.min(clampY(start.y), clampY(current.y)) : Math.min(y0, y1),
                height: horizontal ? Math.abs(clampY(current.y) - clampY(start.y)) : Math.abs(y1 - y0)
            };
            selectionRect = rect;
            schedule();
            if (start.kind === 'brush-new') setBrush(sorted(sc.xInvert(rect.x), sc.xInvert(rect.x + rect.width)));
        },
        onEnd: (start) => {
            const rect = selectionRect;
            selectionRect = null;
            schedule();
            const d = derive();
            const sc = d.scene;
            if (start.kind === 'pan') {
                // The drag moved the window as it went; report the whole move once,
                // so listeners and the group hear of it.
                const moved = xWindow;
                xWindow = isFullWindow(start.window, sc.xDomain.full) ? null : start.window;
                setWindow(moved);
                return;
            }
            if (!rect || start.kind === 'brush-move' || start.kind === 'brush-new') return;
            const along = sc.horizontal ? [rect.y, rect.y + rect.height] : [rect.x, rect.x + rect.width];
            if (Math.abs(along[1]! - along[0]!) < 4 && d.zoomType === 'x') return;
            const xw = sorted(sc.xInvert(along[0]!), sc.xInvert(along[1]!));
            if (start.kind === 'selection') {
                emit('selection', { min: xw[0], max: xw[1] });
                return;
            }
            if (d.zoomType !== 'x' && !sc.horizontal) {
                const yw = sorted(sc.yInvert(rect.y + rect.height), sc.yInvert(rect.y));
                if (rect.height > 4) yWindow = yw;
            }
            if (d.zoomType !== 'y') setWindow(xw);
            else if (yWindow) emit('zoomed', { min: xWindow?.[0] ?? sc.xDomain.full[0], max: xWindow?.[1] ?? sc.xDomain.full[1] });
        },
        onCancel: () => {
            selectionRect = null;
            schedule();
        }
    });

    function onPointerdown(event: PointerEvent) {
        const d = derive();
        const sc = d.scene;
        if (sc.empty || !d.cartesian) return;
        const { x, y } = local(event);
        const { plot } = sc;
        const inside = x >= plot.x && x <= plot.x + plot.width && y >= plot.y && y <= plot.y + plot.height;
        if (!inside) return;
        const full = sc.xDomain.full;
        if (d.isBrush) {
            const w = brushWindow;
            const within = w && x >= toPixel(sc, w[0]) && x <= toPixel(sc, w[1]);
            drag.press(event, { x, y, kind: within ? 'brush-move' : 'brush-new', window: [...sc.xDomain.view] as [number, number], brush: w });
            return;
        }
        const panKey = d.chart.pan?.enabled !== false && (d.chart.pan?.modifier === 'none' ? false : event.shiftKey);
        const kind = panKey ? 'pan' : mode;
        if (kind === 'zoom' && !d.zoomEnabled) return;
        if (kind === 'pan' && (!d.zoomEnabled || !xWindow)) return;
        drag.press(event, { x, y, kind, window: xWindow ?? full, brush: null });
    }

    function onWheel(event: WheelEvent) {
        const d = derive();
        const zoom = d.chart.zoom;
        if (!d.zoomEnabled || !zoom?.allowMouseWheelZoom) return;
        if (zoom.wheelModifier !== 'none' && !event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        const { x, y } = local(event);
        const sc = d.scene;
        zoomBy(event.deltaY > 0 ? 1.25 : 0.8, sc.xInvert(sc.horizontal ? y : x));
    }

    // ---- keyboard

    function focusDatumOf(sc: ChartScene): SceneDatum | null {
        const f = keyFocus;
        if (!f) return null;
        return sc.data.find((x) => x.series === f.series && x.column === f.column) ?? null;
    }

    function onKeydown(event: KeyboardEvent) {
        const d = derive();
        const sc = d.scene;
        const keyboard = d.chart.accessibility?.keyboard !== false && !sc.empty;
        if (!keyboard) return;
        const key = event.key;
        if ((key === '+' || key === '=') && d.zoomEnabled) return (event.preventDefault(), zoomBy(0.5));
        if (key === '-' && d.zoomEnabled && d.zoomed) return (event.preventDefault(), zoomBy(2));
        if (key === '0' && d.zoomed) return (event.preventDefault(), resetZoom());
        if (key === 'Escape') {
            if (!keyFocus) return;
            event.preventDefault();
            keyFocus = null;
            schedule();
            return;
        }
        const current = keyFocus;
        if ((key === 'Enter' || key === ' ') && current) {
            event.preventDefault();
            const datum = focusDatumOf(sc);
            if (datum) selectPoint(datum.series, datum.index, datum.column);
            return;
        }
        let target: { series: number; column: number } | null;
        if (d.pieLike) {
            const order = sc.visibleSeries;
            const at = current ? order.indexOf(current.series) : -1;
            const step = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 0;
            if (key === 'Home') target = { series: order[0]!, column: 0 };
            else if (key === 'End') target = { series: order[order.length - 1]!, column: order.length - 1 };
            else if (step) {
                const next = at < 0 ? 0 : (at + step + order.length) % order.length;
                target = { series: order[next]!, column: next };
            } else target = null;
            if (target) target.column = sc.data.find((x) => x.series === target!.series)?.column ?? 0;
        } else {
            const rtl = getComputedStyle(element).direction === 'rtl';
            const mapped = rtl && (key === 'ArrowLeft' || key === 'ArrowRight') ? (key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft') : key;
            target = chartKeyTarget(current ?? { series: sc.visibleSeries[0] ?? 0, column: -1 }, mapped, sc);
        }
        if (!target) return;
        event.preventDefault();
        keyFocus = target;
        schedule();
        const datum = sc.data.find((x) => x.series === target!.series && x.column === target!.column);
        if (!datum) return;
        // Follow the point into view when zoomed.
        const col = sc.columns[datum.column];
        if (col && !col.visible && xWindow) {
            const span = xWindow[1] - xWindow[0];
            const value = typeof col.value === 'number' && sc.xDomain.kind !== 'category' ? col.value : datum.column;
            setWindow([value - span / 2, value + span / 2], { silent: true });
        }
        const points = sc.data.filter((x) => x.series === datum.series && x.value !== null);
        announce(
            formatMessage(locale().chart.readout, {
                series: seriesName(datum.series),
                label: datum.label,
                value: [datum.text, ...(datum.extra ?? []).map((e) => `${e.name} ${e.text}`)].join(', '),
                position: points.indexOf(datum) + 1,
                count: points.length
            })
        );
        if (d.chart.group) chartBus.publish(groupChannel(d.chart.group), { kind: 'hover', source: d.chart.id ?? id, column: datum.column });
    }

    function onBlur() {
        const chart = derive().chart;
        if (keyFocus && chart.group) chartBus.publish(groupChannel(chart.group), { kind: 'leave', source: chart.id ?? id });
        keyFocus = null;
        schedule();
    }

    // ---- toolbar and its menu

    // Panning moves a zoomed window; with the whole range on show there is
    // nothing to move, so the pan tool waits for a zoom and gives way after a reset.
    function setMode(next: DragMode) {
        if (next === 'pan' && !derive().zoomed) return;
        mode = next;
        schedule();
    }

    const menuItems = () => [...(menuEl?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

    function openMenu(focusLast = false) {
        menuOpen = true;
        render();
        menu.open();
        const items = menuItems();
        items[focusLast ? items.length - 1 : 0]?.focus();
    }

    function closeMenu(refocus: boolean) {
        if (!menuOpen) return;
        menuOpen = false;
        menu.close(refocus ? 'escape' : 'request');
        render();
        if (refocus) triggerEl?.focus();
    }

    function onTriggerKeydown(event: KeyboardEvent) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu(event.key === 'ArrowUp');
        }
    }

    function onMenuKeydown(event: KeyboardEvent) {
        const items = menuItems();
        const at = items.indexOf(document.activeElement as HTMLElement);
        let next = -1;
        if (event.key === 'ArrowDown') next = (at + 1) % items.length;
        else if (event.key === 'ArrowUp') next = (at - 1 + items.length) % items.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else if (event.key === 'Tab') closeMenu(false);
        if (next >= 0) {
            event.preventDefault();
            items[next]?.focus();
        }
    }

    /**
     * The download menu hangs from the toolbar's button. What it holds is the
     * chart's own; where it goes, what closes it and what it sits over is
     * `@vitral/controls`' overlay, which every addon shares.
     */
    const menu = createOverlay({
        anchor: () => triggerEl,
        render: () =>
            menuView(part, {
                id: menuId,
                locale: locale(),
                ref: (e) => (menuEl = e as HTMLElement),
                onKeydown: onMenuKeydown,
                onChoose: (kind) => {
                    closeMenu(true);
                    void download(kind);
                }
            }) as VElement,
        placement: 'bottom-end',
        target: () => cfg.overlayTarget,
        zIndex: cfg.zIndex,
        onClose: () => {
            menuOpen = false;
            menuEl = null;
            render();
        }
    });

    // ---- downloads

    function background() {
        return getComputedStyle(element).getPropertyValue('--vt-content-background').trim() || undefined;
    }

    function download(kind: DownloadKind): Promise<void> {
        const d = derive();
        const exp = d.chart.toolbar?.export;
        return downloadChart(kind, {
            svg: svgEl,
            filename: exp?.filename ?? 'chart',
            series: d.series,
            categories: d.options.xaxis?.categories ?? d.options.labels,
            headerCategory: exp?.csv?.headerCategory,
            background: background()
        }).catch(() => undefined);
    }

    // ---- rendering

    function tooltipOf(d: ReturnType<typeof derive>, focusDatum: SceneDatum | null): Tooltip | null {
        const { options, scene: sc, series } = d;
        if (options.tooltip?.enabled === false || sc.empty) return null;
        const shared = !!options.tooltip?.shared && !options.tooltip?.intersect && !d.pointMode && !d.pieLike && !cellTypes.has(d.type);
        const rowTitle = chartFormatter(options.tooltip?.y?.title?.formatter, '{series}', locale());
        const rowOf = (datum: SceneDatum) => {
            const s0 = series[datum.series];
            const name = d.pieLike ? seriesName(datum.series) : s0?.name ? rowTitle(s0.name, { seriesName: s0.name }) : '';
            return { name, value: datum.text, color: datum.color, seriesIndex: datum.series, extra: datum.extra };
        };
        const f = focusDatum;
        const hv = hover;
        const column = f?.column ?? hv?.column ?? external;
        if (column < 0 && !f && !hv) return null;
        const showX = options.tooltip?.x?.show !== false;
        if (shared && column >= 0) {
            const inColumn = sc.data.filter((x) => x.column === column && x.value !== null);
            const rows = inColumn.map(rowOf);
            if (!rows.length) return null;
            const col = sc.columns[column];
            const y = f?.y ?? hv?.y ?? inColumn.reduce((sum, x) => sum + x.y, 0) / inColumn.length;
            const x = f?.x ?? (options.tooltip?.followCursor && hv ? hv.x : sc.horizontal ? (hv?.x ?? inColumn[0]!.x) : (col?.pos ?? 0));
            const yy = sc.horizontal ? (col?.pos ?? y) : y;
            return { title: showX ? (col?.label ?? '') : '', rows, seriesIndex: f?.series ?? hv?.series ?? -1, dataPointIndex: f?.column ?? hv?.index ?? column, column, x, y: yy };
        }
        const seriesIndex = f?.series ?? hv?.series ?? -1;
        const datum = f ?? (hv ? sc.data.find((x) => x.series === hv.series && (d.pieLike ? true : x.column === hv.column) && x.value !== null) : null);
        if (!datum || seriesIndex < 0) return null;
        const title = d.pieLike ? '' : showX ? datum.label : '';
        return { title, rows: [rowOf(datum)], seriesIndex: datum.series, dataPointIndex: datum.index, column: datum.column, x: hv && !f ? hv.x : datum.x, y: hv && !f ? hv.y : datum.y };
    }

    function render() {
        queued = false;
        if (destroyed) return;
        const d = derive();
        const { options, chart, scene: sc, series } = d;
        const loc = locale();

        // What used to be watchers: the drag mode follows `toolbar.autoSelected`
        // and gives way to zooming when there is nothing to pan; the bus follows
        // the group, id and brush target.
        if (!modeSynced || chart.toolbar?.autoSelected !== autoSelected) {
            modeSynced = true;
            autoSelected = chart.toolbar?.autoSelected;
            mode = chart.selection?.enabled ? 'selection' : (chart.toolbar?.autoSelected ?? 'zoom');
        }
        if (!d.zoomed && mode === 'pan') mode = 'zoom';
        subscribe(chart, d.isBrush);

        if (!cfg.unstyled) loadStyle(chartStyle.name, chartStyle.css, { nonce: cfg.nonce, cssLayer: cfg.cssLayer });

        const focusDatum = focusDatumOf(sc);
        const animated = chart.animations?.enabled !== false && !reducedMotion;
        const state: RenderState = {
            column: focusDatum?.column ?? hover?.column ?? external,
            focusSeries: legendFocus >= 0 ? legendFocus : d.pieLike && focusDatum ? focusDatum.series : -1,
            hoverSeries: focusDatum?.series ?? hover?.series ?? -1,
            hoverIndex: focusDatum?.index ?? hover?.index ?? -1,
            selected,
            animated
        };
        const ctx: ViewContext = { part, id, scene: sc, state };

        // Text alternatives.
        const title = options.title?.text ?? '';
        const summary = chart.accessibility?.description ?? (sc.empty ? `${title ? `${title}. ` : ''}${loc.chart.noData}` : chartSummary(sc, series, d.type, loc, title || undefined));
        const table = chart.accessibility?.dataTable ? chartTable(sc, series, loc) : null;
        const keyboard = chart.accessibility?.keyboard !== false && !sc.empty;

        // Legend.
        const legend = options.legend;
        const showLegend = !!legend?.show && !d.sparkline && d.type !== 'heatmap' && series.some((x) => x.name) && (series.length > 1 || !!legend.showForSingleSeries || d.pieLike);
        const legendPosition = legend?.position ?? 'bottom';
        const legendFormat = chartFormatter(legend?.formatter, '{series}', loc);
        const entries: LegendEntry[] = showLegend
            ? series.map((x) => ({ series: x.index, name: legendFormat(x.name, { seriesName: x.name, seriesIndex: x.index }), color: seriesColor(options, x, x.index, series.length), hidden: hidden.has(x.index) }))
            : [];
        const legendNode = (key: string) =>
            legendView(
                part,
                {
                    entries,
                    position: legendPosition,
                    align: legend?.horizontalAlign,
                    interactive: legend?.onItemClick?.toggleDataSeries !== false,
                    focus: legendFocus,
                    shape: legend?.markers?.shape,
                    locale: loc,
                    item: cfg.hooks?.legend?.item,
                    onToggle: toggleSeries,
                    onHighlight: onLegendHighlight
                },
                key
            );

        // Tooltip.
        const tooltip = tooltipOf(d, focusDatum);
        const customTooltip = typeof options.tooltip?.custom === 'string' ? options.tooltip.custom : undefined;

        // Crosshair.
        let crosshair: { band?: Props; line?: Props; front: boolean } | null = null;
        const cross = options.xaxis?.crosshairs;
        const col = sc.columns[state.column];
        if (d.cartesian && cross?.show !== false && !d.pointMode && col && col.visible) {
            const band = cross?.width === 'barWidth';
            const { plot } = sc;
            const lineStyle = { stroke: cross?.stroke?.color, strokeWidth: cross?.stroke?.width, strokeDasharray: cross?.stroke?.dashArray === undefined ? undefined : String(cross.stroke.dashArray) };
            const front = cross?.position === 'front';
            if (sc.horizontal)
                crosshair = band
                    ? { band: { x: plot.x, y: col.pos - col.half, width: plot.width, height: col.half * 2 }, front }
                    : { line: { x1: round(plot.x), x2: round(plot.x + plot.width), y1: round(col.pos), y2: round(col.pos), style: lineStyle }, front };
            else
                crosshair = band
                    ? { band: { x: col.pos - col.half, y: plot.y, width: col.half * 2, height: plot.height }, front }
                    : { line: { x1: round(col.pos), x2: round(col.pos), y1: round(plot.y), y2: round(plot.y + plot.height), style: lineStyle }, front };
        }
        const crosshairNodes = (key: string): Child =>
            crosshair
                ? [
                      crosshair.band ? s('rect', { key: `${key}-band`, ...part('crosshairBand'), ...crosshair.band }) : null,
                      crosshair.line ? s('line', mergeAttrs({ key: `${key}-line` }, part('crosshair'), crosshair.line)) : null
                  ]
                : null;

        // Brush.
        const selectionStyle = { fill: chart.selection?.fill?.color, fillOpacity: chart.selection?.fill?.opacity, stroke: chart.selection?.stroke?.color };
        let brushNode: Child = null;
        if (d.isBrush && brushWindow) {
            const { plot } = sc;
            const x0 = Math.max(plot.x, toPixel(sc, brushWindow[0]));
            const x1 = Math.min(plot.x + plot.width, toPixel(sc, brushWindow[1]));
            brushNode = s(
                'g',
                { key: 'brush', 'aria-hidden': 'true' },
                s('rect', { ...part('brushShade'), x: round(plot.x), y: round(plot.y), width: round(Math.max(0, x0 - plot.x)), height: round(plot.height) }),
                s('rect', { ...part('brushShade'), x: round(x1), y: round(plot.y), width: round(Math.max(0, plot.x + plot.width - x1)), height: round(plot.height) }),
                s('rect', mergeAttrs(part('selection'), { x: round(x0), y: round(plot.y), width: round(Math.max(0, x1 - x0)), height: round(plot.height), style: selectionStyle }))
            );
        }

        // Donut centre.
        let center: PieCenter | null = null;
        if (sc.pie?.tracks) {
            // A gauge reads its own value in the middle; there is no total to
            // show, since the rings are shares of their own maximums.
            const slice = sc.pie.slices.find((x) => x.series === state.hoverSeries) ?? sc.pie.slices[0];
            if (slice && options.dataLabels?.enabled !== false)
                center = { name: seriesName(slice.series), value: chartFormatter(options.dataLabels?.formatter, '{percent|percent:0}', loc)(slice.value, { percent: slice.percent, seriesName: seriesName(slice.series) }), total: '' };
        } else if (sc.pie && options.plotOptions?.pie?.donut?.labels?.show !== false) {
            const labels = options.plotOptions?.pie?.donut?.labels;
            const slice = sc.pie.slices.find((x) => x.series === state.hoverSeries);
            const total = chartFormatter(labels?.total?.formatter, '{value}', loc)(sc.pie.total);
            if (slice && !labels?.total?.showAlways) center = { name: seriesName(slice.series), value: chartFormatter(labels?.value?.formatter, '{value}', loc)(slice.value, { percent: slice.percent }), total };
            else if (labels?.total?.show !== false) center = { name: labels?.total?.label ?? loc.chart.total, value: total, total };
        }
        let customCenter: Child | undefined;
        if (sc.pie && center && cfg.hooks?.center?.render) {
            const result = cfg.hooks.center.render(center);
            if (result !== null && result !== undefined) {
                const inner = sc.pie.inner;
                customCenter = s(
                    'foreignObject',
                    { x: round(sc.pie.cx - inner), y: round(sc.pie.cy - inner), width: round(inner * 2), height: round(inner * 2) },
                    typeof result === 'string' ? h('div', null, result) : hookChild(result)
                );
            }
        }

        const showToolbar = !d.sparkline && !d.isBrush && chart.toolbar?.show !== false && !sc.empty;
        if (!showToolbar && menuOpen) menuOpen = false;
        const dragging = drag.active();

        let plotNodes: Child;
        if (sc.heatmap) plotNodes = heatmapView(ctx);
        else if (sc.pie) plotNodes = pieView(ctx, center, customCenter);
        else if (sc.radar) plotNodes = radarView(ctx);
        else plotNodes = marksView(ctx);

        const svg = s(
            'svg',
            mergeAttrs({ key: 'svg', role: 'img', 'aria-labelledby': summaryId }, part('svg'), {
                viewBox: `0 0 ${round(sc.width)} ${round(sc.height)}`,
                width: round(sc.width),
                height: round(sc.height),
                preserveAspectRatio: 'none',
                ref: (el: Element) => {
                    if (svgEl !== el) {
                        svgEl?.removeEventListener('wheel', onWheel);
                        svgEl = el as SVGSVGElement;
                        svgEl.addEventListener('wheel', onWheel, { passive: false });
                    }
                },
                onPointermove,
                onPointerleave,
                onPointerdown,
                onClick
            }),
            s('title', { key: 'title', id: summaryId }, summary),
            s(
                'defs',
                { key: 'defs' },
                s('clipPath', { id: `${id}-clip` }, s('rect', { x: round(sc.plot.x - 6), y: round(sc.plot.y - 6), width: round(sc.plot.width + 12), height: round(sc.plot.height + 12) }))
            ),
            sc.title ? s('text', { key: 'chart-title', ...part('title'), ...textAttrs(sc.title) }, sc.title.text) : null,
            sc.subtitle ? s('text', { key: 'chart-subtitle', ...part('subtitle'), ...textAttrs(sc.subtitle) }, sc.subtitle.text) : null,
            sc.empty
                ? null
                : [
                      sc.grid.position !== 'front' ? withKey(gridView(ctx), 'grid-back') : null,
                      crosshair && !crosshair.front ? crosshairNodes('cross-back') : null,
                      withKey(annotationsView(ctx, 'back'), 'annotations-back'),
                      plotNodes,
                      withKey(axesView(ctx), 'axes'),
                      sc.grid.position === 'front' ? withKey(gridView(ctx), 'grid-front') : null,
                      withKey(annotationsView(ctx, 'front'), 'annotations-front'),
                      crosshair && crosshair.front ? crosshairNodes('cross-front') : null,
                      brushNode,
                      selectionRect
                          ? s(
                                'rect',
                                mergeAttrs({ key: 'selection' }, part('selection'), {
                                    x: round(selectionRect.x),
                                    y: round(selectionRect.y),
                                    width: round(selectionRect.width),
                                    height: round(selectionRect.height),
                                    style: selectionStyle
                                })
                            )
                          : null,
                      focusDatum
                          ? s('circle', { key: 'focus', ...part('focusRing'), cx: round(focusDatum.x), cy: round(focusDatum.y), r: round(Math.min(Math.max(focusDatum.r ?? 8, 8), 40)) })
                          : null
                  ]
        );

        let noData: Child = null;
        if (sc.empty) {
            const custom = cfg.hooks?.noData?.render?.();
            noData = h(
                'div',
                mergeAttrs({ key: 'no-data' }, part('noData'), { style: { color: options.noData?.style?.color, fontSize: options.noData?.style?.fontSize } }),
                custom !== null && custom !== undefined ? hookChild(custom) : (options.noData?.text ?? loc.chart.noData)
            );
        }

        const canvasMode = d.cartesian && !d.isBrush ? (mode === 'pan' && !d.zoomed ? 'zoom' : mode) : undefined;
        const canvas = h(
            'div',
            mergeAttrs({ key: 'canvas' }, part('canvas', { mode: canvasMode, interactive: d.zoomEnabled || d.isBrush }), {
                role: keyboard ? 'group' : undefined,
                'aria-roledescription': keyboard ? loc.chart.untitled.toLowerCase() : undefined,
                'aria-labelledby': keyboard ? summaryId : undefined,
                'aria-describedby': keyboard ? helpId : undefined,
                tabindex: keyboard ? 0 : undefined,
                ref: (el: Element) => {
                    if (canvasEl !== el) {
                        if (canvasEl) observer?.unobserve(canvasEl);
                        canvasEl = el as HTMLElement;
                        observer?.observe(canvasEl);
                    }
                },
                onKeydown,
                onBlur
            }),
            svg,
            noData,
            tooltip && !dragging
                ? tooltipView(part, {
                      content: { title: tooltip.title, rows: tooltip.rows, seriesIndex: tooltip.seriesIndex, dataPointIndex: tooltip.dataPointIndex, column: tooltip.column },
                      x: tooltip.x,
                      y: tooltip.y,
                      bounds: { width: sc.width, height: sc.height },
                      size: tooltipSize,
                      swatches: options.tooltip?.marker?.show !== false,
                      custom: customTooltip,
                      render: cfg.hooks?.tooltip?.render,
                      ref: (el) => (tooltipEl = el as HTMLElement)
                  })
                : null
        );

        triggerEl = null;
        tooltipEl = null;
        root.attrs(
            mergeAttrs({ class: original.class ?? undefined, style: original.style ?? undefined }, part('root', { animated, sparkline: d.sparkline, dragging, toolbar: showToolbar && !options.title?.text }), {
                style: {
                    height: d.heightCss,
                    width: d.widthCss,
                    background: chart.background,
                    fontFamily: chart.fontFamily,
                    color: chart.foreColor,
                    '--vt-chart-animation-duration': chart.animations?.speed !== undefined ? `${chart.animations.speed}ms` : undefined
                }
            })
        );
        root.render(
            showToolbar
                ? toolbarView(part, {
                      tools: chart.toolbar?.tools ?? {},
                      mode,
                      zoomed: d.zoomed,
                      canZoom: d.zoomEnabled && !d.isBrush,
                      locale: loc,
                      menuOpen,
                      menuId,
                      triggerRef: (el) => (triggerEl = el as HTMLButtonElement),
                      onZoomIn: () => zoomBy(0.5),
                      onZoomOut: () => zoomBy(2),
                      onReset: resetZoom,
                      onMode: setMode,
                      onTrigger: () => (menuOpen ? closeMenu(false) : openMenu()),
                      onTriggerKeydown
                  })
                : null,
            h(
                'div',
                mergeAttrs({ key: 'body' }, part('body', { legend: showLegend ? legendPosition : undefined })),
                showLegend && (legendPosition === 'top' || legendPosition === 'left') ? legendNode('legend-before') : null,
                canvas,
                showLegend && (legendPosition === 'bottom' || legendPosition === 'right') ? legendNode('legend-after') : null
            ),
            h('span', { key: 'help', id: helpId, hidden: true }, loc.chart.keyboardHelp),
            h('span', mergeAttrs({ key: 'status', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, part('status'), { style: { ...visuallyHidden } }), readout),
            table ? tableView(part, table, formatMessage(loc.chart.dataTable, { title: title || loc.chart.untitled })) : null
        );
        menu.update();

        // After the patch: the tooltip's size (it flips before leaving the chart),
        // and the plot's size when the chart's height changed.
        const tip = tooltipEl as HTMLElement | null;
        if (tip && tip.offsetWidth && (tip.offsetWidth !== tooltipSize.width || tip.offsetHeight !== tooltipSize.height)) {
            tooltipSize = { width: tip.offsetWidth, height: tip.offsetHeight };
            schedule();
        }
        if (lastHeightCss !== d.heightCss) {
            const first = lastHeightCss === undefined;
            lastHeightCss = d.heightCss;
            if (!first) Promise.resolve().then(remeasure);
        }
    }

    function remeasure() {
        if (destroyed) return;
        const before = `${rootWidth}|${size.width}|${size.height}|${fonts.label}|${fonts.title}|${fonts.subtitle}|${fonts.dataLabel}|${fontFamily}`;
        measureSizes();
        const after = `${rootWidth}|${size.width}|${size.height}|${fonts.label}|${fonts.title}|${fonts.subtitle}|${fonts.dataLabel}|${fontFamily}`;
        if (before !== after) render();
    }

    // ---- mount

    // A resize is answered on the next frame: redrawing inside the observer's
    // callback would resize what it observes in the same pass.
    let frame = 0;
    const onResize = () => {
        if (typeof requestAnimationFrame !== 'function') return remeasure();
        if (!frame)
            frame = requestAnimationFrame(() => {
                frame = 0;
                remeasure();
            });
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : undefined;
    observer?.observe(element);
    render();
    measureSizes();
    render();

    // ---- the handle

    const handle: ChartHandle = {
        element,
        update(next) {
            let changed = false;
            let resized = false;
            for (const key of Object.keys(next) as (keyof ChartUpdate)[]) {
                const value = next[key];
                if (key === 'series' || key === 'options') {
                    // Compared with a copy taken when it was last applied, so an object
                    // changed in place counts as changed, and an equal new one does not.
                    if (sameValue(value, key === 'series' ? seriesSnapshot : optionsSnapshot)) continue;
                    (cfg as Record<string, unknown>)[key] = value;
                    if (key === 'series') seriesSnapshot = snapshot(value as ChartSeries);
                    else optionsSnapshot = snapshot(value as ChartOptions);
                    version++;
                    changed = true;
                    resized = true;
                    continue;
                }
                if (Object.is(cfg[key], value)) continue;
                (cfg as Record<string, unknown>)[key] = value;
                changed = true;
                if (key === 'height' || key === 'width' || key === 'type') resized = true;
            }
            if (!changed) return;
            render();
            if (resized) remeasure();
        },
        setLocale(next) {
            handle.update({ locale: next });
        },
        resize: remeasure,
        refresh: () => render(),
        zoomX: (min, max) => setWindow([min, max]),
        resetZoom,
        toggleSeries: (target) => toggleSeries(findSeries(target)),
        showSeries: (target) => {
            const i = findSeries(target);
            if (hidden.has(i)) toggleSeries(i);
        },
        hideSeries: (target) => {
            const i = findSeries(target);
            if (i >= 0 && !hidden.has(i)) toggleSeries(i);
        },
        exportSvg: () => (svgEl ? serializeSvg(svgEl, background()) : ''),
        exportPng: async (scale = 2) => {
            if (!svgEl) return null;
            const { width, height } = svgEl.getBoundingClientRect();
            return svgToPng(serializeSvg(svgEl, background()), width || 600, height || 320, scale);
        },
        exportCsv: () => {
            const d = derive();
            return chartCsv(d.series, d.options.xaxis?.categories ?? d.options.labels, d.chart.toolbar?.export?.csv?.headerCategory);
        },
        download,
        scene: () => derive().scene,
        on(event, handler) {
            let set = listeners.get(event);
            if (!set) listeners.set(event, (set = new Set()));
            set.add(handler as (payload: never) => void);
            return () => handle.off(event, handler);
        },
        off(event, handler) {
            listeners.get(event)?.delete(handler as (payload: never) => void);
        },
        destroy() {
            if (destroyed) return;
            drag.cancel();
            menuOpen = false;
            menu.destroy();
            destroyed = true;
            queued = false;
            observer?.disconnect();
            if (frame) cancelAnimationFrame(frame);
            svgEl?.removeEventListener('wheel', onWheel);
            subscriptions.splice(0).forEach((off) => off());
            const chart = derive().chart;
            if ((hover || keyFocus) && chart.group) chartBus.publish(groupChannel(chart.group), { kind: 'leave', source: chart.id ?? id });
            // A chart that has gone should not go on holding the group open at
            // its own axis width.
            if (chart.group && chart.id) releaseInset(chart.group, chart.id);
            root.clear();
            if (original.class !== null) element.setAttribute('class', original.class);
            if (original.style !== null) element.setAttribute('style', original.style);
            listeners.clear();
            canvasEl = svgEl = tooltipEl = triggerEl = menuEl = null;
        }
    };
    return handle;
}
