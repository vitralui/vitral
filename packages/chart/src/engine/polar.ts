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
    return pie.slices.findIndex((s) => angle >= Math.min(s.start, s.end) && angle < Math.max(s.start, s.end));
}

/**
 * A radar: one spoke per category from twelve o'clock clockwise, each series
 * a polygon. The scale always starts at zero — a radar is read as an area,
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
