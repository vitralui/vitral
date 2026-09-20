import { formatDate } from '@vitral/core';
import { emptyScene, fonts, fraction, measurer, seriesColor, sizeToPx, titles } from './common';
import { chartFormatter, formatNumber } from './format';
import { areaPath, linePath, rectPath, type Corners, type Pt } from './geometry';
import { alignInset } from './group';
import { perSeries } from './options';
import { rangeSpans, streamBaseline, waterfallSpans } from './spans';
import { linear, niceScale, timeTicks, type TimeUnit } from './scale';
import type {
    ChartScene,
    SceneAnnotation,
    SceneAxis,
    SceneBar,
    SceneCandle,
    SceneCell,
    SceneColumn,
    SceneDatum,
    SceneInput,
    SceneLabel,
    SceneMarker,
    SceneMarks,
    SceneTick
} from './scene';
import { categoriesOf, categoryIndex, extent, stackValues, type ChartPoint, type NormalizedSeries } from './series';
import type { ChartAnnotationLabel, ChartCurve, ChartMarkerShape, ChartType, ChartYAxis } from './types';

type Mark = 'line' | 'area' | 'bar' | 'lollipop' | 'scatter' | 'bubble' | 'candlestick' | 'boxPlot';

const BAR_LIKE = new Set<Mark>(['bar', 'lollipop', 'candlestick', 'boxPlot']);

const toNumber = (x: number | string): number => (typeof x === 'number' ? x : Date.parse(x));

/** Which axis measures each series: by `seriesName`, or one axis per series when the counts match, else the first. */
export function axisAssignment(series: NormalizedSeries[], yaxes: ChartYAxis[]): number[] {
    const named = yaxes.some((y) => y.seriesName !== undefined);
    return series.map((s, i) => {
        if (named) {
            const found = yaxes.findIndex((y) => (Array.isArray(y.seriesName) ? y.seriesName.includes(s.name) : y.seriesName === s.name));
            return found >= 0 ? found : 0;
        }
        return yaxes.length > 1 && yaxes.length === series.length ? i : 0;
    });
}

/** The default datetime label for a tick on a given boundary. */
const DATE_PATTERNS: Record<TimeUnit, string> = { year: 'yyyy', month: 'MMM yyyy', day: 'd MMM', hour: 'HH:mm', minute: 'HH:mm', second: 'HH:mm:ss' };

export function buildCartesian(input: SceneInput): ChartScene {
    const { options: o, locale, type } = input;
    const measure = measurer(input);
    const font = fonts(input);
    const sparkline = !!o.chart?.sparkline?.enabled;
    // A range bar and a waterfall are bars, so they turn on their side too.
    const barLike = type === 'bar' || type === 'lollipop' || type === 'rangeBar' || type === 'waterfall' || type === 'histogram' || type === 'bullet';
    const horizontal = barLike && !!o.plotOptions?.bar?.horizontal;
    const all = input.series;
    const visible = all.filter((s) => !input.hidden.has(s.index));
    /**
     * Which mark a series is drawn with. A waterfall, a range bar and a
     * histogram are bars — they differ only in where each one starts and ends,
     * which is worked out before the scale is — so they say so here and the
     * rest of the layout never learns about them.
     */
    const markOf = (s: NormalizedSeries): Mark => {
        const t = (s.type ?? type) as ChartType;
        if (t === 'waterfall' || t === 'rangeBar' || t === 'histogram' || t === 'bullet') return 'bar';
        if (t === 'rangeArea' || t === 'stream') return 'area';
        if (t === 'boxPlot') return 'boxPlot';
        return t === 'heatmap' || t === 'treemap' || t === 'calendar' || t === 'pie' || t === 'donut' || t === 'radar' || t === 'sunburst' || t === 'radialBar' || t === 'gauge' || t === 'funnel' ? 'line' : t;
    };
    const anyBar = visible.some((s) => BAR_LIKE.has(markOf(s)));
    const pointMode = type === 'scatter' || type === 'bubble';
    const xType = o.xaxis?.type === 'datetime' ? 'datetime' : pointMode || o.xaxis?.type === 'numeric' ? 'numeric' : 'category';
    const positional = xType !== 'category';

    // ---- columns: categories, or the shared x values -------------------------------
    const categories = positional ? [] : categoriesOf(all, o.xaxis?.categories ?? (o.labels?.length ? o.labels : undefined));
    const explicit = !o.xaxis?.categories?.length && !o.labels?.length && all.some((s) => s.points.some((p) => p.x !== p.index));
    let xs: number[] = [];
    if (positional) {
        const set = new Set<number>();
        for (const s of visible) for (const p of s.points) {
            const x = toNumber(p.x);
            if (Number.isFinite(x)) set.add(x);
        }
        xs = [...set].sort((a, b) => a - b);
    }
    const columnCount = positional ? xs.length : categories.length;
    const pointsAt: (ChartPoint | undefined)[][] = all.map((s) => {
        if (!positional) return categoryIndex(s, categories, explicit);
        const row: (ChartPoint | undefined)[] = new Array(xs.length);
        const at = new Map(xs.map((x, i) => [x, i]));
        for (const p of s.points) {
            const i = at.get(toNumber(p.x));
            if (i !== undefined && row[i] === undefined) row[i] = p;
        }
        return row;
    });

    const hasData = visible.some((s) => s.points.some((p) => p.y !== null));
    if (!hasData || columnCount === 0) return emptyScene(input);

    // ---- the x domain --------------------------------------------------------------
    let full: [number, number];
    const minGap = xs.length > 1 ? Math.min(...xs.slice(1).map((x, i) => x - xs[i]!)) : 1;
    if (!positional) full = anyBar || columnCount === 1 ? [-0.5, columnCount - 0.5] : [0, columnCount - 1];
    else {
        const lo = o.xaxis?.min ?? xs[0]!;
        const hi = o.xaxis?.max ?? xs[xs.length - 1]!;
        const pad = anyBar ? minGap / 2 : lo === hi ? 1 : 0;
        full = [lo - pad, hi + pad];
        if (pointMode && o.xaxis?.min === undefined && o.xaxis?.max === undefined && xType === 'numeric') {
            // Bubbles have size: leave them room inside the plot.
            const room = type === 'bubble' ? (hi - lo || 1) * 0.12 : 0;
            const nice = niceScale(lo - room, hi + room, 5);
            full = [nice.min, nice.max];
        }
    }
    const view: [number, number] = input.window?.x ? [Math.max(full[0], input.window.x[0]), Math.min(full[1], input.window.x[1])] : full;
    if (!(view[1] > view[0])) view[1] = view[0] + (full[1] - full[0] || 1) * 0.01;
    const colValue = (i: number) => (positional ? xs[i]! : i);
    const inView = (i: number) => {
        const v = colValue(i);
        return v >= view[0] - (positional ? 0 : 0.5) && v <= view[1] + (positional ? 0 : 0.5);
    };

    // ---- stacking --------------------------------------------------------------------
    // A stream is a stacked area that floats: the stacking is not a choice.
    const streaming = type === 'stream';
    const stacked = !!o.chart?.stacked || streaming;
    const percent = stacked && o.chart?.stackType === '100%';
    const stackKind = (m: Mark) => (m === 'bar' || m === 'lollipop' ? 'bar' : m === 'area' ? 'area' : m === 'line' ? 'line' : null);
    const stacks = new Map<number, { from: number; to: number; value: number | null }[]>();

    /*
     * Bars that do not start at zero. A waterfall's each begins where the one
     * before it ended; a range bar's two ends are the two numbers its point
     * carries. Both produce the shape a stack produces, so they are put in the
     * same map and the layout after this point never learns they are different.
     */
    for (const s of visible) {
        const t = (s.type ?? type) as ChartType;
        if (t === 'waterfall') stacks.set(s.index, waterfallSpans(pointsAt[s.index]!, new Set(o.plotOptions?.waterfall?.totals ?? [])));
        else if (t === 'rangeBar' || t === 'rangeArea') stacks.set(s.index, rangeSpans(pointsAt[s.index]!));
    }

    if (stacked) {
        for (const kind of ['bar', 'area', 'line'] as const) {
            const members = visible.filter((s) => stackKind(markOf(s)) === kind);
            if (!members.length) continue;
            const rows = members.map((s) => pointsAt[s.index]!.map((p) => p?.y ?? null));
            for (let i = 0; i < rows.length; i++) while (rows[i]!.length < columnCount) rows[i]!.push(null);
            const result = stackValues(rows, { percent, groups: members.map((s) => s.group) });
            members.forEach((s, i) => stacks.set(s.index, result[i]!));
        }
    }

    if (streaming) {
        const members = visible.filter((s) => markOf(s) === 'area').map((s) => stacks.get(s.index)).filter((v): v is { from: number; to: number; value: number | null }[] => !!v);
        const base = streamBaseline(
            members.map((spans) => spans.map((v) => v.value ?? 0)),
            o.plotOptions?.stream?.offset ?? 'wiggle'
        );
        for (const spans of members)
            spans.forEach((v, i) => {
                v.from += base[i] ?? 0;
                v.to += base[i] ?? 0;
            });
    }

    // ---- y axes ----------------------------------------------------------------------
    const yaxes = o.yaxes.length ? o.yaxes : [{}];
    const axisOf = axisAssignment(all, yaxes);
    const autoScale = !!input.window?.x && (!!o.chart?.zoom?.autoScaleYaxis || !!input.window.autoScaleY);
    const yScales = yaxes.map((axis, a) => {
        const values: number[] = [];
        let wantsZero = false;
        for (const s of visible) {
            if (axisOf[s.index] !== a) continue;
            const m = markOf(s);
            if (m === 'bar' || m === 'area' || m === 'lollipop') wantsZero = true;
            const stack = stacks.get(s.index);
            pointsAt[s.index]!.forEach((p, i) => {
                if (!p || (autoScale && !inView(i))) return;
                if (stack) {
                    values.push(stack[i]!.from, stack[i]!.to);
                } else if (p.ohlc) values.push(p.ohlc[1], p.ohlc[2]);
                // A box reaches past its median to the whiskers, so the axis
                // has to hold the smallest and largest readings.
                else if (p.box) values.push(p.box[0], p.box[4]);
                else if (p.y !== null) values.push(p.y);
            });
        }
        if (pointMode) for (const s of visible) if (axisOf[s.index] === a) for (const p of s.points) if (p.y !== null && (!autoScale || (toNumber(p.x) >= view[0] && toNumber(p.x) <= view[1]))) values.push(p.y);
        let [lo, hi] = extent(values) ?? [0, 1];
        if (type === 'bubble' && axis.min === undefined && axis.max === undefined) {
            const room = (hi - lo || 1) * 0.12;
            lo -= room;
            hi += room;
        }
        if (wantsZero) {
            lo = Math.min(lo, 0);
            hi = Math.max(hi, 0);
        }
        if (percent) [lo, hi] = [Math.min(lo, 0) < 0 ? -100 : 0, 100];
        const ticks = axis.tickAmount ?? (sparkline ? 2 : Math.max(2, Math.min(8, Math.round((horizontal ? input.width : input.height) / 70))));
        const windowed = a === 0 && input.window?.y ? { min: input.window.y[0], max: input.window.y[1] } : {};
        return niceScale(lo, hi, ticks, { min: axis.min, max: axis.max, nice: axis.forceNiceScale !== false, ...windowed });
    });

    // ---- formatters ------------------------------------------------------------------
    const xLabelFormat = chartFormatter(o.xaxis?.labels?.formatter, '{value}', locale);
    const customXLabels = o.xaxis?.labels?.formatter !== undefined && o.xaxis.labels.formatter !== '{value}';
    const formatCategory = (i: number): string => {
        if (positional) {
            const v = xs[i]!;
            return xType === 'datetime' ? formatDate(new Date(v), o.tooltip?.x?.format ?? 'd MMM yyyy HH:mm', locale) : xLabelFormat(v);
        }
        // A window edge falls between categories: name the nearest one.
        const at = Math.min(categories.length - 1, Math.max(0, Math.round(i)));
        return categories.length ? xLabelFormat(categories[at]!) : '';
    };
    const yFormatters = yaxes.map((axis, a) => chartFormatter(axis.labels?.formatter, '{value}', locale, axis.decimalsInFloat ?? yScales[a]!.decimals));
    const tooltipY = o.tooltip?.y?.formatter;
    const formatY = (value: number | null, s: number, index: number) => {
        if (value === null) return '';
        const ctx = { seriesIndex: s, dataPointIndex: index, seriesName: all[s]?.name, category: positional ? xs[index] : categories[index] };
        if (tooltipY !== undefined && tooltipY !== '{value}') return chartFormatter(tooltipY, '{value}', locale)(value, ctx);
        return chartFormatter(yaxes[axisOf[s] ?? 0]?.labels?.formatter, '{value}', locale, Math.max(2, yScales[axisOf[s] ?? 0]!.decimals))(value, ctx);
    };
    const formatX = (value: number | string) => {
        if (o.tooltip?.x?.formatter && o.tooltip.x.formatter !== '{value}') return chartFormatter(o.tooltip.x.formatter, '{value}', locale)(value);
        if (xType === 'datetime') return formatDate(new Date(toNumber(value)), o.tooltip?.x?.format ?? 'd MMM yyyy HH:mm', locale);
        if (typeof value === 'number' && !positional) return formatCategory(value);
        return xLabelFormat(value);
    };

    // ---- layout ----------------------------------------------------------------------
    const t = titles(input);
    const pad = { top: 0, right: 10, bottom: 0, left: 10, ...o.grid?.padding };
    const labelSize = sizeToPx(o.xaxis?.labels?.style?.fontSize, font.label);
    const catAxis = o.xaxis ?? {};
    const showCatLabels = !sparkline && catAxis.labels?.show !== false;
    const valueTickText = yScales.map((scale, a) => scale.ticks.map((v) => yFormatters[a]!(v)));

    // Category tick values and labels (before the plot's size is known, for measuring).
    const catTicks: { value: number; text: string }[] = [];
    if (!positional) {
        for (let i = 0; i < columnCount; i++) if (inView(i)) catTicks.push({ value: i, text: xLabelFormat(categories[i]!, { index: i }) });
    }

    const verticalAxes = yaxes.map((axis, a) => ({ axis, a, show: !sparkline && axis.show !== false && visible.some((s) => axisOf[s.index] === a) }));
    let left = pad.left;
    let right = pad.right;
    let top = t.height + pad.top;
    let bottom = pad.bottom;

    const rotate = catAxis.labels?.rotate ?? 0;
    const catLabelWidth = Math.max(0, ...catTicks.map((c) => measure(c.text, labelSize)));
    if (!horizontal) {
        for (const { axis, a, show } of verticalAxes) {
            if (!show) continue;
            const size = sizeToPx(axis.labels?.style?.fontSize, font.label);
            const w = (axis.labels?.show === false ? 0 : Math.max(0, ...valueTickText[a]!.map((s) => measure(s, size))) + 10) + (axis.title?.text ? size * 1.4 + 4 : 0);
            if (axis.opposite) right += w;
            else left += w;
        }
        if (showCatLabels) {
            const sample = positional ? measure(xType === 'datetime' ? 'Sep 2026' : '000000', labelSize) : catLabelWidth;
            const h = rotate ? Math.abs(Math.sin((rotate * Math.PI) / 180)) * sample + labelSize : labelSize * 1.4;
            const size = h + (catAxis.axisTicks?.show !== false ? (catAxis.axisTicks?.height ?? 5) : 0) + 4 + (catAxis.title?.text ? labelSize * 1.5 : 0);
            if (catAxis.position === 'top') top += size;
            else bottom += size;
        }
    } else {
        if (showCatLabels) left += Math.min(input.width * 0.35, catLabelWidth + 10) + (catAxis.title?.text ? labelSize * 1.4 : 0);
        const first = verticalAxes[0];
        if (first?.show) bottom += labelSize * 1.4 + 6 + (first.axis.title?.text ? labelSize * 1.5 : 0);
    }
    if (!sparkline && anyBar === false && !pointMode && !horizontal) {
        // Room for the first and last category labels to hang past the plot.
        const half = positional ? measure('Sep 2026', labelSize) / 2 : Math.max(measure(catTicks[0]?.text ?? '', labelSize), measure(catTicks[catTicks.length - 1]?.text ?? '', labelSize)) / 2;
        if (showCatLabels && !rotate) {
            left = Math.max(left, half);
            right = Math.max(right, half);
        }
    }
    if (!sparkline) top = Math.max(top, labelSize / 2 + 2);
    // In a group, the plots line up: the widest axis in the group decides where
    // every plot starts and ends, so a price and its volume share a column.
    if (o.chart?.group && o.chart.id && !sparkline) {
        const shared = alignInset(o.chart.group, o.chart.id, { left, right });
        left = shared.left;
        right = shared.right;
    }
    const plot = {
        x: left,
        y: top,
        width: Math.max(10, input.width - left - right),
        height: Math.max(10, input.height - top - bottom)
    };

    // ---- scales ----------------------------------------------------------------------
    const catScale = horizontal ? linear(view[0], view[1], plot.y, plot.y + plot.height) : linear(view[0], view[1], plot.x, plot.x + plot.width);
    const valScales = yScales.map((s, a) => {
        const reversed = !!yaxes[a]!.reversed;
        return horizontal
            ? linear(s.min, s.max, reversed ? plot.x + plot.width : plot.x, reversed ? plot.x : plot.x + plot.width)
            : linear(s.min, s.max, reversed ? plot.y : plot.y + plot.height, reversed ? plot.y + plot.height : plot.y);
    });
    const cat = (i: number) => catScale(colValue(i));
    const val = (a: number, v: number) => valScales[a]!(v);
    const at = (c: number, v: number): Pt => (horizontal ? [v, c] : [c, v]);
    const slot = positional ? Math.abs(catScale(view[0] + minGap) - catScale(view[0])) : Math.abs(catScale(1) - catScale(0));

    // ---- axes and grid ---------------------------------------------------------------
    const axes: SceneAxis[] = [];
    const catTickList: SceneTick[] = [];
    if (!positional) {
        const available = slot;
        const need = horizontal ? labelSize * 1.2 : rotate ? labelSize * 1.2 : catLabelWidth + 8;
        const every = catAxis.labels?.hideOverlappingLabels === false ? 1 : Math.max(1, Math.ceil(need / Math.max(1, available)));
        catTicks.forEach((c, k) => {
            const pos = cat(c.value);
            const labelled = k % every === 0;
            catTickList.push({ pos, value: categories[c.value]!, label: labelled && showCatLabels ? catLabel(pos, c.text) : undefined });
        });
    } else if (xType === 'datetime') {
        const ticks = timeTicks(view[0], view[1], catAxis.tickAmount ?? Math.max(2, Math.floor(plot.width / 110)));
        for (const tick of ticks) {
            const pattern = catAxis.labels?.datetimeFormatter?.[tick.unit] ?? DATE_PATTERNS[tick.unit];
            const text = customXLabels ? xLabelFormat(tick.value) : formatDate(new Date(tick.value), pattern, locale);
            const pos = catScale(tick.value);
            catTickList.push({ pos, value: tick.value, label: showCatLabels ? catLabel(pos, text) : undefined });
        }
        thin(catTickList);
    } else {
        const scale = niceScale(view[0], view[1], catAxis.tickAmount ?? Math.max(2, Math.floor((horizontal ? plot.height : plot.width) / 70)), { min: view[0], max: view[1] });
        for (const v of scale.ticks) {
            const pos = catScale(v);
            const text = customXLabels ? xLabelFormat(v) : formatNumber(v, locale.code, scale.decimals);
            catTickList.push({ pos, value: v, label: showCatLabels ? catLabel(pos, text) : undefined });
        }
        thin(catTickList);
    }

    /**
     * `align` as SVG says it, or the alignment the axis would have chosen.
     * Declared, not assigned: `catLabel` is called before this line is reached.
     */
    function anchorOf(align: 'left' | 'center' | 'right' | undefined, fallback: SceneLabel['anchor']): SceneLabel['anchor'] {
        return align === 'left' ? 'start' : align === 'center' ? 'middle' : align === 'right' ? 'end' : fallback;
    }

    function catLabel(pos: number, text: string): SceneLabel {
        const style = catAxis.labels?.style;
        const align = catAxis.labels?.align;
        if (horizontal) return { x: plot.x - 8 + (catAxis.labels?.offsetX ?? 0), y: pos + (catAxis.labels?.offsetY ?? 0), text, anchor: anchorOf(align, 'end'), baseline: 'middle', style };
        const topSide = catAxis.position === 'top';
        const tick = catAxis.axisTicks?.show !== false ? (catAxis.axisTicks?.height ?? 5) : 0;
        const y = topSide ? plot.y - tick - 4 : plot.y + plot.height + tick + 4;
        return {
            x: pos + (catAxis.labels?.offsetX ?? 0),
            y: y + (catAxis.labels?.offsetY ?? 0),
            text,
            anchor: anchorOf(align, rotate ? 'end' : 'middle'),
            baseline: topSide ? 'auto' : 'hanging',
            rotate: rotate || undefined,
            style
        };
    }

    function thin(list: SceneTick[]) {
        if (horizontal || catAxis.labels?.hideOverlappingLabels === false) return;
        let lastEnd = -Infinity;
        for (const tick of list) {
            if (!tick.label) continue;
            const w = measure(tick.label.text, labelSize);
            const start = tick.pos - w / 2;
            if (start < lastEnd + 6) tick.label = undefined;
            else lastEnd = tick.pos + w / 2;
        }
    }

    if (!sparkline) {
        axes.push({
            side: horizontal ? 'left' : catAxis.position === 'top' ? 'top' : 'bottom',
            at: horizontal ? plot.x : catAxis.position === 'top' ? plot.y : plot.y + plot.height,
            ticks: catTickList,
            line: catAxis.axisBorder?.show !== false,
            tickMarks: !horizontal && catAxis.axisTicks?.show !== false && !positional ? true : catAxis.axisTicks?.show !== false && !horizontal,
            tickLength: catAxis.axisTicks?.height ?? 5,
            color: catAxis.axisBorder?.color,
            title: catAxis.title?.text
                ? horizontal
                    ? { x: pad.left, y: plot.y + plot.height / 2, text: catAxis.title.text, anchor: 'middle', rotate: -90, baseline: 'hanging', style: catAxis.title.style }
                    : { x: plot.x + plot.width / 2, y: input.height - pad.bottom - 2 + (catAxis.title.offsetY ?? 0), text: catAxis.title.text, anchor: 'middle', style: catAxis.title.style }
                : undefined
        });
        let leftEdge = plot.x;
        let rightEdge = plot.x + plot.width;
        for (const { axis, a, show } of verticalAxes) {
            if (!show) continue;
            const size = sizeToPx(axis.labels?.style?.fontSize, font.label);
            const ticks: SceneTick[] = yScales[a]!.ticks.map((v, k) => {
                const pos = val(a, v);
                const text = valueTickText[a]![k]!;
                if (axis.labels?.show === false) return { pos, value: v };
                if (horizontal) return { pos, value: v, label: { x: pos, y: plot.y + plot.height + 6, text, anchor: anchorOf(axis.labels?.align, 'middle'), baseline: 'hanging', style: axis.labels?.style } };
                const x = axis.opposite ? rightEdge + 8 : leftEdge - 8;
                return {
                    pos,
                    value: v,
                    label: {
                        x: x + (axis.labels?.offsetX ?? 0),
                        y: pos + (axis.labels?.offsetY ?? 0),
                        text,
                        anchor: anchorOf(axis.labels?.align, axis.opposite ? 'start' : 'end'),
                        baseline: 'middle',
                        style: axis.labels?.style
                    }
                };
            });
            if (horizontal) {
                axes.push({ side: 'bottom', at: plot.y + plot.height, ticks, line: !!axis.axisBorder?.show, tickMarks: !!axis.axisTicks?.show, tickLength: 5, color: axis.axisBorder?.color, title: axis.title?.text ? { x: plot.x + plot.width / 2, y: input.height - 2, text: axis.title.text, anchor: 'middle', style: axis.title.style } : undefined });
                break;
            }
            const width = Math.max(0, ...valueTickText[a]!.map((s) => measure(s, size))) + 10;
            const titleX = axis.opposite ? rightEdge + width + size * 0.2 : leftEdge - width - size * 0.2;
            axes.push({
                side: axis.opposite ? 'right' : 'left',
                at: axis.opposite ? rightEdge : leftEdge,
                ticks,
                line: !!axis.axisBorder?.show,
                tickMarks: !!axis.axisTicks?.show,
                tickLength: 5,
                color: axis.axisBorder?.color ?? (yaxes.length > 1 ? seriesColor(o, all.find((s) => axisOf[s.index] === a), all.findIndex((s) => axisOf[s.index] === a)) : undefined),
                title: axis.title?.text ? { x: titleX, y: plot.y + plot.height / 2, text: axis.title.text, anchor: 'middle', rotate: axis.opposite ? 90 : -90, baseline: 'auto', style: axis.title.style } : undefined
            });
            const used = width + (axis.title?.text ? size * 1.4 + 4 : 0);
            if (axis.opposite) rightEdge += used;
            else leftEdge -= used;
        }
    }

    const grid: ChartScene['grid'] = { show: !!o.grid?.show && !sparkline, position: o.grid?.position ?? 'back', color: o.grid?.borderColor, dash: o.grid?.strokeDashArray ?? 0, horizontal: [], vertical: [], bands: [] };
    const valueLines = yScales[0]!.ticks.map((v) => val(0, v));
    const catLines = catTickList.map((tick) => tick.pos);
    const valueLinesOn = o.grid?.yaxis?.lines?.show !== false;
    const catLinesOn = !!o.grid?.xaxis?.lines?.show;
    // As in ApexCharts, `grid.xaxis.lines` are the vertical lines and `grid.yaxis.lines` the horizontal ones, whichever way the bars run.
    const horizontalLines = horizontal ? catLines : valueLines;
    const verticalLines = horizontal ? valueLines : catLines;
    if (valueLinesOn) grid.horizontal = horizontalLines;
    if (catLinesOn) grid.vertical = verticalLines;
    const bands = (colors: string[] | undefined, opacity: number | undefined, along: number[], rows: boolean) => {
        if (!colors?.length) return;
        const sorted = [...along].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i]!;
            const b = sorted[i + 1]!;
            grid.bands.push(rows !== horizontal ? { x: plot.x, y: a, width: plot.width, height: b - a, color: colors[i % colors.length]!, opacity: opacity ?? 0.5 } : { x: a, y: plot.y, width: b - a, height: plot.height, color: colors[i % colors.length]!, opacity: opacity ?? 0.5 });
        }
    };
    bands(o.grid?.row?.colors, o.grid?.row?.opacity, valueLines, true);
    bands(o.grid?.column?.colors, o.grid?.column?.opacity, catLines, false);

    /*
     * A bullet's bands: poor, fair and good, drawn behind the bars in one
     * shade getting lighter outwards, so the bar is read against them without
     * a legend. They are grid bands because that is what they are — a
     * background the marks are measured against — and the renderer already
     * draws those behind everything else.
     */
    if (type === 'bullet') {
        const ranges = o.plotOptions?.bullet?.ranges ?? [];
        ranges.forEach((r, i) => {
            const a = val(0, Math.min(r.from, r.to));
            const b = val(0, Math.max(r.from, r.to));
            const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
            const color = r.color ?? 'var(--vt-chart-band-color)';
            const opacity = r.color ? 1 : 1 - i * (0.6 / Math.max(1, ranges.length));
            grid.bands.push(horizontal ? { x: lo, y: plot.y, width: hi - lo, height: plot.height, color, opacity } : { x: plot.x, y: lo, width: plot.width, height: hi - lo, color, opacity });
        });
    }

    // ---- marks -----------------------------------------------------------------------
    const marks: SceneMarks[] = [];
    const data: SceneDatum[] = [];
    const count = all.length;
    const colorOf = (s: NormalizedSeries) => seriesColor(o, s, s.index, count);
    const labelsOn = (s: number) => !!o.dataLabels?.enabled && (!o.dataLabels.enabledOnSeries?.length || o.dataLabels.enabledOnSeries.includes(s));
    const dataLabelSize = sizeToPx(o.dataLabels?.style?.fontSize, font.dataLabel);
    const dataLabel = (value: number | null, s: number, index: number, x: number, y: number, extra: Partial<SceneLabel> = {}): SceneLabel | null => {
        if (value === null) return null;
        const text = chartFormatter(o.dataLabels?.formatter, '{value}', locale, Math.max(0, yScales[axisOf[s] ?? 0]!.decimals))(value, {
            seriesIndex: s,
            dataPointIndex: index,
            seriesName: all[s]?.name,
            category: positional ? xs[index] : categories[index]
        });
        const bg = o.dataLabels?.background;
        return {
            x: x + (o.dataLabels?.offsetX ?? 0),
            y: y + (o.dataLabels?.offsetY ?? 0),
            text,
            anchor: o.dataLabels?.textAnchor ?? 'middle',
            baseline: 'middle',
            style: o.dataLabels?.style,
            background: bg?.enabled ? { color: bg.color, radius: bg.borderRadius ?? 2, padding: bg.padding ?? 4 } : undefined,
            ...extra
        };
    };
    const zeroOf = (a: number) => {
        const s = yScales[a]!;
        return val(a, Math.min(Math.max(0, s.min), s.max));
    };
    const shapeOf = (s: number) => perSeries(o.markers?.shape, s, 'circle' as ChartMarkerShape);
    const markerColors = o.markers?.colors;
    const strokeColors = o.markers?.strokeColors;

    // Line and area.
    for (const s of visible) {
        const m = markOf(s);
        if (m !== 'line' && m !== 'area') continue;
        const a = axisOf[s.index]!;
        const color = colorOf(s);
        const stack = stacks.get(s.index);
        const tops: (Pt | null)[] = [];
        const bases: (Pt | null)[] = [];
        const markers: SceneMarker[] = [];
        const labels: SceneLabel[] = [];
        const size = perSeries(o.markers?.size, s.index, 0);
        pointsAt[s.index]!.forEach((p, i) => {
            if (!p || p.y === null) {
                tops.push(null);
                bases.push(null);
                return;
            }
            const c = cat(i);
            const top = stack ? stack[i]!.to : p.y;
            const from = stack ? stack[i]!.from : null;
            const pt = at(c, val(a, top));
            tops.push(pt);
            bases.push(from === null ? null : at(c, val(a, from)));
            data.push({ series: s.index, index: p.index, column: i, x: pt[0], y: pt[1], r: 6, value: p.y, text: formatY(p.y, s.index, i), label: formatCategory(i), color });
            if (!inView(i)) return;
            if (size > 0) markers.push({ x: pt[0], y: pt[1], size, shape: shapeOf(s.index), fill: markerColors?.length ? perSeries(markerColors, s.index, color) : color, stroke: typeof strokeColors === 'string' ? strokeColors : perSeries(strokeColors, s.index, undefined as unknown as string), strokeWidth: o.markers?.strokeWidth ?? 2 });
            if (labelsOn(s.index)) {
                const label = dataLabel(p.y, s.index, i, pt[0], pt[1] - 10);
                if (label) labels.push(label);
            }
        });
        const curve = perSeries(o.stroke?.curve, s.index, 'smooth' as ChartCurve);
        const fillType = perSeries(o.fill?.type, s.index, 'solid');
        const isArea = m === 'area';
        const baseline = stack && stack.some((v) => v.from !== 0) ? bases : zeroOf(a);
        // A range area has two edges and a band between them, so its stroke is
        // one path of two subpaths: the ends are not joined up.
        const banded = (s.type ?? type) === 'rangeArea';
        const stroke = o.stroke?.show === false ? '' : banded ? `${linePath(tops, curve)} ${linePath(bases, curve)}`.trim() : linePath(tops, curve);
        const g = o.fill?.gradient;
        marks.push({
            kind: 'line',
            series: s.index,
            name: s.name,
            color,
            path: stroke,
            area: isArea ? areaPath(tops, horizontal ? zeroOf(a) : baseline, curve) : undefined,
            fill: isArea
                ? {
                      color: o.fill?.colors?.length ? perSeries(o.fill.colors, s.index, color) : color,
                      opacity: perSeries(o.fill?.opacity, s.index, 0.35),
                      gradient: fillType === 'gradient' ? { vertical: g?.type !== 'horizontal', from: g?.opacityFrom ?? 0.5, to: g?.opacityTo ?? 0.05, stops: [g?.stops?.[0] ?? 0, g?.stops?.[1] ?? 100] } : undefined
                  }
                : undefined,
            width: o.stroke?.show === false ? 0 : perSeries(o.stroke?.width, s.index, 2),
            dash: perSeries(o.stroke?.dashArray, s.index, 0),
            cap: o.stroke?.lineCap ?? 'round',
            markers,
            labels
        });
    }

    // Bars and lollipops.
    const trim = (n: number) => Math.round(n * 100) / 100;

    /**
     * The hairlines carrying each waterfall step to the next, at the level the
     * two share. Without them the floating bars read as unrelated columns; it
     * is one path of subpaths, so it costs a single element.
     */
    const connectorPath = (bars: SceneBar[], s: NormalizedSeries): string | undefined => {
        if ((s.type ?? type) !== 'waterfall' || o.plotOptions?.waterfall?.connectors === false) return undefined;
        const spans = stacks.get(s.index);
        if (!spans) return undefined;
        const parts: string[] = [];
        for (let i = 0; i < bars.length - 1; i++) {
            const b = bars[i]!;
            const next = bars[i + 1]!;
            // The step lands on its own `to`, except a subtotal, which the next
            // step carries on from rather than from zero.
            const level = val(axisOf[s.index]!, spans[b.column]!.to);
            const [x1, y1] = horizontal ? [level, b.y + b.height] : [b.x + b.width, level];
            const [x2, y2] = horizontal ? [level, next.y] : [next.x, level];
            parts.push(`M${trim(x1)} ${trim(y1)}L${trim(x2)} ${trim(y2)}`);
        }
        return parts.length ? parts.join(' ') : undefined;
    };

    const barSeries = visible.filter((s) => markOf(s) === 'bar' || markOf(s) === 'lollipop');
    if (barSeries.length) {
        const bar = o.plotOptions?.bar ?? {};
        const groupKeys = stacked ? [...new Set(barSeries.map((s) => s.group))] : barSeries.map((s) => s.index);
        const width = slot * fraction(horizontal ? bar.barHeight : bar.columnWidth, 0.7);
        const each = width / groupKeys.length;
        const radius = bar.borderRadius ?? 0;
        const totals = new Map<string, { column: number; value: number; edge: number; offset: number; a: number }>();
        for (const s of barSeries) {
            const a = axisOf[s.index]!;
            const g = groupKeys.indexOf(stacked ? (s.group as never) : (s.index as never));
            const offset = -width / 2 + each * (g + 0.5);
            const stack = stacks.get(s.index);
            const color = colorOf(s);
            const lollipop = markOf(s) === 'lollipop';
            const bars: SceneBar[] = [];
            const labels: SceneLabel[] = [];
            pointsAt[s.index]!.forEach((p, i) => {
                if (!p) return;
                // A waterfall's subtotal column is the running sum, so it has a
                // bar to draw even where the data left the value out.
                const span = stack?.[i];
                const value = p.y ?? (span?.value ?? null);
                if (value === null) return;
                const from = span ? span.from : 0;
                const to = span ? span.to : value;
                const c = cat(i) + offset;
                const v0 = val(a, Math.max(yScales[a]!.min, Math.min(yScales[a]!.max, from)));
                const v1 = val(a, to);
                const positive = to >= from;
                // A waterfall is read by direction, not by series: a step that
                // adds and one that takes away have to be told apart at a
                // glance, and a subtotal is neither.
                const fall = (s.type ?? type) === 'waterfall' ? o.plotOptions?.waterfall : undefined;
                const fallColor = fall
                    ? (o.plotOptions!.waterfall!.totals ?? []).includes(i)
                        ? (fall.totalColor ?? 'var(--vt-chart-1)')
                        : to >= from
                          ? (fall.upColor ?? 'var(--vt-chart-4)')
                          : (fall.downColor ?? 'var(--vt-chart-8)')
                    : undefined;
                const barColor =
                    fallColor ??
                    (bar.distributed
                        ? seriesColor(o, undefined, i, columnCount)
                        : (bar.colors?.ranges?.find((r) => value >= r.from && value <= r.to)?.color ?? p.fillColor ?? color));
                const lo = Math.min(v0, v1);
                const size = Math.abs(v1 - v0);
                const rect = horizontal ? { x: lo, y: c - each / 2, width: size, height: each } : { x: c - each / 2, y: lo, width: each, height: size };
                let corners: Corners = {};
                const last = !stack || bar.borderRadiusWhenStacked === 'all' || isLastInStack(s.index, i, positive);
                if (radius && last && !lollipop) {
                    if (bar.borderRadiusApplication === 'around') corners = { tl: radius, tr: radius, br: radius, bl: radius };
                    else if (horizontal) corners = positive ? { tr: radius, br: radius } : { tl: radius, bl: radius };
                    else corners = positive ? { tl: radius, tr: radius } : { bl: radius, br: radius };
                }
                const entry: SceneBar = { series: s.index, index: p.index, column: i, path: lollipop ? '' : rectPath(rect.x, rect.y, rect.width, rect.height, corners), ...rect, color: barColor };
                const end = at(c, v1);
                if (lollipop) {
                    const start = at(c, v0);
                    const markerSize = o.plotOptions?.lollipop?.markerSize ?? 10;
                    entry.stem = { x1: start[0], y1: start[1], x2: end[0], y2: end[1], width: o.plotOptions?.lollipop?.stemWidth ?? 2 };
                    entry.head = { x: end[0], y: end[1], size: markerSize, shape: shapeOf(s.index), fill: barColor, strokeWidth: 0 };
                }
                // The mark to beat: a line across the bar, at the value the
                // point carries rather than at one the options name, since
                // every measure has its own target.
                if (p.target !== undefined && (s.type ?? type) === 'bullet') {
                    const bullet = o.plotOptions?.bullet ?? {};
                    const t = val(a, p.target);
                    const reach = each * 0.75;
                    entry.target = horizontal
                        ? { x1: t, y1: c - reach / 2, x2: t, y2: c + reach / 2, width: bullet.targetWidth ?? 3, color: bullet.targetColor }
                        : { x1: c - reach / 2, y1: t, x2: c + reach / 2, y2: t, width: bullet.targetWidth ?? 3, color: bullet.targetColor };
                }
                bars.push(entry);
                data.push({ series: s.index, index: p.index, column: i, x: end[0], y: end[1], value, text: formatY(value, s.index, i), label: formatCategory(i), color: barColor });
                if (labelsOn(s.index) && inView(i)) {
                    const position = bar.dataLabels?.position ?? 'center';
                    const along = position === 'top' ? (lollipop ? v1 + (horizontal ? 1 : -1) * (positive ? 1 : -1) * 12 : v1 + (horizontal ? -1 : 1) * (positive ? 1 : -1) * 10) : position === 'bottom' ? v0 + (horizontal ? 1 : -1) * (positive ? 1 : -1) * 10 : (v0 + v1) / 2;
                    const [lx, ly] = at(c, along);
                    const fits = horizontal ? size > dataLabelSize * 2 : size > dataLabelSize * 1.4;
                    const beside = lollipop && position === 'top' && horizontal;
                    const headGap = (o.plotOptions?.lollipop?.markerSize ?? 10) / 2 + 4;
                    const label = beside
                        ? dataLabel(value, s.index, i, v1 + (positive ? headGap : -headGap), c, { anchor: positive ? 'start' : 'end' })
                        : dataLabel(value, s.index, i, lx, ly, { onFill: !lollipop && position !== 'top' });
                    if (label && (fits || position === 'top' || lollipop)) labels.push(label);
                }
                if (stack && bar.dataLabels?.total?.enabled) {
                    const key = `${s.group ?? ''}|${i}|${positive}`;
                    const prev = totals.get(key);
                    const edge = positive ? Math.max(to, prev?.edge ?? -Infinity) : Math.min(to, prev?.edge ?? Infinity);
                    totals.set(key, { column: i, value: (prev?.value ?? 0) + value, edge, offset, a });
                }
            });
            marks.push({ kind: 'bar', series: s.index, name: s.name, color, opacity: perSeries(o.fill?.opacity, s.index, 1), bars, labels, connectors: connectorPath(bars, s) });
        }
        if (totals.size) {
            const labels: SceneLabel[] = [];
            const format = chartFormatter(bar.dataLabels?.total?.formatter, '{value}', locale, yScales[0]!.decimals);
            for (const total of totals.values()) {
                if (!inView(total.column)) continue;
                const dir = total.edge >= 0 ? 1 : -1;
                const [x, y] = at(cat(total.column) + total.offset, val(total.a, total.edge) + (horizontal ? 14 : -10) * dir);
                labels.push({ x, y, text: format(total.value), anchor: horizontal ? (dir > 0 ? 'start' : 'end') : 'middle', baseline: 'middle', style: { fontWeight: 600, ...bar.dataLabels?.total?.style } });
            }
            marks.push({ kind: 'bar', series: -1, name: '', color: '', opacity: 1, bars: [], labels });
        }
    }

    function isLastInStack(seriesIndex: number, column: number, positive: boolean): boolean {
        const group = all[seriesIndex]!.group;
        const members = barSeries.filter((s) => s.group === group);
        const after = members.slice(members.findIndex((s) => s.index === seriesIndex) + 1);
        return !after.some((s) => {
            const v = pointsAt[s.index]![column]?.y;
            return v !== null && v !== undefined && v !== 0 && v >= 0 === positive;
        });
    }

    // Candles.
    for (const s of visible) {
        if (markOf(s) !== 'candlestick') continue;
        const a = axisOf[s.index]!;
        const cs = o.plotOptions?.candlestick ?? {};
        const width = slot * fraction(o.plotOptions?.bar?.columnWidth, 0.7);
        const candles: SceneCandle[] = [];
        pointsAt[s.index]!.forEach((p, i) => {
            if (!p?.ohlc) return;
            const [open, high, low, close] = p.ohlc;
            const rising = close >= open;
            const yo = val(a, open);
            const yc = val(a, close);
            const color = rising ? (cs.colors?.upward ?? 'var(--vt-success-color)') : (cs.colors?.downward ?? 'var(--vt-danger-color)');
            const c = cat(i);
            candles.push({ series: s.index, index: p.index, column: i, x: c - width / 2, width, body: { y: Math.min(yo, yc), height: Math.max(1, Math.abs(yo - yc)) }, wick: { y1: val(a, high), y2: val(a, low) }, rising, color, hollow: rising && !!cs.hollowRising });
            const f = (v: number) => formatY(v, s.index, i);
            data.push({
                series: s.index,
                index: p.index,
                column: i,
                x: c,
                y: yc,
                value: close,
                text: f(close),
                label: formatCategory(i),
                color,
                extra: [
                    { name: locale.chart.open, text: f(open) },
                    { name: locale.chart.high, text: f(high) },
                    { name: locale.chart.low, text: f(low) },
                    { name: locale.chart.close, text: f(close) }
                ]
            });
        });
        marks.push({ kind: 'candle', series: s.index, name: s.name, color: colorOf(s), candles });
    }

    /*
     * Boxes. A box plot is a candle with a line across it: the body runs from
     * the lower quartile to the upper, the whisker from the smallest reading to
     * the largest, and the median says where the middle of the data sits inside
     * that. The five numbers arrive sorted, so the only decision left is the
     * colour, which says whether the median leans high or low.
     */
    for (const s of visible) {
        if (markOf(s) !== 'boxPlot') continue;
        const a = axisOf[s.index]!;
        const box = o.plotOptions?.boxPlot ?? {};
        const width = slot * fraction(o.plotOptions?.bar?.columnWidth, 0.6);
        const boxes: SceneCandle[] = [];
        pointsAt[s.index]!.forEach((p, i) => {
            if (!p?.box) return;
            const [min, q1, median, q3, max] = p.box;
            const yq1 = val(a, q1);
            const yq3 = val(a, q3);
            // A box is drawn in its series' colour unless the options ask for
            // the median's lean to be coloured, which is a choice, not a default.
            const high = median >= (min + max) / 2;
            const color = (high ? box.upColor : box.downColor) ?? colorOf(s);
            const c = cat(i);
            boxes.push({
                series: s.index,
                index: p.index,
                column: i,
                x: c - width / 2,
                width,
                body: { y: Math.min(yq1, yq3), height: Math.max(1, Math.abs(yq1 - yq3)) },
                wick: { y1: val(a, max), y2: val(a, min) },
                median: val(a, median),
                caps: true,
                rising: high,
                color,
                hollow: false
            });
            const f = (v: number) => formatY(v, s.index, i);
            data.push({
                series: s.index,
                index: p.index,
                column: i,
                x: c,
                y: val(a, median),
                value: median,
                text: f(median),
                label: formatCategory(i),
                color,
                extra: [
                    { name: locale.chart.minimum, text: f(min) },
                    { name: locale.chart.lowerQuartile, text: f(q1) },
                    { name: locale.chart.median, text: f(median) },
                    { name: locale.chart.upperQuartile, text: f(q3) },
                    { name: locale.chart.maximum, text: f(max) }
                ]
            });
        });
        marks.push({ kind: 'candle', series: s.index, name: s.name, color: colorOf(s), candles: boxes });
    }

    // Scatter and bubbles.
    if (pointMode) {
        const bubble = type === 'bubble';
        const zs = extent(visible.flatMap((s) => s.points.map((p) => p.z ?? null)));
        const minR = o.plotOptions?.bubble?.minBubbleRadius ?? 4;
        const maxR = Math.min(o.plotOptions?.bubble?.maxBubbleRadius ?? 28, Math.min(plot.width, plot.height) / 6);
        const zFormat = chartFormatter(o.tooltip?.z?.formatter, '{value}', locale);
        for (const s of visible) {
            const a = axisOf[s.index]!;
            const color = colorOf(s);
            const markers: (SceneMarker & { index: number })[] = [];
            const labels: SceneLabel[] = [];
            const size = perSeries(o.markers?.size, s.index, 7) || 7;
            for (const p of s.points) {
                if (p.y === null) continue;
                const xv = toNumber(p.x);
                if (!Number.isFinite(xv)) continue;
                const x = catScale(xv);
                const y = val(a, p.y);
                const r = bubble && zs && p.z !== undefined ? Math.max(minR, Math.sqrt(Math.max(0, p.z) / Math.max(zs[1], 1e-9)) * maxR) : size / 2;
                const column = xs.indexOf(xv);
                const inside = xv >= view[0] && xv <= view[1];
                if (inside) markers.push({ index: p.index, x, y, size: r * 2, shape: bubble ? 'circle' : shapeOf(s.index), fill: p.fillColor ?? color, stroke: bubble ? color : undefined, strokeWidth: bubble ? 1 : 0 });
                data.push({
                    series: s.index,
                    index: p.index,
                    column,
                    x,
                    y,
                    r: Math.max(r, 6),
                    value: p.y,
                    text: formatY(p.y, s.index, column),
                    label: formatX(xv),
                    color,
                    extra: bubble && p.z !== undefined ? [{ name: o.tooltip?.z?.title ?? locale.chart.size, text: zFormat(p.z) }] : undefined
                });
                if (inside && labelsOn(s.index)) {
                    const label = dataLabel(bubble ? (p.z ?? p.y) : p.y, s.index, p.index, x, bubble ? y : y - r - 8, { onFill: bubble });
                    if (label) labels.push(label);
                }
            }
            marks.push({ kind: 'points', series: s.index, name: s.name, color, opacity: perSeries(o.fill?.opacity, s.index, bubble ? 0.75 : 1), markers, labels });
        }
    }

    // ---- columns (for the shared tooltip, crosshair and keyboard) ---------------------
    const columns: SceneColumn[] = [];
    if (!pointMode) {
        for (let i = 0; i < columnCount; i++) {
            columns.push({ index: i, pos: cat(i), half: Math.max(1, slot / 2), label: formatCategory(i), value: positional ? xs[i]! : categories[i]!, visible: inView(i) });
        }
    }

    // ---- annotations -----------------------------------------------------------------
    const annotations: ChartScene['annotations'] = { back: [], front: [] };
    const target = o.annotations?.position === 'back' ? annotations.back : annotations.front;
    const catPos = (x: number | string): number | null => {
        if (positional) return catScale(toNumber(x));
        const i = categories.findIndex((c) => c === x || String(c) === String(x));
        if (i >= 0) return cat(i);
        return typeof x === 'number' ? catScale(x) : null;
    };
    const annotationLabel = (l: ChartAnnotationLabel | undefined, x: number, y: number, anchor: 'start' | 'middle' | 'end', baseline: 'auto' | 'middle' | 'hanging' = 'auto'): SceneAnnotation['label'] =>
        l?.text
            ? { x: x + (l.offsetX ?? 0), y: y + (l.offsetY ?? 0), text: l.text, anchor: l.textAnchor ?? anchor, baseline, style: l.style, borderColor: l.borderColor, fill: l.style?.background }
            : undefined;
    for (const ya of o.annotations?.yaxis ?? []) {
        const a = Math.min(ya.yAxisIndex ?? 0, valScales.length - 1);
        const p1 = val(a, ya.y);
        const p2 = ya.y2 !== undefined ? val(a, ya.y2) : p1;
        const range = ya.y2 !== undefined;
        const [x1, y1] = horizontal ? [p1, plot.y] : [plot.x, p1];
        const [x2, y2] = horizontal ? [p2, plot.y + plot.height] : [plot.x + plot.width * fraction(ya.width, 1), p2];
        const position = ya.label?.position ?? 'right';
        const lx = horizontal ? x1 : position === 'left' ? plot.x + 4 : position === 'center' ? plot.x + plot.width / 2 : plot.x + plot.width - 4;
        target.push({
            kind: range ? 'yrange' : 'yline',
            x1: Math.min(x1, x2),
            y1: Math.min(y1, y2),
            x2: Math.max(x1, x2),
            y2: Math.max(y1, y2),
            color: ya.borderColor,
            fill: ya.fillColor,
            opacity: ya.opacity ?? 0.15,
            dash: ya.strokeDashArray ?? 4,
            label: annotationLabel(ya.label, lx, Math.min(y1, y2) - 4, position === 'left' ? 'start' : position === 'center' ? 'middle' : 'end')
        });
    }
    for (const xa of o.annotations?.xaxis ?? []) {
        const p1 = catPos(xa.x);
        if (p1 === null) continue;
        const p2 = xa.x2 !== undefined ? (catPos(xa.x2) ?? p1) : p1;
        const range = xa.x2 !== undefined;
        const [x1, y1] = horizontal ? [plot.x, p1] : [p1, plot.y];
        const [x2, y2] = horizontal ? [plot.x + plot.width, p2] : [p2, plot.y + plot.height];
        target.push({
            kind: range ? 'xrange' : 'xline',
            x1: Math.min(x1, x2),
            y1: Math.min(y1, y2),
            x2: Math.max(x1, x2),
            y2: Math.max(y1, y2),
            color: xa.borderColor,
            fill: xa.fillColor,
            opacity: xa.opacity ?? 0.15,
            dash: xa.strokeDashArray ?? 4,
            label: annotationLabel(xa.label, Math.max(x1, x2) - 4, plot.y + 4, 'end', 'hanging')
        });
    }
    for (const pa of o.annotations?.points ?? []) {
        const c = catPos(pa.x);
        if (c === null) continue;
        const a = Math.min(pa.yAxisIndex ?? 0, valScales.length - 1);
        const [x, y] = at(c, val(a, pa.y));
        const size = pa.marker?.size ?? 5;
        target.push({
            kind: 'point',
            x1: x,
            y1: y,
            x2: x,
            y2: y,
            opacity: 1,
            dash: 0,
            marker: { x, y, size: size * 2, shape: 'circle', fill: pa.marker?.fillColor ?? seriesColor(o, all[pa.seriesIndex ?? 0], pa.seriesIndex ?? 0, count), stroke: pa.marker?.strokeColor, strokeWidth: pa.marker?.strokeWidth ?? 2 },
            label: annotationLabel(pa.label, x, y - size - 6, 'middle')
        });
    }

    return {
        type,
        width: input.width,
        height: input.height,
        plot,
        horizontal,
        title: t.title,
        subtitle: t.subtitle,
        grid,
        axes,
        marks,
        annotations,
        columns,
        data,
        visibleSeries: visible.map((s) => s.index),
        xDomain: { full, view, kind: xType },
        xInvert: (pixel) => catScale.invert(pixel),
        yDomains: yScales.map((s) => [s.min, s.max]),
        yInvert: (pixel, axis = 0) => valScales[axis]!.invert(pixel),
        empty: false,
        formatX,
        formatY
    };
}

/** Rows are series, columns categories; each cell is shaded by its value. */
export function buildHeatmap(input: SceneInput): ChartScene {
    const { options: o, locale } = input;
    const measure = measurer(input);
    const font = fonts(input);
    const visible = input.series.filter((s) => !input.hidden.has(s.index));
    const categories = categoriesOf(input.series, o.xaxis?.categories);
    const explicit = !o.xaxis?.categories?.length && input.series.some((s) => s.points.some((p) => p.x !== p.index));
    if (!visible.length || !categories.length) return emptyScene(input);
    const t = titles(input);
    const labelSize = font.label;
    const sparkline = !!o.chart?.sparkline?.enabled;
    const rowsTopDown = [...visible].reverse();
    const left = (sparkline ? 0 : Math.max(0, ...rowsTopDown.map((s) => measure(s.name, labelSize))) + 12) + (o.grid?.padding?.left ?? 0);
    const bottom = sparkline ? 0 : labelSize * 1.6 + 4;
    const plot = { x: left, y: t.height + 2, width: Math.max(10, input.width - left - (o.grid?.padding?.right ?? 4)), height: Math.max(10, input.height - t.height - 2 - bottom) };
    const cw = plot.width / categories.length;
    const rh = plot.height / rowsTopDown.length;
    const h = o.plotOptions?.heatmap ?? {};
    const values = visible.flatMap((s) => categoryIndex(s, categories, explicit).map((p) => p?.y ?? null));
    const [lo, hi] = extent(values) ?? [0, 1];
    const min = h.colorScale?.min ?? lo;
    const max = h.colorScale?.max ?? hi;
    const steps = Math.max(1, h.shadeSteps ?? 5);
    const intensity = h.shadeIntensity ?? 0.85;
    const strokeWidth = o.stroke?.show === false ? 0 : (typeof o.stroke?.width === 'number' ? o.stroke.width : 2);
    const format = chartFormatter(o.dataLabels?.formatter, '{value}', locale);
    const cells: SceneCell[] = [];
    const data: SceneDatum[] = [];
    const count = input.series.length;
    rowsTopDown.forEach((s, r) => {
        const base = seriesColor(o, s, h.distributed ? s.index : o.colors && o.colors.length === 1 ? 0 : s.index, count);
        categoryIndex(s, categories, explicit).forEach((p, c) => {
            const value = p?.y ?? null;
            let level = 0;
            let color = 'var(--vt-chart-heatmap-empty)';
            if (value !== null) {
                const range = h.colorScale?.ranges?.find((x) => value >= x.from && value <= x.to);
                let share = max > min ? (value - min) / (max - min) : 1;
                if (h.colorScale?.inverse) share = 1 - share;
                level = Math.max(1, Math.ceil(share * steps)) / steps;
                const fill = p?.fillColor ?? range?.color ?? base;
                const pct = h.enableShades === false || range ? 100 : Math.round(100 * (1 - intensity + intensity * level));
                color = pct >= 100 ? fill : `color-mix(in srgb, ${fill} ${pct}%, var(--vt-chart-heatmap-base))`;
                if (range || h.enableShades === false) level = 1;
            }
            const x = plot.x + c * cw;
            const y = plot.y + r * rh;
            const cell: SceneCell = { series: s.index, index: p?.index ?? c, column: c, x, y, width: cw, height: rh, radius: h.radius ?? 2, color, level, stroke: !h.useFillColorAsStroke };
            if (o.dataLabels?.enabled && value !== null && cw > 18 && rh > 12) {
                cell.label = { x: x + cw / 2, y: y + rh / 2, text: format(value, { seriesIndex: s.index, dataPointIndex: c, seriesName: s.name, category: categories[c] }), anchor: 'middle', baseline: 'middle', style: o.dataLabels.style, onFill: level > 0.55 };
            }
            cells.push(cell);
            data.push({ series: s.index, index: p?.index ?? c, column: c, x: x + cw / 2, y: y + rh / 2, r: Math.min(cw, rh) / 2, value, text: value === null ? '' : chartFormatter(o.tooltip?.y?.formatter, '{value}', locale)(value, { seriesName: s.name }), label: String(categories[c]), color });
        });
    });
    const axes: SceneAxis[] = sparkline
        ? []
        : [
              {
                  side: 'left',
                  at: plot.x,
                  line: false,
                  tickMarks: false,
                  tickLength: 0,
                  ticks: rowsTopDown.map((s, r) => ({ pos: plot.y + r * rh + rh / 2, value: s.name, label: { x: plot.x - 8, y: plot.y + r * rh + rh / 2, text: s.name, anchor: 'end', baseline: 'middle' } }))
              },
              {
                  side: 'bottom',
                  at: plot.y + plot.height,
                  line: false,
                  tickMarks: false,
                  tickLength: 0,
                  ticks: thinLabels(
                      categories.map((c, i) => {
                          const text = chartFormatter(o.xaxis?.labels?.formatter, '{value}', locale)(c);
                          return { pos: plot.x + i * cw + cw / 2, value: c, label: { x: plot.x + i * cw + cw / 2, y: plot.y + plot.height + 6, text, anchor: 'middle' as const, baseline: 'hanging' as const } };
                      }),
                      (text) => measure(text, labelSize)
                  )
              }
          ];
    return {
        ...emptyScene(input),
        plot,
        axes,
        heatmap: { kind: 'heatmap', cells, rows: rowsTopDown.map((s, r) => ({ series: s.index, name: s.name, y: plot.y + r * rh, height: rh })), strokeWidth },
        data,
        visibleSeries: visible.map((s) => s.index),
        columns: categories.map((c, i) => ({ index: i, pos: plot.x + i * cw + cw / 2, half: cw / 2, label: String(c), value: c, visible: true })),
        xDomain: { full: [0, categories.length], view: [0, categories.length], kind: 'category' },
        empty: false,
        formatX: (v) => String(v),
        formatY: (v) => (v === null ? '' : format(v))
    };
}

function thinLabels(ticks: SceneTick[], measure: (text: string) => number): SceneTick[] {
    let lastEnd = -Infinity;
    for (const tick of ticks) {
        if (!tick.label) continue;
        const w = measure(tick.label.text);
        if (tick.pos - w / 2 < lastEnd + 4) tick.label = undefined;
        else lastEnd = tick.pos + w / 2;
    }
    return ticks;
}

