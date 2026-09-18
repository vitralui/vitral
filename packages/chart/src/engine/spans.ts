import { niceNumber } from './scale';
import type { ChartPoint } from './series';

/**
 * Where a bar starts and ends when it does not start at zero.
 *
 * A waterfall, a range bar and a histogram are all bars — they differ only in
 * what decides each bar's two ends — so they are worked out here, in the same
 * shape a stack produces, and handed to the layout as if they had been stacked.
 * Everything after that (the scale, the rectangles, the labels, the tooltip and
 * the keyboard) is the bar path the chart already had.
 */

export interface Span {
    from: number;
    to: number;
    value: number | null;
}

/**
 * Each bar begins where the one before it ended. A point marked `total` is
 * drawn from zero to the running total instead: the subtotal a waterfall stops
 * at before carrying on.
 */
export function waterfallSpans(points: (ChartPoint | undefined)[], totals: ReadonlySet<number> = new Set()): Span[] {
    let running = 0;
    return points.map((p, i) => {
        // A total column is the running sum, so it is drawn whether or not the
        // data bothered to repeat the number.
        if (totals.has(i)) return { from: 0, to: running, value: running };
        if (!p || p.y === null) return { from: running, to: running, value: null };
        const from = running;
        running += p.y;
        return { from, to: running, value: p.y };
    });
}

/** The two numbers the point carries, low to high. */
export function rangeSpans(points: (ChartPoint | undefined)[]): Span[] {
    return points.map((p) => {
        if (!p || !p.range) return { from: 0, to: 0, value: null };
        return { from: p.range[0], to: p.range[1], value: p.range[1] - p.range[0] };
    });
}

export interface HistogramBin {
    from: number;
    to: number;
    count: number;
    /** The bin's middle, which is what its column is labelled with. */
    mid: number;
}

/**
 * Bins for a list of raw values. The default bin count is Sturges' rule, which
 * is what most statistics packages start from: it grows with the logarithm of
 * the sample, so a hundred readings get seven or eight bins rather than a
 * hundred columns one reading wide.
 *
 * The edges are then snapped to round numbers, because the bins are what the
 * axis is labelled with and `40–50` is read where `38.2–51.7` is decoded. A
 * bin count is therefore a request rather than a promise: the width is rounded
 * first and the count follows from it, which is what `hist()` does too.
 */
export function histogramBins(values: number[], bins?: number): HistogramBin[] {
    const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!sorted.length) return [];
    const lo = sorted[0]!;
    const hi = sorted[sorted.length - 1]!;
    const wanted = Math.max(1, Math.round(bins && bins > 0 ? bins : Math.ceil(Math.log2(sorted.length) + 1)));
    // Every value equal: one bin, so the chart draws one column rather than
    // dividing a width of zero.
    if (hi === lo) return [{ from: lo, to: lo, mid: lo, count: sorted.length }];
    const step = niceNumber((hi - lo) / wanted, true) || (hi - lo) / wanted;
    // A step of 10 puts the edges on multiples of 10; the rounding keeps
    // `0.1 * 3` from arriving as `0.30000000000000004`.
    const decimals = Math.min(20, Math.max(0, Math.ceil(-Math.log10(step) + 2)));
    const round = (n: number) => Number(n.toFixed(decimals));
    const start = Math.floor(lo / step) * step;
    const count = Math.max(1, Math.round((Math.ceil(hi / step) * step - start) / step));
    const out: HistogramBin[] = Array.from({ length: count }, (_, i) => ({ from: round(start + i * step), to: round(start + (i + 1) * step), mid: round(start + (i + 0.5) * step), count: 0 }));
    for (const v of sorted) {
        // The last bin is closed at both ends, so the largest value lands in it
        // rather than in a bin after the last one.
        const at = Math.min(count - 1, Math.floor((v - start) / step));
        out[at]!.count++;
    }
    return out;
}

/** The five numbers of a box plot, from raw readings: min, lower quartile, median, upper quartile, max. */
export function boxStats(values: number[]): [number, number, number, number, number] | null {
    const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!clean.length) return null;
    // The linear-interpolation quantile, which is what R's type 7 and NumPy's
    // default use: the one a reader is most likely to get from another tool.
    const at = (q: number) => {
        const pos = (clean.length - 1) * q;
        const lo = Math.floor(pos);
        const hi = Math.ceil(pos);
        return lo === hi ? clean[lo]! : clean[lo]! + (pos - lo) * (clean[hi]! - clean[lo]!);
    };
    return [clean[0]!, at(0.25), at(0.5), at(0.75), clean[clean.length - 1]!];
}
