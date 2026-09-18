import { emptyScene, fonts, fraction, measurer, seriesColor, sizeToPx, titles } from './common';
import { chartFormatter } from './format';
import { polar, sectorPath } from './geometry';
import type { ChartScene, SceneDatum, SceneInput, SceneSlice } from './scene';

export interface SunburstNode {
    name: string;
    /** Its own value; a branch takes the total of its children instead. */
    value: number;
    children: SunburstNode[];
    /** Which series and point it came from, so the tooltip can name it. */
    series: number;
    index: number;
    color?: string;
}

export interface SunburstArc extends SunburstNode {
    depth: number;
    start: number;
    end: number;
    total: number;
}

/**
 * Lays a tree out as rings: the root's children fill the circle, and every
 * node's children divide the angle their parent occupies. Depth is the ring,
 * and the angle is the share — so a node is always inside the wedge of the
 * one it belongs to, which is the whole point of the picture.
 */
export function sunburstArcs(roots: SunburstNode[], startAngle = 0, span = 360): SunburstArc[] {
    const total = (node: SunburstNode): number => (node.children.length ? node.children.reduce((sum, c) => sum + total(c), 0) : Math.max(0, node.value));
    const out: SunburstArc[] = [];
    const walk = (nodes: SunburstNode[], from: number, width: number, depth: number) => {
        const sum = nodes.reduce((a, n) => a + total(n), 0);
        if (!(sum > 0) || width <= 0) return;
        let angle = from;
        for (const node of nodes) {
            const value = total(node);
            const sweep = (value / sum) * width;
            out.push({ ...node, depth, start: angle, end: angle + sweep, total: value });
            if (node.children.length) walk(node.children, angle, sweep, depth + 1);
            angle += sweep;
        }
    };
    walk(roots, startAngle, span, 0);
    return out;
}

/**
 * The tree a chart's series describe. Points that name a `parent` build a tree
 * of any depth; without one, each series is a branch and its points are its
 * leaves, which is the same shape a treemap is given.
 */
export function sunburstTree(input: SceneInput): SunburstNode[] {
    const visible = input.series.filter((s) => !input.hidden.has(s.index));
    const named = visible.some((s) => s.points.some((p) => p.parent));
    if (!named) {
        return visible.map((s) => ({
            name: s.name,
            value: 0,
            series: s.index,
            index: 0,
            children: s.points.filter((p) => p.y !== null && p.y > 0).map((p) => ({ name: String(p.x), value: p.y as number, series: s.index, index: p.index, children: [], color: p.fillColor }))
        }));
    }
    const nodes = new Map<string, SunburstNode>();
    const order: string[] = [];
    for (const s of visible)
        for (const p of s.points) {
            const name = String(p.x);
            if (!nodes.has(name)) {
                nodes.set(name, { name, value: p.y ?? 0, series: s.index, index: p.index, children: [], color: p.fillColor });
                order.push(name);
            }
        }
    const claimed = new Set<SunburstNode>();
    for (const s of visible)
        for (const p of s.points) {
            if (!p.parent) continue;
            const node = nodes.get(String(p.x))!;
            // A parent named but never listed is a node in its own right, so
            // the tree survives data that only names its leaves.
            let parent = nodes.get(p.parent);
            if (!parent) {
                parent = { name: p.parent, value: 0, series: s.index, index: -1, children: [] };
                nodes.set(p.parent, parent);
                order.push(p.parent);
            }
            if (parent === node) continue;
            parent.children.push(node);
            claimed.add(node);
        }
    // What nothing claims as a child is a root, in the order it was given.
    return order.map((name) => nodes.get(name)!).filter((n) => !claimed.has(n));
}

/**
 * A sunburst: a pie of several rings, each one a level of a tree. It answers
 * the question a pie cannot — what a slice is made of — without leaving the
 * circle.
 */
export function buildSunburst(input: SceneInput): ChartScene {
    const { options: o, locale } = input;
    const base = emptyScene(input);
    const roots = sunburstTree(input);
    const p = o.plotOptions?.pie ?? {};
    const startAngle = p.startAngle ?? 0;
    const span = (p.endAngle ?? 360) - startAngle;
    const arcs = sunburstArcs(roots, startAngle, span);
    if (!arcs.length) return base;

    const t = titles(input);
    const font = fonts(input);
    const measure = measurer(input);
    const plot = { x: 0, y: t.height, width: input.width, height: Math.max(10, input.height - t.height) };
    const outer = Math.max(6, Math.min(plot.width, plot.height) / 2 - 2);
    const cx = plot.x + plot.width / 2;
    const cy = plot.y + plot.height / 2;
    const depth = Math.max(...arcs.map((a) => a.depth)) + 1;
    const inner = outer * fraction(o.plotOptions?.sunburst?.hollow, 0.25);
    const band = (outer - inner) / depth;
    const labelSize = sizeToPx(o.dataLabels?.style?.fontSize, font.dataLabel);
    const format = chartFormatter(o.dataLabels?.formatter, '{seriesName}', locale);
    const valueFormat = chartFormatter(o.tooltip?.y?.formatter, '{value}', locale);
    const grandTotal = arcs.filter((a) => a.depth === 0).reduce((sum, a) => sum + a.total, 0);
    const firstRing = arcs.filter((a) => a.depth === 0);

    const slices: SceneSlice[] = [];
    const data: SceneDatum[] = [];
    arcs.forEach((arc, k) => {
        const r0 = inner + arc.depth * band;
        const r1 = r0 + band;
        // A child takes its branch's colour, lighter the further out it is, so
        // a wedge reads as one family rather than as a row of strangers.
        const branch = firstRing.findIndex((a) => arc.start >= a.start && arc.start < a.end);
        const root = seriesColor(o, undefined, Math.max(0, branch), Math.max(1, firstRing.length));
        const mix = arc.depth === 0 ? 100 : Math.max(35, 100 - arc.depth * 22);
        const color = arc.color ?? (mix >= 100 ? root : `color-mix(in srgb, ${root} ${mix}%, var(--vt-chart-heatmap-base))`);
        const mid = (arc.start + arc.end) / 2;
        const path = sectorPath(cx, cy, r0, r1, arc.start, arc.end);
        const context = { seriesIndex: arc.series, dataPointIndex: arc.index, seriesName: arc.name, percent: (arc.total / (grandTotal || 1)) * 100 };
        const text = format(arc.total, context);
        const [lx, ly] = polar(cx, cy, (r0 + r1) / 2, mid);
        /*
         * A name runs outwards along the radius where the ring is deep enough
         * to hold it, and around the arc where the wedge is wide enough — an
         * inner ring is usually the second of those. What fits neither way is
         * left to the tooltip rather than clipped.
         */
        const arcLength = ((Math.abs(arc.end - arc.start) * Math.PI) / 180) * ((r0 + r1) / 2);
        const room = measure(text, labelSize) + 8;
        const radial = band > room && arcLength > labelSize * 1.2;
        const along = !radial && arcLength > room && band > labelSize * 1.3;
        // Upright either way: text that would read upside down is turned over.
        const upright = mid > 180 ? mid + 90 : mid - 90;
        const tangential = mid > 90 && mid < 270 ? mid + 180 : mid;
        slices.push({
            series: arc.series,
            path,
            hoverPath: sectorPath(cx, cy, r0, r1 + 3, arc.start, arc.end),
            selectedPath: path,
            color,
            value: arc.total,
            percent: context.percent,
            start: arc.start,
            end: arc.end,
            mid,
            inner: r0,
            outer: r1,
            offset: [0, 0],
            label:
                o.dataLabels?.enabled !== false && (radial || along)
                    ? { x: lx, y: ly, text, anchor: 'middle', baseline: 'middle', rotate: radial ? upright : tangential, style: { ...o.dataLabels?.style, fontSize: `${labelSize}px` }, onFill: true }
                    : undefined
        });
        data.push({ series: arc.series, index: k, column: k, x: lx, y: ly, value: arc.total, text: valueFormat(arc.total, context), label: arc.name, color });
    });

    return {
        ...base,
        empty: false,
        plot,
        pie: { kind: 'pie', cx, cy, inner, outer, slices, total: grandTotal, donut: inner > 0, strokeWidth: o.stroke?.show === false ? 0 : typeof o.stroke?.width === 'number' ? o.stroke.width : 1 },
        columns: arcs.map((a, k) => ({ index: k, pos: 0, half: 0, label: a.name, value: a.total, visible: true })),
        data,
        visibleSeries: [...new Set(arcs.map((a) => a.series))]
    };
}
