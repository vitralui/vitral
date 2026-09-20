import type { ChartScene, SceneDatum } from './scene';

/**
 * What the pointer and the keyboard do to a chart, without the DOM: finding
 * the point under the pointer, and moving a zoom window. A window is two
 * numbers in the x domain; it slides rather than squashes at the ends, so
 * panning into an edge never turns into a zoom out.
 */

/** Whether a pixel is on the plot, rather than over the axes, their labels, the legend or the title. */
export function insidePlot(scene: ChartScene, x: number, y: number, pad = 1): boolean {
    const { plot } = scene;
    return x >= plot.x - pad && x <= plot.x + plot.width + pad && y >= plot.y - pad && y <= plot.y + plot.height + pad;
}

/**
 * The marks are clipped to the plot plus this margin (a marker on the edge
 * shows whole); anything further out, scrolled away by a zoom, is not on
 * screen, so it is not under the pointer either.
 */
const CLIP_MARGIN = 6;

/** The column nearest a pixel along the category axis, or -1 outside the plot. */
export function columnAt(scene: ChartScene, x: number, y: number): number {
    if (!insidePlot(scene, x, y)) return -1;
    const along = scene.horizontal ? y : x;
    let best = -1;
    let distance = Infinity;
    for (const column of scene.columns) {
        if (!column.visible) continue;
        const d = Math.abs(column.pos - along);
        if (d < distance) {
            distance = d;
            best = column.index;
        }
    }
    return best;
}

/** The visible data point nearest a pixel on the plot, within `radius` (or its own hit radius). */
export function datumAt(scene: ChartScene, x: number, y: number, radius = 16): SceneDatum | null {
    if (!insidePlot(scene, x, y)) return null;
    let best: SceneDatum | null = null;
    let distance = Infinity;
    for (const d of scene.data) {
        if (d.value === null || !insidePlot(scene, d.x, d.y, CLIP_MARGIN)) continue;
        const reach = Math.max(radius, d.r ?? 0);
        const dist = Math.hypot(d.x - x, d.y - y);
        if (dist <= reach && dist < distance) {
            distance = dist;
            best = d;
        }
    }
    return best;
}

/** The bar or cell whose rectangle holds a point on the plot. */
export function rectAt(scene: ChartScene, x: number, y: number): { series: number; index: number; column: number } | null {
    if (!insidePlot(scene, x, y)) return null;
    if (scene.heatmap) {
        const cell = scene.heatmap.cells.find((c) => x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height);
        return cell ? { series: cell.series, index: cell.index, column: cell.column } : null;
    }
    for (let m = scene.marks.length - 1; m >= 0; m--) {
        const mark = scene.marks[m]!;
        if (mark.kind !== 'bar') continue;
        const bar = mark.bars.find((b) => x >= b.x - 2 && x <= b.x + b.width + 2 && y >= b.y - 2 && y <= b.y + b.height + 2);
        if (bar) return { series: bar.series, index: bar.index, column: bar.column };
    }
    return null;
}

export type ZoomWindow = [number, number];

/**
 * The narrowest a window may get, as a fraction of the whole domain. A category
 * axis floors at one whole category: there is nothing between `Oct` and `Nov` to
 * look at, and a window narrower than a category makes the band a category
 * occupies wider than the plot it is drawn in.
 */
export function leastSpan(full: ZoomWindow, kind: 'category' | 'numeric' | 'datetime'): number {
    const total = full[1] - full[0];
    if (kind !== 'category' || total <= 0) return 0.005;
    return Math.min(1, 1 / total);
}

/** Keeps a window inside `full` and at least `minSpan` of it wide, sliding it back in rather than cutting it. */
export function normalizeWindow(window: ZoomWindow, full: ZoomWindow, minSpan = 0.01): ZoomWindow {
    const total = full[1] - full[0];
    let [a, b] = window[0] <= window[1] ? window : [window[1], window[0]];
    const least = total * minSpan;
    if (b - a < least) {
        const mid = (a + b) / 2;
        a = mid - least / 2;
        b = mid + least / 2;
    }
    const span = Math.min(b - a, total);
    if (a < full[0]) [a, b] = [full[0], full[0] + span];
    if (b > full[1]) [a, b] = [full[1] - span, full[1]];
    return [a, b];
}

/** Zooms by `factor` (below 1 zooms in) about `anchor`, which stays where it is. */
export function zoomWindow(window: ZoomWindow, full: ZoomWindow, factor: number, anchor = (window[0] + window[1]) / 2, minSpan = 0.01): ZoomWindow {
    const a = anchor - (anchor - window[0]) * factor;
    const b = anchor + (window[1] - anchor) * factor;
    return normalizeWindow([a, b], full, minSpan);
}

/** Slides a window by `delta` domain units. */
export function panWindow(window: ZoomWindow, full: ZoomWindow, delta: number): ZoomWindow {
    return normalizeWindow([window[0] + delta, window[1] + delta], full, 0);
}

/** Whether a window is the whole domain. */
export function isFullWindow(window: ZoomWindow | null | undefined, full: ZoomWindow): boolean {
    if (!window) return true;
    const eps = (full[1] - full[0]) * 1e-6;
    return window[0] <= full[0] + eps && window[1] >= full[1] - eps;
}

/**
 * Where the keyboard goes next in a chart: Left/Right along the points (or
 * columns), Up/Down across the visible series, Home/End to the ends. Returns
 * the new `{ series, column }`, or null for a key it does not use.
 */
export function chartKeyTarget(
    current: { series: number; column: number },
    key: string,
    scene: ChartScene
): { series: number; column: number } | null {
    const series = scene.visibleSeries;
    if (!series.length) return null;
    const columnsOf = (s: number) => scene.data.filter((d) => d.series === s && d.value !== null).map((d) => d.column);
    let s = series.includes(current.series) ? current.series : series[0]!;
    let cols = columnsOf(s);
    if (!cols.length) return null;
    let at = cols.indexOf(current.column);
    if (at < 0) at = 0;
    switch (key) {
        case 'ArrowRight':
            return { series: s, column: cols[Math.min(cols.length - 1, at + (current.column < 0 ? 0 : 1))]! };
        case 'ArrowLeft':
            return { series: s, column: cols[Math.max(0, at - (current.column < 0 ? 0 : 1))]! };
        case 'Home':
            return { series: s, column: cols[0]! };
        case 'End':
            return { series: s, column: cols[cols.length - 1]! };
        case 'ArrowUp':
        case 'ArrowDown': {
            const i = series.indexOf(s) + (key === 'ArrowDown' ? 1 : -1);
            if (i < 0 || i >= series.length) return { series: s, column: cols[at]! };
            s = series[i]!;
            cols = columnsOf(s);
            if (!cols.length) return { series: current.series, column: current.column };
            const nearest = cols.reduce((best, c) => (Math.abs(c - current.column) < Math.abs(best - current.column) ? c : best), cols[0]!);
            return { series: s, column: nearest };
        }
        default:
            return null;
    }
}
