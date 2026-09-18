import type { ChartCurve, ChartMarkerShape } from './types';

/** SVG path data for chart marks. Coordinates are pixels; `null` breaks a line. */

export type Pt = [x: number, y: number];

const f = (n: number) => (Math.round(n * 100) / 100).toString();

/** Splits a list at its nulls into runs of points. */
export function runs(points: (Pt | null)[]): Pt[][] {
    const out: Pt[][] = [];
    let current: Pt[] = [];
    for (const p of points) {
        if (p) current.push(p);
        else if (current.length) {
            out.push(current);
            current = [];
        }
    }
    if (current.length) out.push(current);
    return out;
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson): smooth, and never
 * overshooting between samples. A smoothed line that dips below zero between
 * two positive points would be inventing data.
 */
function monotone(points: Pt[], vertical = false): string {
    const P = vertical ? points.map(([x, y]) => [y, x] as Pt) : points;
    const n = P.length;
    if (n < 3) return straight(points);
    const dx: number[] = [];
    const slope: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        dx[i] = P[i + 1]![0] - P[i]![0];
        slope[i] = dx[i] === 0 ? 0 : (P[i + 1]![1] - P[i]![1]) / dx[i]!;
    }
    const tangent: number[] = [slope[0]!];
    for (let i = 1; i < n - 1; i++) {
        const a = slope[i - 1]!;
        const b = slope[i]!;
        if (a * b <= 0) tangent[i] = 0;
        else {
            const w1 = 2 * dx[i]! + dx[i - 1]!;
            const w2 = dx[i]! + 2 * dx[i - 1]!;
            tangent[i] = (w1 + w2) / (w1 / a + w2 / b);
        }
    }
    tangent[n - 1] = slope[n - 2]!;
    const out = (x: number, y: number) => (vertical ? `${f(y)},${f(x)}` : `${f(x)},${f(y)}`);
    let d = `M${out(P[0]![0], P[0]![1])}`;
    for (let i = 0; i < n - 1; i++) {
        const h = dx[i]! / 3;
        const [x0, y0] = P[i]!;
        const [x1, y1] = P[i + 1]!;
        d += `C${out(x0 + h, y0 + tangent[i]! * h)} ${out(x1 - h, y1 - tangent[i + 1]! * h)} ${out(x1, y1)}`;
    }
    return d;
}

function straight(points: Pt[]): string {
    return points.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join('');
}

/** Steps: level until the next sample, then straight to it, along x or along y for a horizontal chart. */
function stepped(points: Pt[], vertical = false): string {
    let d = `M${f(points[0]![0])},${f(points[0]![1])}`;
    for (let i = 1; i < points.length; i++) {
        const [x, y] = points[i]!;
        const [px, py] = points[i - 1]!;
        d += vertical ? `L${f(px)},${f(y)}L${f(x)},${f(y)}` : `L${f(x)},${f(py)}L${f(x)},${f(y)}`;
    }
    return d;
}

/** A path through one run of points. `vertical` interpolates along y (a horizontal chart). */
export function curvePath(points: Pt[], curve: ChartCurve = 'straight', vertical = false): string {
    if (!points.length) return '';
    if (points.length === 1) return `M${f(points[0]![0])},${f(points[0]![1])}`;
    if (curve === 'smooth' || curve === 'monotoneCubic') return monotone(points, vertical);
    if (curve === 'stepline') return stepped(points, vertical);
    return straight(points);
}

/** A line with gaps where values are missing. */
export function linePath(points: (Pt | null)[], curve: ChartCurve = 'straight'): string {
    return runs(points)
        .map((run) => curvePath(run, curve))
        .join('');
}

/**
 * The area under (or between) lines: each run of `top` closed along `base`,
 * which is a y value or, for a stacked area, the line beneath.
 */
export function areaPath(top: (Pt | null)[], base: number | (Pt | null)[], curve: ChartCurve = 'straight'): string {
    const parts: string[] = [];
    let run: { top: Pt; base: Pt }[] = [];
    const flush = () => {
        if (!run.length) return;
        const upper = curvePath(
            run.map((r) => r.top),
            curve
        );
        const lower = curvePath(
            run.map((r) => r.base).reverse(),
            curve
        ).replace(/^M/, 'L');
        parts.push(`${upper}${lower}Z`);
        run = [];
    };
    top.forEach((p, i) => {
        const b = typeof base === 'number' ? (p ? ([p[0], base] as Pt) : null) : base[i];
        if (p && b) run.push({ top: p, base: b });
        else flush();
    });
    flush();
    return parts.join('');
}

export interface Corners {
    tl?: number;
    tr?: number;
    br?: number;
    bl?: number;
}

/** A rectangle with its own radius at each corner, clamped to fit. */
export function rectPath(x: number, y: number, w: number, h: number, r: Corners = {}): string {
    if (w < 0) [x, w] = [x + w, -w];
    if (h < 0) [y, h] = [y + h, -h];
    const max = Math.min(w, h) / 2;
    const c = (v = 0) => Math.max(0, Math.min(v, max));
    const tl = c(r.tl);
    const tr = c(r.tr);
    const br = c(r.br);
    const bl = c(r.bl);
    return (
        `M${f(x + tl)},${f(y)}H${f(x + w - tr)}` +
        (tr ? `A${f(tr)},${f(tr)} 0 0 1 ${f(x + w)},${f(y + tr)}` : '') +
        `V${f(y + h - br)}` +
        (br ? `A${f(br)},${f(br)} 0 0 1 ${f(x + w - br)},${f(y + h)}` : '') +
        `H${f(x + bl)}` +
        (bl ? `A${f(bl)},${f(bl)} 0 0 1 ${f(x)},${f(y + h - bl)}` : '') +
        `V${f(y + tl)}` +
        (tl ? `A${f(tl)},${f(tl)} 0 0 1 ${f(x + tl)},${f(y)}` : '') +
        'Z'
    );
}

/** A point at `angle` degrees (0 = twelve o'clock, clockwise) and `radius` from the centre. */
export function polar(cx: number, cy: number, radius: number, angle: number): Pt {
    const a = ((angle - 90) * Math.PI) / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
}

/** A ring segment (or a pie wedge when `inner` is 0) from `start` to `end` degrees. */
export function sectorPath(cx: number, cy: number, inner: number, outer: number, start: number, end: number): string {
    const sweep = Math.min(359.999, Math.max(0, end - start));
    const stop = start + sweep;
    const large = sweep > 180 ? 1 : 0;
    const [ox0, oy0] = polar(cx, cy, outer, start);
    const [ox1, oy1] = polar(cx, cy, outer, stop);
    let d = `M${f(ox0)},${f(oy0)}A${f(outer)},${f(outer)} 0 ${large} 1 ${f(ox1)},${f(oy1)}`;
    if (inner > 0) {
        const [ix1, iy1] = polar(cx, cy, inner, stop);
        const [ix0, iy0] = polar(cx, cy, inner, start);
        d += `L${f(ix1)},${f(iy1)}A${f(inner)},${f(inner)} 0 ${large} 0 ${f(ix0)},${f(iy0)}Z`;
    } else d += `L${f(cx)},${f(cy)}Z`;
    return d;
}

/** A closed polygon through points. */
export function polygonPath(points: Pt[]): string {
    return points.length ? `${straight(points)}Z` : '';
}

/** A marker of `size` (its diameter) centred on a point. */
export function markerPath(shape: ChartMarkerShape, x: number, y: number, size: number): string {
    const r = size / 2;
    switch (shape) {
        case 'square':
            return rectPath(x - r, y - r, size, size);
        case 'diamond':
            return `M${f(x)},${f(y - r * 1.25)}L${f(x + r * 1.25)},${f(y)}L${f(x)},${f(y + r * 1.25)}L${f(x - r * 1.25)},${f(y)}Z`;
        case 'triangle':
            return `M${f(x)},${f(y - r * 1.2)}L${f(x + r * 1.1)},${f(y + r * 0.8)}L${f(x - r * 1.1)},${f(y + r * 0.8)}Z`;
        default:
            return `M${f(x - r)},${f(y)}a${f(r)},${f(r)} 0 1 0 ${f(size)},0a${f(r)},${f(r)} 0 1 0 ${f(-size)},0`;
    }
}
