import { describe, expect, it } from 'vitest';
import { buildChartScene } from './build';
import { resolveChartOptions } from './options';
import { normalizeSeries } from './series';
import { linearFit, trendValues } from './trend';
import { en } from '@vitral/core';

describe('a trend', () => {
    it('fits a straight line by least squares, over the points that have a value', () => {
        expect(linearFit([0, 1, 2, 3], [1, 3, 5, 7])).toEqual({ slope: 2, intercept: 1 });
        expect(linearFit([0, 1, 2], [1, null, 5])).toEqual({ slope: 2, intercept: 1 });
        expect(linearFit([0], [1])).toBeNull();
        expect(trendValues([0, 1, 2], [2, 2, 2])).toEqual([2, 2, 2]);
    });

    it('fits an exponential through the logarithms, and averages a moving window', () => {
        const grown = trendValues([0, 1, 2, 3], [1, 2, 4, 8], 'exponential');
        grown.forEach((y, i) => expect(y).toBeCloseTo(2 ** i));
        expect(trendValues([0, 1, 2, 3], [1, 2, 3, null], 'movingAverage', 2)).toEqual([null, 1.5, 2.5, null]);
    });
});

describe('a series with a trendline', () => {
    const series = [
        { name: 'Sales', data: [10, 14, 12, 20, 24], trendline: true },
        { name: 'Costs', data: [8, 9, 9, 11, 12] }
    ];

    it('gains a line of its own after every series given, named for it', () => {
        const out = normalizeSeries(series, 'bar', [], (name) => `${name} (trend)`);
        expect(out.map((s) => s.name)).toEqual(['Sales', 'Costs', 'Sales (trend)']);
        const trend = out[2]!;
        expect(trend).toMatchObject({ index: 2, type: 'line', trendOf: 0, stroke: { width: 2, dash: 5 } });
        expect(trend.points.map((p) => p.y)).toEqual([9.2, 12.6, 16, 19.4, 22.8]);
    });

    it('is fitted along x when x is a number, point for point in order', () => {
        const [, trend] = normalizeSeries([{ name: 'Height', data: [[3, 30], [1, 10], [2, 20]], trendline: { type: 'linear', name: 'Fit', dashArray: 0 } }], 'scatter');
        expect(trend!.name).toBe('Fit');
        expect(trend!.points.map((p) => [p.x, p.y])).toEqual([[1, 10], [2, 20], [3, 30]]);
        expect(trend!.stroke!.dash).toBe(0);
    });

    it('is drawn as a dashed line over the bars in a colour of its own, without markers, and never stacked', () => {
        const input = normalizeSeries(series, 'bar');
        const scene = buildChartScene({
            type: 'bar',
            series: input,
            hidden: new Set(),
            options: resolveChartOptions({ chart: { stacked: true }, markers: { size: 4 }, colors: ['red', 'blue', 'green'] }, 'bar'),
            width: 400,
            height: 240,
            locale: en
        });
        const line = scene.marks.find((m) => m.kind === 'line' && m.series === 2) as { dash: number; color: string; markers: unknown[] } | undefined;
        expect(line).toBeDefined();
        expect(line!.dash).toBe(5);
        // Third in the palette, after the two series; a colour of its own wins over that.
        expect(line!.color).toBe('green');
        const own = normalizeSeries([{ name: 'A', data: [1, 2, 3], trendline: { color: 'purple' } }], 'line');
        expect(own[1]!.color).toBe('purple');
        expect(line!.markers).toHaveLength(0);
    });
});
