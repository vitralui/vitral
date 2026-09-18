import { describe, expect, it } from 'vitest';
import type { ChartPoint } from './series';
import { boxStats, histogramBins, rangeSpans, streamBaseline, waterfallSpans } from './spans';

const pts = (...ys: (number | null)[]): ChartPoint[] => ys.map((y, index) => ({ index, x: index, y }));

describe('a waterfall', () => {
    it('starts each bar where the one before it ended', () => {
        expect(waterfallSpans(pts(100, -30, 20, -10))).toEqual([
            { from: 0, to: 100, value: 100 },
            { from: 100, to: 70, value: -30 },
            { from: 70, to: 90, value: 20 },
            { from: 90, to: 80, value: -10 }
        ]);
    });

    it('draws a subtotal from zero, and carries on from it', () => {
        const spans = waterfallSpans(pts(100, -40, 0, 10), new Set([2]));
        expect(spans[2]).toEqual({ from: 0, to: 60, value: 60 });
        // The running total is untouched by the subtotal it just drew.
        expect(spans[3]).toEqual({ from: 60, to: 70, value: 10 });
        // A subtotal is the sum whether or not the data repeats it, so the
        // closing column is usually written as a gap.
        expect(waterfallSpans(pts(100, -40, null), new Set([2]))[2]).toEqual({ from: 0, to: 60, value: 60 });
    });

    it('steps over a gap without losing its place', () => {
        const spans = waterfallSpans(pts(50, null, 25));
        expect(spans[1]).toEqual({ from: 50, to: 50, value: null });
        expect(spans[2]).toEqual({ from: 50, to: 75, value: 25 });
    });
});

describe('a range', () => {
    it('is the two numbers the point carries, low to high', () => {
        const points: ChartPoint[] = [
            { index: 0, x: 0, y: 8, range: [3, 8] },
            { index: 1, x: 1, y: 2, range: [2, 9] }
        ];
        expect(rangeSpans(points)).toEqual([
            { from: 3, to: 8, value: 5 },
            { from: 2, to: 9, value: 7 }
        ]);
        expect(rangeSpans(pts(4))).toEqual([{ from: 0, to: 0, value: null }]);
    });
});

describe('histogram bins', () => {
    it('counts every value once, and closes the last bin at both ends', () => {
        const values = [1, 2, 2, 3, 3, 3, 4, 4, 5];
        const bins = histogramBins(values, 4);
        expect(bins).toHaveLength(4);
        expect(bins.reduce((n, b) => n + b.count, 0)).toBe(values.length);
        // The largest value belongs to the last bin, not to one past the end.
        expect(bins[bins.length - 1]!.count).toBeGreaterThan(0);
        expect(bins[0]!.from).toBe(1);
        expect(bins[bins.length - 1]!.to).toBe(5);
    });

    it('chooses a count by Sturges, then rounds the width it implies', () => {
        // Sturges asks for eight bins across 0–99, which is 12.375 wide; a
        // width of 10 is what a reader can hold, so ten bins is what it draws.
        const bins = histogramBins(Array.from({ length: 100 }, (_, i) => i));
        expect(bins).toHaveLength(10);
        expect(bins.map((b) => b.from).slice(0, 3)).toEqual([0, 10, 20]);
        expect(histogramBins([1, 2, 3, 4, 5, 6, 7, 8])).toHaveLength(4);
    });

    it('puts the edges on round numbers, not on the smallest reading', () => {
        const bins = histogramBins([38, 44, 51, 67, 73, 88, 91, 119, 134], 6);
        expect(bins[0]!.from).toBe(20);
        expect(bins.map((b) => b.to - b.from).every((w) => w === 20)).toBe(true);
        expect(bins[bins.length - 1]!.to).toBe(140);
        expect(bins.reduce((n, b) => n + b.count, 0)).toBe(9);
    });

    it('survives one value, all the same value, and none at all', () => {
        expect(histogramBins([])).toEqual([]);
        expect(histogramBins([5])).toEqual([{ from: 5, to: 5, mid: 5, count: 1 }]);
        expect(histogramBins([7, 7, 7])).toEqual([{ from: 7, to: 7, mid: 7, count: 3 }]);
    });
});

describe('box statistics', () => {
    it('are the quantiles another tool would give', () => {
        // R's type 7 and NumPy's default, which is what a reader will compare against.
        expect(boxStats([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
        expect(boxStats([1, 2, 3, 4])).toEqual([1, 1.75, 2.5, 3.25, 4]);
        expect(boxStats([6])).toEqual([6, 6, 6, 6, 6]);
        expect(boxStats([])).toBeNull();
    });

    it('does not care what order the readings arrived in', () => {
        expect(boxStats([5, 1, 4, 2, 3])).toEqual(boxStats([1, 2, 3, 4, 5]));
    });
});

describe('a stream baseline', () => {
    const rows = [
        [1, 3, 5, 3],
        [2, 2, 6, 2]
    ];

    it('centres the stack when asked for a silhouette', () => {
        expect(streamBaseline(rows, 'silhouette')).toEqual([-1.5, -2.5, -5.5, -2.5]);
    });

    it('stands on the axis when asked for zero', () => {
        expect(streamBaseline(rows, 'zero')).toEqual([0, 0, 0, 0]);
    });

    it('moves the baseline so the layers share the movement', () => {
        const base = streamBaseline(rows);
        expect(base[0]).toBe(0);
        // The stack grows towards the middle, so its floor drops away.
        expect(base[2]).toBeLessThan(base[1]!);
        // And the widest column is the one furthest from where it started.
        expect(Math.abs(base[2]!)).toBeGreaterThan(Math.abs(base[1]!));
        expect(base.every((n) => Number.isFinite(n))).toBe(true);
    });

    it('survives a column of nothing at all', () => {
        expect(streamBaseline([[0, 0], [0, 0]])).toEqual([0, 0]);
        expect(streamBaseline([])).toEqual([]);
    });
});
