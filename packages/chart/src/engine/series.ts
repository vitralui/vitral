import type { ChartPointInput, ChartSeries, ChartSeriesInput, ChartType } from './types';

/** One data point, whatever shape it came in. */
export interface ChartPoint {
    /** Its index in the series. */
    index: number;
    /** A category, a number or a time (ms); `index` stands in when the input had none. */
    x: number | string;
    y: number | null;
    z?: number;
    ohlc?: [open: number, high: number, low: number, close: number];
    fillColor?: string;
}

export interface NormalizedSeries {
    index: number;
    name: string;
    type?: ChartType;
    color?: string;
    group?: string;
    hidden: boolean;
    points: ChartPoint[];
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function toX(value: unknown, fallback: number): number | string {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number' || typeof value === 'string') return value;
    return fallback;
}

function point(input: ChartPointInput, index: number): ChartPoint {
    if (input === null || typeof input === 'number') return { index, x: index, y: isNum(input) ? input : null };
    if (Array.isArray(input)) {
        if (input.length >= 5) {
            const [x, o, h, l, c] = input as [number | string, number, number, number, number];
            return { index, x: toX(x, index), y: c, ohlc: [o, Math.max(h, l), Math.min(h, l), c] };
        }
        return { index, x: toX(input[0], index), y: isNum(input[1]) ? input[1] : null };
    }
    const y = input.y;
    if (Array.isArray(y)) {
        if (y.length >= 4) {
            const [o, h, l, c] = y as number[];
            return { index, x: toX(input.x, index), y: c!, ohlc: [o!, Math.max(h!, l!), Math.min(h!, l!), c!], fillColor: input.fillColor };
        }
        return { index, x: toX(input.x, index), y: isNum(y[1]) ? y[1] : null, fillColor: input.fillColor };
    }
    return { index, x: toX(input.x, index), y: isNum(y) ? y : null, z: isNum(input.z) ? input.z : undefined, fillColor: input.fillColor };
}

/**
 * Every accepted series shape as one: a bare array of numbers (a pie's
 * slices, named by `labels`) becomes one series per value for a pie or a
 * donut, and a single series otherwise.
 */
export function normalizeSeries(series: ChartSeries | null | undefined, type: ChartType, labels: string[] = []): NormalizedSeries[] {
    if (!series || !series.length) return [];
    if (typeof series[0] === 'number' || series[0] === null) {
        const values = series as number[];
        if (type === 'pie' || type === 'donut') {
            return values.map((v, i) => ({ index: i, name: labels[i] ?? String(i + 1), hidden: false, points: [{ index: 0, x: 0, y: isNum(v) ? v : null }] }));
        }
        return [{ index: 0, name: '', hidden: false, points: values.map((v, i) => point(v, i)) }];
    }
    return (series as ChartSeriesInput[]).map((s, i) => ({
        index: i,
        name: s.name ?? '',
        type: s.type,
        color: s.color,
        group: s.group,
        hidden: !!s.hidden,
        points: (s.data ?? []).map((p, j) => point(p, j))
    }));
}

/** What the x values are: all numbers (or dates), or categories. */
export function inferXType(series: NormalizedSeries[], categories?: unknown[]): 'category' | 'numeric' {
    if (categories?.length) return 'category';
    const xs = series.flatMap((s) => s.points.map((p) => p.x));
    return xs.length && xs.every((x) => typeof x === 'number') ? 'numeric' : 'category';
}

/**
 * The categories an index-based chart lays out: the given ones, or the
 * distinct x values of every series in order of appearance, or indices.
 */
export function categoriesOf(series: NormalizedSeries[], categories?: (string | number)[]): (string | number)[] {
    if (categories?.length) return categories;
    const seen = new Set<string | number>();
    let explicit = false;
    for (const s of series)
        for (const p of s.points) {
            if (p.x !== p.index) explicit = true;
            seen.add(p.x);
        }
    if (explicit) return [...seen];
    const length = Math.max(0, ...series.map((s) => s.points.length));
    return Array.from({ length }, (_, i) => i + 1);
}

/** Where each series' point sits in the category list: by x when points carry one, by index otherwise. */
export function categoryIndex(series: NormalizedSeries, categories: (string | number)[], explicit: boolean): (ChartPoint | undefined)[] {
    const out: (ChartPoint | undefined)[] = new Array(categories.length);
    if (!explicit) {
        series.points.forEach((p, i) => {
            if (i < out.length) out[i] = p;
        });
        return out;
    }
    const position = new Map(categories.map((c, i) => [c, i]));
    for (const p of series.points) {
        const i = position.get(p.x) ?? (typeof p.x === 'number' && p.x === p.index ? p.index : undefined);
        if (i !== undefined && i < out.length) out[i] = p;
    }
    return out;
}

export interface StackedValue {
    /** Where the segment starts and ends. */
    from: number;
    to: number;
    value: number | null;
}

/**
 * Stacks series category by category. Positive values stack up from zero
 * and negative ones down, separately, so a mixed stack never overlaps
 * itself; `percent` scales each category to 100. Series in different
 * `groups` stack separately.
 */
export function stackValues(values: (number | null)[][], options: { percent?: boolean; groups?: (string | undefined)[] } = {}): StackedValue[][] {
    const out: StackedValue[][] = values.map((row) => row.map((v) => ({ from: 0, to: 0, value: v })));
    const length = Math.max(0, ...values.map((row) => row.length));
    const groups = options.groups ?? values.map(() => undefined);
    const keys = [...new Set(groups)];
    for (const key of keys) {
        const members = values.map((_, i) => i).filter((i) => groups[i] === key);
        for (let c = 0; c < length; c++) {
            let total = 0;
            if (options.percent) for (const s of members) total += Math.abs(values[s]![c] ?? 0);
            let up = 0;
            let down = 0;
            for (const s of members) {
                const raw = values[s]![c];
                if (raw === null || raw === undefined) {
                    out[s]![c] = { from: up, to: up, value: null };
                    continue;
                }
                const v = options.percent ? (total ? (raw / total) * 100 : 0) : raw;
                if (v >= 0) {
                    out[s]![c] = { from: up, to: up + v, value: raw };
                    up += v;
                } else {
                    out[s]![c] = { from: down, to: down + v, value: raw };
                    down += v;
                }
            }
        }
    }
    return out;
}

/** The extent of a list of numbers, ignoring nulls; null when there are none. */
export function extent(values: Iterable<number | null | undefined>): [number, number] | null {
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of values) {
        if (v === null || v === undefined || !Number.isFinite(v)) continue;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
    }
    return lo <= hi ? [lo, hi] : null;
}
