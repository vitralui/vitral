import { emptyScene, fonts, fraction, measurer, seriesColor, sizeToPx, titles } from './common';
import { chartFormatter } from './format';
import { sectorPath, polar, polygonPath, type Pt } from './geometry';
import { perSeries } from './options';
import { niceScale } from './scale';
import type { ChartScene, SceneDatum, SceneInput, SceneLabel, SceneMarker, SceneSlice, SceneText } from './scene';
import { categoriesOf, categoryIndex, extent } from './series';

/**
 * A pie or a donut: each series is a slice (a bare array of numbers is read
 * that way). Slices start at twelve o'clock by default and run clockwise; the
 * hovered one grows and a selected one is pulled out along its middle.
 */
export function buildPie(input: SceneInput): ChartScene {
    const { options: o, locale, type } = input;
    const p = o.plotOptions?.pie ?? {};
    const visible = input.series.filter((s) => !input.hidden.has(s.index));
    const values = visible.map((s) => Math.max(0, s.points.reduce((sum, pt) => sum + (pt.y ?? 0), 0)));
    const total = values.reduce((a, b) => a + b, 0);
    if (!visible.length || total <= 0) return emptyScene(input);
    const t = titles(input);
    const font = fonts(input);
    const plot = { x: 0, y: t.height, width: input.width, height: Math.max(10, input.height - t.height) };
    const grow = 8;
    const outer = Math.max(4, (Math.min(plot.width, plot.height) / 2 - grow - 2) * (p.customScale ?? 1));
    const donut = type === 'donut';
    const inner = donut ? outer * fraction(p.donut?.size, 0.62) : 0;
    const cx = plot.x + plot.width / 2 + (p.offsetX ?? 0);
    const cy = plot.y + plot.height / 2 + (p.offsetY ?? 0);
    const startAngle = p.startAngle ?? 0;
    const span = (p.endAngle ?? 360) - startAngle;
    const count = input.series.length;
    const labels = o.dataLabels?.enabled !== false;
    const format = chartFormatter(o.dataLabels?.formatter, '{percent|percent}', locale);
    const valueFormat = chartFormatter(o.tooltip?.y?.formatter, '{value}', locale);
    const minAngle = p.dataLabels?.minAngleToShowLabel ?? 10;
    const labelSize = sizeToPx(o.dataLabels?.style?.fontSize, font.dataLabel);
    const slices: SceneSlice[] = [];
    const data: SceneDatum[] = [];
    let angle = startAngle;
    visible.forEach((s, k) => {
        const value = values[k]!;
        const share = value / total;
        const sweep = share * span;
        const start = angle;
        const end = angle + sweep;
        angle = end;
        const mid = (start + end) / 2;
        const color = seriesColor(o, s, s.index, count);
        const pull = polar(0, 0, grow, mid);
        const labelRadius = donut ? (inner + outer) / 2 : outer * 0.66;
        const [lx, ly] = polar(cx, cy, labelRadius + (p.dataLabels?.offset ?? 0), mid);
        const percent = share * 100;
        let label: SceneLabel | undefined;
        if (labels && o.dataLabels?.enabled && Math.abs(sweep) >= minAngle) {
            label = { x: lx, y: ly, text: format(value, { seriesIndex: s.index, dataPointIndex: 0, seriesName: s.name, percent }), anchor: 'middle', baseline: 'middle', style: o.dataLabels?.style, onFill: true };
            if (labelSize * 3 > outer - inner && donut) label = undefined;
        }
        slices.push({
            series: s.index,
            path: value > 0 ? sectorPath(cx, cy, inner, outer, start, end) : '',
            hoverPath: value > 0 ? sectorPath(cx, cy, inner, outer + grow / 2, start, end) : '',
            selectedPath: value > 0 ? sectorPath(cx + pull[0], cy + pull[1], inner, outer, start, end) : '',
            color,
            value,
            percent,
            start,
            end,
            mid,
            label,
            offset: pull
        });
        const [hx, hy] = polar(cx, cy, (inner + outer) / 2, mid);
        data.push({ series: s.index, index: 0, column: k, x: hx, y: hy, r: (outer - inner) / 2, value, text: valueFormat(value, { seriesName: s.name, percent }), label: s.name, color });
    });
    return {
        ...emptyScene(input),
        title: t.title,
        subtitle: t.subtitle,
        plot,
        pie: { kind: 'pie', cx, cy, inner, outer, slices, total, donut, background: p.donut?.background, strokeWidth: o.stroke?.show === false ? 0 : perSeries(o.stroke?.width, 0, 2) },
        data,
        visibleSeries: visible.map((s) => s.index),
        empty: false,
        formatY: (v) => (v === null ? '' : valueFormat(v))
    };
}

/** The slice under a point, by angle and radius. */
export function sliceAt(pie: NonNullable<ChartScene['pie']>, x: number, y: number): number {
    const dx = x - pie.cx;
    const dy = y - pie.cy;
    const r = Math.hypot(dx, dy);
    if (r < pie.inner || r > pie.outer + 10) return -1;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const first = pie.slices[0]?.start ?? 0;
    while (angle < first) angle += 360;
    while (angle >= first + 360) angle -= 360;
    // Radial bars share their angles and differ by radius, so a ring that
    // carries its own radii is found by both.
    return pie.slices.findIndex((s) => {
        if (s.inner !== undefined && s.outer !== undefined && (r < s.inner || r > s.outer)) return false;
        return angle >= Math.min(s.start, s.end) && angle < Math.max(s.start, s.end);
    });
}

/**
 * A radar: one spoke per category from twelve o'clock clockwise, each series
 * a polygon. The scale always starts at zero: a radar is read as an area,
 * and an area from a floating baseline misstates every axis at once.
 */
export function buildRadar(input: SceneInput): ChartScene {
    const { options: o, locale } = input;
    const measure = measurer(input);
    const font = fonts(input);
    const r = o.plotOptions?.radar ?? {};
    const visible = input.series.filter((s) => !input.hidden.has(s.index));
    const categories = categoriesOf(input.series, o.xaxis?.categories ?? (o.labels?.length ? o.labels : undefined));
    const explicit = !o.xaxis?.categories?.length && !o.labels?.length && input.series.some((s) => s.points.some((p) => p.x !== p.index));
    const rows = input.series.map((s) => categoryIndex(s, categories, explicit));
    const values = visible.flatMap((s) => rows[s.index]!.map((p) => p?.y ?? null));
    if (!visible.length || categories.length < 3 || !extent(values)) return emptyScene(input);
    const t = titles(input);
    const plot = { x: 0, y: t.height, width: input.width, height: Math.max(10, input.height - t.height) };
    const labelSize = font.label;
    const axisFormat = chartFormatter(o.xaxis?.labels?.formatter, '{value}', locale);
    const names = categories.map((c) => axisFormat(c));
    const sparkline = !!o.chart?.sparkline?.enabled;
    const margin = sparkline || o.xaxis?.labels?.show === false ? 6 : Math.min(plot.width / 4, Math.max(...names.map((n) => measure(n, labelSize))) + 12);
    const radius = r.size ?? Math.max(10, Math.min(plot.width / 2 - margin, plot.height / 2 - labelSize * 1.6));
    const cx = plot.x + plot.width / 2 + (r.offsetX ?? 0);
    const cy = plot.y + plot.height / 2 + (r.offsetY ?? 0);
    const axis = o.yaxes[0] ?? {};
    const [, hi] = extent(values)!;
    const scale = niceScale(0, Math.max(hi, 0), axis.tickAmount ?? 4, { min: 0, max: axis.max });
    const n = categories.length;
    const angleOf = (i: number) => (360 / n) * i;
    const rOf = (v: number) => (Math.max(0, v) / (scale.max || 1)) * radius;
    const grid = r.grid ?? 'web';
    const rings = scale.ticks
        .filter((v) => v > 0)
        .map((v, k) => ({
            path: polygonPath(categories.map((_, i) => polar(cx, cy, rOf(v), angleOf(i)))),
            fill: grid === 'polygon' ? (r.polygons?.fill?.colors?.[k % (r.polygons.fill.colors.length || 1)] ?? (k % 2 ? 'var(--vt-chart-radar-band)' : 'transparent')) : undefined
        }))
        .reverse();
    const spokes = grid === 'none' ? [] : categories.map((_, i) => {
        const [x2, y2] = polar(cx, cy, radius, angleOf(i));
        return { x1: cx, y1: cy, x2, y2 };
    });
    const axisLabels: SceneText[] = sparkline || o.xaxis?.labels?.show === false
        ? []
        : names.map((text, i) => {
              const a = angleOf(i);
              const [x, y] = polar(cx, cy, radius + 10, a);
              const sin = Math.sin((a * Math.PI) / 180);
              const cos = -Math.cos((a * Math.PI) / 180);
              return { x, y: y + (cos > 0.3 ? labelSize * 0.35 : cos < -0.3 ? 0 : labelSize * 0.35), text, anchor: Math.abs(sin) < 0.2 ? 'middle' : sin > 0 ? 'start' : 'end', baseline: cos > 0.3 ? 'hanging' : 'auto', style: o.xaxis?.labels?.style };
          });
    const yFormat = chartFormatter(axis.labels?.formatter, '{value}', locale, scale.decimals);
    const tickLabels: SceneText[] = sparkline || axis.show === false || axis.labels?.show === false
        ? []
        : scale.ticks.slice(0, -1).map((v) => ({ x: cx + 4, y: cy - rOf(v), text: yFormat(v), anchor: 'start' as const, baseline: 'middle' as const, style: axis.labels?.style }));
    const count = input.series.length;
    const tooltipFormat = chartFormatter(o.tooltip?.y?.formatter, '{value}', locale);
    const data: SceneDatum[] = [];
    const polygons = visible.map((s) => {
        const color = seriesColor(o, s, s.index, count);
        const pts: Pt[] = [];
        const markers: SceneMarker[] = [];
        const labels: SceneLabel[] = [];
        const size = perSeries(o.markers?.size, s.index, 4);
        rows[s.index]!.forEach((p, i) => {
            const v = p?.y ?? 0;
            const pt = polar(cx, cy, rOf(v), angleOf(i));
            pts.push(pt);
            if (size > 0 && p?.y !== null && p) markers.push({ x: pt[0], y: pt[1], size, shape: perSeries(o.markers?.shape, s.index, 'circle'), fill: color, strokeWidth: o.markers?.strokeWidth ?? 2 });
            if (o.dataLabels?.enabled && p?.y !== null && p) labels.push({ x: pt[0], y: pt[1] - 10, text: chartFormatter(o.dataLabels.formatter, '{value}', locale)(v, { seriesName: s.name }), anchor: 'middle', baseline: 'middle', style: o.dataLabels.style });
            data.push({ series: s.index, index: p?.index ?? i, column: i, x: pt[0], y: pt[1], r: 8, value: p?.y ?? null, text: p?.y === null || !p ? '' : tooltipFormat(v, { seriesName: s.name }), label: names[i]!, color });
        });
        const type = perSeries(o.fill?.type, s.index, 'solid');
        return {
            series: s.index,
            name: s.name,
            color,
            path: polygonPath(pts),
            fill: { color: o.fill?.colors?.length ? perSeries(o.fill.colors, s.index, color) : color, opacity: perSeries(o.fill?.opacity, s.index, 0.2), gradient: type === 'gradient' ? { vertical: true, from: 0.5, to: 0.1, stops: [0, 100] as [number, number] } : undefined },
            width: o.stroke?.show === false ? 0 : perSeries(o.stroke?.width, s.index, 2),
            markers,
            labels
        };
    });
    return {
        ...emptyScene(input),
        title: t.title,
        subtitle: t.subtitle,
        plot,
        radar: { kind: 'radar', cx, cy, radius, grid, rings, spokes, axisLabels, tickLabels, polygons, strokeColor: r.polygons?.strokeColors, connectorColor: r.polygons?.connectorColors, strokeWidth: r.polygons?.strokeWidth ?? 1 },
        columns: names.map((label, i) => ({ index: i, pos: angleOf(i), half: 180 / n, label, value: categories[i]!, visible: true })),
        data,
        visibleSeries: visible.map((s) => s.index),
        empty: false,
        formatX: (v) => axisFormat(v),
        formatY: (v) => (v === null ? '' : tooltipFormat(v)),
        yDomains: [[0, scale.max]]
    };
}

/** The spoke nearest a point, by angle. */
export function spokeAt(radar: NonNullable<ChartScene['radar']>, count: number, x: number, y: number): number {
    if (Math.hypot(x - radar.cx, y - radar.cy) > radar.radius + 24) return -1;
    let angle = (Math.atan2(y - radar.cy, x - radar.cx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return Math.round(angle / (360 / count)) % count;
}

/**
 * What an arc of the unit circle covers, from `start` to `end` degrees: the
 * two ends, plus whichever of the four quarter points the arc passes through.
 * A ring open at the bottom is wider than it is tall, and this is what says by
 * how much.
 */
export function arcBox(start: number, end: number): { minX: number; maxX: number; minY: number; maxY: number } {
    const points: Pt[] = [polar(0, 0, 1, start), polar(0, 0, 1, end)];
    for (let a = Math.ceil(start / 90) * 90; a <= end; a += 90) points.push(polar(0, 0, 1, a));
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return { minX: Math.min(...xs, 0), maxX: Math.max(...xs, 0), minY: Math.min(...ys, 0), maxY: Math.max(...ys, 0) };
}

/**
 * Radial bars: one ring a series, each as long a share of the circle as its
 * value is of the maximum, drawn over a track that shows what a full ring
 * would be. A gauge is the same thing with one ring and an arc rather than a
 * circle, so both are laid out here.
 *
 * It is a donut as far as the renderer is concerned — arcs, a hollow middle
 * and a centre readout — so the scene it produces is a `pie`, with the rings
 * carrying their own radii for hit testing.
 */
export function buildRadialBar(input: SceneInput): ChartScene {
    const { options: o, locale, type } = input;
    const r = o.plotOptions?.radialBar ?? {};
    const visible = input.series.filter((s) => !input.hidden.has(s.index));
    if (!visible.length) return emptyScene(input);
    const gauge = type === 'gauge';
    const t = titles(input);
    const font = fonts(input);
    const plot = { x: 0, y: t.height, width: input.width, height: Math.max(10, input.height - t.height) };
    const startAngle = r.startAngle ?? (gauge ? -135 : 0);
    const endAngle = r.endAngle ?? (gauge ? 135 : 360);
    const span = endAngle - startAngle;
    const max = r.max ?? 100;
    const min = r.min ?? 0;

    // An arc that does not close covers less than a circle, so the rings are
    // sized and placed by what they actually draw: a gauge open at the bottom
    // is wider than it is tall, and fills the box rather than floating in it.
    const box = arcBox(Math.min(startAngle, endAngle), Math.max(startAngle, endAngle));
    const outer = Math.max(6, Math.min((plot.width - 4) / (box.maxX - box.minX), (plot.height - 4) / (box.maxY - box.minY)));
    const cx = plot.x + (plot.width - (box.maxX + box.minX) * outer) / 2 + (r.offsetX ?? 0);
    const cy = plot.y + (plot.height - (box.maxY + box.minY) * outer) / 2 + (r.offsetY ?? 0);
    const hollow = fraction(typeof r.hollow?.size === 'number' ? `${r.hollow.size}%` : r.hollow?.size, gauge ? 0.8 : 0.45);
    const inner = outer * hollow;
    const gap = r.trackGap ?? 4;
    const band = visible.length > 0 ? Math.max(2, (outer - inner - gap * (visible.length - 1)) / visible.length) : 0;

    const format = chartFormatter(o.dataLabels?.formatter, '{percent|percent:0}', locale);
    const valueFormat = chartFormatter(o.tooltip?.y?.formatter, '{value}', locale);
    const labelSize = sizeToPx(o.dataLabels?.style?.fontSize, font.dataLabel);
    const count = input.series.length;
    const slices: SceneSlice[] = [];
    const tracks: string[] = [];
    const data: SceneDatum[] = [];

    visible.forEach((s, k) => {
        const value = s.points.reduce((sum, p) => sum + (p.y ?? 0), 0);
        const share = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
        const ringOuter = outer - k * (band + gap);
        const ringInner = ringOuter - band;
        const end = startAngle + share * span;
        const color = seriesColor(o, s, s.index, count);
        tracks.push(sectorPath(cx, cy, ringInner, ringOuter, startAngle, endAngle));
        const path = sectorPath(cx, cy, ringInner, ringOuter, startAngle, end);
        const mid = (startAngle + end) / 2;
        slices.push({
            series: s.index,
            path,
            hoverPath: sectorPath(cx, cy, ringInner - 1, ringOuter + 1, startAngle, end),
            selectedPath: path,
            color,
            value,
            percent: share * 100,
            start: startAngle,
            end,
            mid,
            inner: ringInner,
            outer: ringOuter,
            offset: [0, 0],
            // A ring's name goes beside it rather than on it: the band is thin
            // and the text would run off both edges.
            label:
                o.dataLabels?.enabled && !gauge && band > labelSize
                    ? {
                          ...(() => {
                              const [lx, ly] = polar(cx, cy, (ringInner + ringOuter) / 2, startAngle - 4);
                              return { x: lx, y: ly };
                          })(),
                          text: format(value, { seriesIndex: s.index, dataPointIndex: 0, seriesName: s.name, percent: share * 100 }),
                          anchor: 'end' as const,
                          baseline: 'middle' as const,
                          style: { ...o.dataLabels?.style, fontSize: `${labelSize}px` }
                      }
                    : undefined
        });
        const [px, py] = polar(cx, cy, (ringInner + ringOuter) / 2, end === startAngle ? startAngle : (startAngle + end) / 2);
        data.push({
            series: s.index,
            index: 0,
            column: k,
            x: px,
            y: py,
            r: band / 2,
            value,
            text: valueFormat(value, { seriesIndex: s.index, dataPointIndex: 0, seriesName: s.name, percent: share * 100 }),
            label: s.name,
            color
        });
    });

    return {
        ...emptyScene(input),
        empty: false,
        plot,
        pie: { kind: 'pie', cx, cy, inner, outer, slices, tracks, total: slices.reduce((sum, sl) => sum + sl.value, 0), donut: true, background: r.hollow?.background, strokeWidth: typeof o.stroke?.width === 'number' && o.stroke.show !== false ? o.stroke.width : 0 },
        columns: visible.map((s, k) => ({ index: k, pos: 0, half: 0, label: s.name, value: data[k]?.value ?? 0, visible: true })),
        data,
        visibleSeries: visible.map((s) => s.index)
    };
}
