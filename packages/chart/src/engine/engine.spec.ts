import { describe, expect, it } from 'vitest';
import { en, ptBR } from '@vitral/core';
import { chartCsv, chartSummary, chartTable } from './a11y';
import { buildChartScene } from './build';
import { chartFormatter, formatTemplate } from './format';
import { curvePath, linePath, rectPath, sectorPath } from './geometry';
import { chartBus, releaseInset } from './group';
import { chartKeyTarget, columnAt, datumAt, insidePlot, isFullWindow, normalizeWindow, panWindow, rectAt, zoomWindow } from './interaction';
import { sliceAt } from './polar';
import { chartOptionsSchema, defaultChartOptions, resolveChartOptions, type ChartOptionSchema } from './options';
import { niceNumber, niceScale, timeTicks } from './scale';
import { normalizeSeries, stackValues } from './series';
import type { ChartOptions, ChartSeries, ChartType } from './types';

describe('nice scales', () => {
    it('snaps steps to 1, 2 or 5 × 10ⁿ and widens the ends onto them', () => {
        expect(niceNumber(3.7, true)).toBe(5);
        expect(niceNumber(0.013, true)).toBe(0.01);
        expect(niceScale(0, 37, 5)).toMatchObject({ min: 0, max: 40, step: 10, ticks: [0, 10, 20, 30, 40] });
        expect(niceScale(-3, 7.2, 5).ticks).toEqual([-5, 0, 5, 10]);
        expect(niceScale(-3, 7.2, 8).ticks).toEqual([-4, -2, 0, 2, 4, 6, 8]);
        expect(niceScale(0.1, 0.35, 5)).toMatchObject({ ticks: [0.1, 0.2, 0.3, 0.4], decimals: 1 });
        expect(niceScale(0.1, 0.35, 10).decimals).toBe(2);
        expect(niceScale(5, 5, 4).ticks.length).toBeGreaterThan(1);
        expect(niceScale(0, 37, 5, { max: 50 }).max).toBe(50);
    });

    it('puts time ticks on calendar boundaries and names the boundary', () => {
        const days = timeTicks(new Date(2026, 0, 30, 13).getTime(), new Date(2026, 1, 3).getTime(), 6);
        expect(days.map((t) => new Date(t.value).getDate())).toEqual([31, 1, 2, 3]);
        expect(days.map((t) => t.unit)).toEqual(['day', 'month', 'day', 'day']);
        const months = timeTicks(new Date(2026, 0, 10).getTime(), new Date(2026, 6, 2).getTime(), 6);
        expect(months.every((t) => new Date(t.value).getDate() === 1 && t.unit === 'month')).toBe(true);
        const hours = timeTicks(new Date(2026, 0, 1, 9, 10).getTime(), new Date(2026, 0, 1, 15).getTime(), 6);
        expect(hours.map((t) => new Date(t.value).getHours())).toEqual([10, 11, 12, 13, 14, 15]);
    });
});

describe('templates', () => {
    it('fills fields through locale-aware presets', () => {
        expect(formatTemplate('{value} users', { value: 1234.5 }, en)).toBe('1,234.5 users');
        expect(formatTemplate('{value}', { value: 1234.5 }, ptBR)).toBe('1.234,5');
        expect(formatTemplate('{value|compact}', { value: 12500 }, en)).toBe('12.5K');
        expect(formatTemplate('{value|percent}', { value: 12.34 }, en)).toBe('12.3%');
        expect(formatTemplate('{value|ratio}', { value: 0.5 }, en)).toBe('50%');
        expect(formatTemplate('{value|fixed:2}', { value: 3 }, en)).toBe('3.00');
        expect(formatTemplate('{value|currency:BRL}', { value: 10 }, ptBR)).toMatch(/R\$\s10,00/);
        expect(formatTemplate('{value|bytes}', { value: 1536 }, en)).toBe('1.5 KB');
        expect(formatTemplate('{value|date:dd/MM HH:mm}', { value: new Date(2026, 8, 16, 9, 5).getTime() }, en)).toBe('16/09 09:05');
        expect(formatTemplate('{series}: {value} {unknown}', { series: 'A', value: 1 }, en)).toBe('A: 1 {unknown}');
    });

    it('accepts a function as an extra', () => {
        const fn = chartFormatter((v) => `#${v}`, '{value}', en);
        expect(fn(3)).toBe('#3');
        expect(chartFormatter(undefined, '{value|integer}', en)(2.6)).toBe('3');
    });
});

describe('series', () => {
    it('reads every accepted shape', () => {
        const s = normalizeSeries([{ name: 'a', data: [1, null, [2, 5], { x: 'q', y: 7, z: 3 }, { x: new Date(0), y: [1, 4, 0, 2] }] }], 'line');
        expect(s[0]!.points.map((p) => [p.x, p.y])).toEqual([
            [0, 1],
            [1, null],
            [2, 5],
            ['q', 7],
            [0, 2]
        ]);
        expect(s[0]!.points[3]!.z).toBe(3);
        expect(s[0]!.points[4]!.ohlc).toEqual([1, 4, 0, 2]);
        const pie = normalizeSeries([3, 4], 'pie', ['x', 'y']);
        expect(pie.map((p) => p.name)).toEqual(['x', 'y']);
    });

    it('stacks up and down separately, in groups, and to 100%', () => {
        const out = stackValues([
            [1, -2],
            [3, 4]
        ]);
        expect(out[1]![0]).toMatchObject({ from: 1, to: 4 });
        expect(out[1]![1]).toMatchObject({ from: 0, to: 4 });
        expect(out[0]![1]).toMatchObject({ from: 0, to: -2 });
        const pct = stackValues([[1], [3]], { percent: true });
        expect(pct[1]![0]).toMatchObject({ from: 25, to: 100 });
        const grouped = stackValues([[1], [2], [5]], { groups: ['a', 'b', 'a'] });
        expect(grouped[2]![0]).toMatchObject({ from: 1, to: 6 });
        expect(grouped[1]![0]).toMatchObject({ from: 0, to: 2 });
    });
});

describe('geometry', () => {
    it('breaks lines at gaps and never overshoots when smoothing', () => {
        expect(linePath([[0, 0], [1, 1], null, [3, 3]])).toBe('M0,0L1,1M3,3');
        const smooth = curvePath(
            [
                [0, 10],
                [10, 0],
                [20, 0],
                [30, 10]
            ],
            'smooth'
        );
        const ys = [...smooth.matchAll(/,(-?[\d.]+)/g)].map((m) => Number(m[1]));
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
        expect(curvePath([[0, 0], [10, 5]], 'stepline')).toBe('M0,0L10,0L10,5');
    });

    it('rounds only the corners asked for, and draws ring segments', () => {
        expect(rectPath(0, 0, 10, 20, { tl: 2, tr: 2 })).toBe('M2,0H8A2,2 0 0 1 10,2V20H0V2A2,2 0 0 1 2,0Z');
        expect(sectorPath(0, 0, 5, 10, 0, 90)).toMatch(/^M0,-10A10,10 0 0 1 10,0L5,0A5,5 0 0 0 0,-5Z$/);
    });
});

describe('options', () => {
    it('ships JSON-safe defaults read out of the schema', () => {
        expect(JSON.parse(JSON.stringify(defaultChartOptions))).toEqual(defaultChartOptions);
        expect(defaultChartOptions.chart?.zoom?.allowMouseWheelZoom).toBe(false);
        expect(defaultChartOptions.colors?.[0]).toBe('var(--vt-chart-1)');
        const leaves: string[] = [];
        const walk = (schema: ChartOptionSchema, path: string) => {
            if (schema.type === 'object') for (const [k, v] of Object.entries(schema.properties)) walk(v, path ? `${path}.${k}` : k);
            else leaves.push(path);
        };
        walk(chartOptionsSchema, '');
        expect(leaves).toContain('plotOptions.bar.borderRadius');
        expect(leaves).toContain('chart.brush.target');
        expect(leaves.length).toBeGreaterThan(150);
    });

    it('merges type defaults, then the options, then responsive overrides narrowest last', () => {
        const options: ChartOptions = {
            legend: { position: 'right' },
            yaxis: [{ title: { text: 'A' } }, { opposite: true }],
            responsive: [
                { breakpoint: 800, options: { legend: { position: 'bottom' } } },
                { breakpoint: 480, options: { legend: { show: false } } }
            ]
        };
        expect(resolveChartOptions(options, 'bar', 1000).legend?.position).toBe('right');
        expect(resolveChartOptions(options, 'bar', 600).legend).toMatchObject({ position: 'bottom', show: true });
        expect(resolveChartOptions(options, 'bar', 400).legend).toMatchObject({ position: 'bottom', show: false });
        const resolved = resolveChartOptions(options, 'bar');
        expect(resolved.yaxes).toHaveLength(2);
        expect(resolved.yaxes[1]).toMatchObject({ opposite: true, forceNiceScale: true });
        expect(resolved.stroke?.show).toBe(false);
        expect(resolveChartOptions({ chart: { sparkline: { enabled: true } } }, 'line').yaxes[0]!.show).toBe(false);
    });
});

function scene(type: ChartType, series: ChartSeries, options: ChartOptions = {}, extra: { hidden?: number[]; window?: [number, number]; width?: number } = {}) {
    const resolved = resolveChartOptions(options, type, extra.width ?? 400);
    const normalized = normalizeSeries(series, type, resolved.labels);
    return { normalized, scene: buildChartScene({ type, series: normalized, hidden: new Set(extra.hidden ?? []), options: resolved, width: extra.width ?? 400, height: 300, locale: en, window: { x: extra.window } }) };
}

describe('scenes', () => {
    it('lays out a column chart with nice ticks and a slot per category', () => {
        const { scene: s } = scene('bar', [{ name: 'Sales', data: [3, 7, 12] }], { xaxis: { categories: ['a', 'b', 'c'] } });
        const y = s.axes.find((a) => a.side === 'left')!;
        expect(y.ticks.map((t) => t.value)).toEqual([0, 5, 10, 15]);
        const bars = s.marks[0]!.kind === 'bar' ? s.marks[0]!.bars : [];
        expect(bars).toHaveLength(3);
        expect(bars[2]!.height).toBeGreaterThan(bars[0]!.height);
        // Bars start at the baseline and only their growing end is rounded.
        expect(bars[0]!.y + bars[0]!.height).toBeCloseTo(s.plot.y + s.plot.height);
        expect(s.columns.map((c) => c.label)).toEqual(['a', 'b', 'c']);
        expect(columnAt(s, s.columns[1]!.pos, s.plot.y + 5)).toBe(1);
        expect(rectAt(s, bars[2]!.x + 1, bars[2]!.y + 1)).toMatchObject({ series: 0, column: 2 });
    });

    it('stacks, groups and lays bars horizontally', () => {
        const series = [
            { name: 'a', data: [1, 2] },
            { name: 'b', data: [3, 4] }
        ];
        const grouped = scene('bar', series).scene;
        const [a, b] = grouped.marks.map((m) => (m.kind === 'bar' ? m.bars[0]! : null));
        expect(b!.x).toBeGreaterThan(a!.x);
        const stacked = scene('bar', series, { chart: { stacked: true } }).scene;
        const [sa, sb] = stacked.marks.map((m) => (m.kind === 'bar' ? m.bars[0]! : null));
        expect(sa!.x).toBeCloseTo(sb!.x);
        expect(sb!.y + sb!.height).toBeCloseTo(sa!.y);
        const full = scene('bar', series, { chart: { stacked: true, stackType: '100%' } }).scene;
        expect(full.yDomains[0]).toEqual([0, 100]);
        const horizontal = scene('bar', series, { plotOptions: { bar: { horizontal: true } } }).scene;
        expect(horizontal.horizontal).toBe(true);
        expect(horizontal.axes.find((ax) => ax.side === 'left')!.ticks.map((t) => t.value)).toEqual([1, 2]);
    });

    it('draws lines and areas, hides series and follows a zoom window', () => {
        const series = [
            { name: 'a', data: [1, 3, 2, 5, 4] },
            { name: 'b', data: [2, 2, 2, 2, 2] }
        ];
        const { scene: s } = scene('area', series);
        expect(s.marks[0]!.kind === 'line' && s.marks[0]!.area).toBeTruthy();
        expect(s.visibleSeries).toEqual([0, 1]);
        const hidden = scene('area', series, {}, { hidden: [0] }).scene;
        expect(hidden.visibleSeries).toEqual([1]);
        const zoomed = scene('line', series, {}, { window: [1, 3] }).scene;
        expect(zoomed.xDomain.view).toEqual([1, 3]);
        expect(zoomed.columns.filter((c) => c.visible).map((c) => c.index)).toEqual([1, 2, 3]);
        expect(datumAt(zoomed, zoomed.columns[3]!.pos, zoomed.data.find((d) => d.series === 0 && d.column === 3)!.y)?.value).toBe(5);
    });

    it('only finds what is on screen: nothing over the axes, nothing scrolled away by a zoom', () => {
        const series = [{ name: 'a', data: [4, 3, 2, 5, 1] }];
        const { scene: s } = scene('line', series, { markers: { size: 4 } });
        const first = s.data.find((d) => d.column === 0)!;
        // On the plot, next to the first point: found.
        expect(datumAt(s, first.x + 3, first.y)?.column).toBe(0);
        // Over the y axis labels, a few pixels left of that same point: not.
        expect(insidePlot(s, s.plot.x - 8, first.y)).toBe(false);
        expect(datumAt(s, s.plot.x - 8, first.y)).toBeNull();
        expect(columnAt(s, s.plot.x - 8, first.y)).toBe(-1);
        // Under the x axis: not.
        expect(datumAt(s, first.x, s.plot.y + s.plot.height + 10)).toBeNull();

        // Zoomed to columns 2–4, column 1 sits left of the plot, clipped away.
        const zoomed = scene('line', series, { markers: { size: 4 } }, { window: [2, 4] }).scene;
        const hiddenPoint = zoomed.data.find((d) => d.column === 1)!;
        expect(hiddenPoint.x).toBeLessThan(zoomed.plot.x - 6);
        const edge = zoomed.data.find((d) => d.column === 2)!;
        // At the plot's left edge the nearest drawn point is column 2, never the clipped column 1.
        expect(datumAt(zoomed, zoomed.plot.x, hiddenPoint.y, 400)?.column).toBe(2);
        expect(datumAt(zoomed, edge.x, edge.y)?.column).toBe(2);

        const bars = scene('bar', series).scene;
        const bar = bars.marks[0]!.kind === 'bar' ? bars.marks[0]!.bars[0]! : null;
        expect(rectAt(bars, bar!.x + 1, bar!.y + 1)).not.toBeNull();
        expect(rectAt(bars, bar!.x + 1, bars.plot.y + bars.plot.height + 4)).toBeNull();
    });

    it('reads datetime x values onto a time axis', () => {
        const day = (d: number) => new Date(2026, 0, d).getTime();
        const { scene: s } = scene('line', [{ name: 'a', data: [[day(1), 1], [day(15), 2], [day(31), 3]] }], { xaxis: { type: 'datetime' } });
        expect(s.xDomain.kind).toBe('datetime');
        const labels = s.axes.find((a) => a.side === 'bottom')!.ticks.map((t) => t.label?.text).filter(Boolean);
        expect(labels[0]).toMatch(/Jan|2026/);
        expect(s.columns).toHaveLength(3);
    });

    it('puts scatter points on a numeric x axis and sizes bubbles by area', () => {
        const { scene: s } = scene('bubble', [{ name: 'a', data: [{ x: 1, y: 1, z: 1 }, { x: 5, y: 5, z: 4 }] }]);
        const markers = s.marks[0]!.kind === 'points' ? s.marks[0]!.markers : [];
        expect(markers[1]!.size / markers[0]!.size).toBeCloseTo(2, 0);
        expect(s.data[1]!.extra?.[0]?.name).toBe('Size');
    });

    it('draws candles rising and falling', () => {
        const { scene: s } = scene('candlestick', [{ name: 'p', data: [{ x: 'a', y: [10, 15, 8, 14] }, { x: 'b', y: [14, 16, 9, 10] }] }]);
        const candles = s.marks[0]!.kind === 'candle' ? s.marks[0]!.candles : [];
        expect(candles.map((c) => c.rising)).toEqual([true, false]);
        expect(s.yDomains[0]![0]).toBeGreaterThan(0);
        expect(s.data[0]!.extra?.map((e) => e.name)).toEqual(['Open', 'High', 'Low', 'Close']);
    });

    it('shades a heat map in steps', () => {
        const { scene: s } = scene('heatmap', [
            { name: 'Mon', data: [{ x: 'a', y: 0 }, { x: 'b', y: 10 }] },
            { name: 'Tue', data: [{ x: 'a', y: 5 }, { x: 'b', y: null }] }
        ]);
        expect(s.heatmap!.cells).toHaveLength(4);
        expect(s.heatmap!.rows.map((r) => r.name)).toEqual(['Tue', 'Mon']);
        const top = s.heatmap!.cells.find((c) => c.series === 0 && c.column === 1)!;
        expect(top.level).toBe(1);
        expect(s.heatmap!.cells.find((c) => c.series === 1 && c.column === 1)!.color).toContain('empty');
    });

    it('slices a donut and finds a slice by angle', () => {
        const { scene: s } = scene('donut', [30, 10, 60], { labels: ['a', 'b', 'c'] });
        const pie = s.pie!;
        expect(pie.slices.map((x) => Math.round(x.percent))).toEqual([30, 10, 60]);
        expect(pie.inner).toBeGreaterThan(0);
        const [x, y] = [pie.cx + 1, pie.cy - (pie.inner + pie.outer) / 2];
        expect(sliceAt(pie, x, y)).toBe(0);
        expect(pie.slices[0]!.label?.text).toBe('30%');
        const withHidden = scene('donut', [30, 10, 60], { labels: ['a', 'b', 'c'] }, { hidden: [2] }).scene;
        expect(Math.round(withHidden.pie!.slices[0]!.percent)).toBe(75);
    });

    it('builds a radar from zero with a spoke per category', () => {
        const { scene: s } = scene('radar', [{ name: 'a', data: [20, 40, 60, 80] }], { xaxis: { categories: ['w', 'x', 'y', 'z'] } });
        expect(s.radar!.spokes).toHaveLength(4);
        expect(s.radar!.axisLabels.map((l) => l.text)).toEqual(['w', 'x', 'y', 'z']);
        expect(s.yDomains[0]![0]).toBe(0);
    });

    it('draws annotations and says when there is nothing to draw', () => {
        const { scene: s } = scene('line', [{ name: 'a', data: [1, 2, 3] }], {
            xaxis: { categories: ['a', 'b', 'c'] },
            annotations: { yaxis: [{ y: 2, label: { text: 'Target' } }], xaxis: [{ x: 'b', x2: 'c' }], points: [{ x: 'c', y: 3 }] }
        });
        expect(s.annotations.front.map((a) => a.kind)).toEqual(['yline', 'xrange', 'point']);
        expect(s.annotations.front[0]!.label?.text).toBe('Target');
        expect(scene('line', []).scene.empty).toBe(true);
        expect(scene('pie', [0, 0]).scene.empty).toBe(true);
    });
});

describe('interaction', () => {
    it('zooms about an anchor and slides at the edges instead of shrinking', () => {
        expect(zoomWindow([0, 100], [0, 100], 0.5, 50)).toEqual([25, 75]);
        expect(zoomWindow([0, 100], [0, 100], 0.5, 0)).toEqual([0, 50]);
        expect(panWindow([0, 50], [0, 100], -10)).toEqual([0, 50]);
        expect(panWindow([40, 60], [0, 100], 50)).toEqual([80, 100]);
        expect(normalizeWindow([10, 10], [0, 100], 0.02)).toEqual([9, 11]);
        expect(isFullWindow([0, 100], [0, 100])).toBe(true);
        expect(isFullWindow([1, 100], [0, 100])).toBe(false);
    });

    it('walks points and series with the keys', () => {
        const { scene: s } = scene('line', [
            { name: 'a', data: [1, 2, 3] },
            { name: 'b', data: [null, 5, 6] }
        ]);
        expect(chartKeyTarget({ series: 0, column: -1 }, 'ArrowRight', s)).toEqual({ series: 0, column: 0 });
        expect(chartKeyTarget({ series: 0, column: 0 }, 'ArrowRight', s)).toEqual({ series: 0, column: 1 });
        expect(chartKeyTarget({ series: 0, column: 0 }, 'ArrowDown', s)).toEqual({ series: 1, column: 1 });
        expect(chartKeyTarget({ series: 0, column: 0 }, 'End', s)).toEqual({ series: 0, column: 2 });
        expect(chartKeyTarget({ series: 0, column: 0 }, 'x', s)).toBeNull();
    });

    it('carries messages between charts of a group', () => {
        const seen: unknown[] = [];
        const off = chartBus.subscribe('group:g', (m) => seen.push(m));
        chartBus.publish('group:g', { kind: 'hover', source: 'a', column: 2 });
        off();
        chartBus.publish('group:g', { kind: 'leave', source: 'a' });
        expect(seen).toEqual([{ kind: 'hover', source: 'a', column: 2 }]);
    });

    it('draws a waterfall as bars that start where the last one ended', () => {
        const { scene: s } = scene('waterfall', [{ name: 'Cash', data: [100, -30, 20, -10] }], { xaxis: { categories: ['Open', 'Costs', 'Sales', 'Tax'] } });
        const bars = s.marks.flatMap((m) => (m.kind === 'bar' ? m.bars : []));
        expect(bars).toHaveLength(4);
        // Down the screen, so a bar that adds has its top above where the last one ended.
        const tops = bars.map((b) => Math.round(b.y));
        const bottoms = bars.map((b) => Math.round(b.y + b.height));
        expect(bottoms[0]).toBeGreaterThan(tops[0]!);
        // Each step touches the one before: its far edge is the other's near edge.
        expect(tops[1]).toBe(tops[0]);
        expect(bottoms[2]).toBe(tops[1]! + (bottoms[1]! - tops[1]!));
        // The axis has to contain the running total, not just the largest step.
        const axis = s.axes.find((a) => a.side === 'left')!;
        expect(Math.max(...axis.ticks.map((t) => Number(t.value)))).toBeGreaterThanOrEqual(100);
    });

    it('draws a range bar between its two numbers', () => {
        const { scene: s } = scene('rangeBar', [{ name: 'Shift', data: [{ x: 'Mon', y: [9, 17] }, { x: 'Tue', y: [12, 20] }] }]);
        const bars = s.marks.flatMap((m) => (m.kind === 'bar' ? m.bars : []));
        expect(bars).toHaveLength(2);
        // Neither starts at zero, and the taller span is the taller bar.
        expect(bars.every((b) => b.height > 0)).toBe(true);
        expect(Math.round(bars[0]!.height)).toBe(Math.round(bars[1]!.height));
        // The second shift is later in the day, so it sits higher up the screen.
        expect(bars[1]!.y).toBeLessThan(bars[0]!.y);
    });

    it('strokes both edges of a range area and fills between them', () => {
        const { scene: s } = scene('rangeArea', [{ name: 'Band', data: [{ x: 'Mon', y: [9, 17] }, { x: 'Tue', y: [12, 20] }, { x: 'Wed', y: [10, 22] }] }]);
        const band = s.marks.find((m) => m.kind === 'line');
        expect(band?.kind).toBe('line');
        // Two subpaths, one for each edge, so the ends are not joined up.
        expect((band as { path: string }).path.match(/M/g)).toHaveLength(2);
        expect((band as { area?: string }).area).toBeTruthy();
    });

    it('bins readings into a histogram and counts every one of them', () => {
        const readings = [1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 5];
        const { scene: s } = scene('histogram', [{ name: 'Readings', data: readings }], { plotOptions: { histogram: { bins: 4 } } });
        const bars = s.marks.flatMap((m) => (m.kind === 'bar' ? m.bars : []));
        expect(bars).toHaveLength(4);
        // The chart is given readings and works out the columns itself.
        expect(s.columns).toHaveLength(4);
        expect(s.columns[0]!.label).toMatch(/^1/);
        // Nothing is lost in the binning.
        const counted = s.data.filter((d) => d.value !== null).reduce((n, d) => n + (d.value ?? 0), 0);
        expect(counted).toBe(readings.length);
    });

    it('draws the closing column of a waterfall from the gap the data left', () => {
        const { scene: s } = scene('waterfall', [{ name: 'Cash', data: [100, -40, 30, null] }], { plotOptions: { waterfall: { totals: [3] } } });
        const bars = s.marks.flatMap((m) => (m.kind === 'bar' ? m.bars : []));
        expect(bars).toHaveLength(4);
        // The subtotal is the running sum, drawn from zero.
        expect(s.data[3]!.value).toBe(90);
    });

    it('carries each waterfall step to the next with a connector', () => {
        const { scene: s } = scene('waterfall', [{ name: 'Cash', data: [100, -40, 30] }]);
        const bar = s.marks.find((m) => m.kind === 'bar') as { connectors?: string };
        // Two gaps between three steps, one subpath each.
        expect(bar.connectors?.match(/M/g)).toHaveLength(2);
        const off = scene('waterfall', [{ name: 'Cash', data: [100, -40, 30] }], { plotOptions: { waterfall: { connectors: false } } });
        expect((off.scene.marks.find((m) => m.kind === 'bar') as { connectors?: string }).connectors).toBeUndefined();
    });

    it('draws a funnel as stages narrowing to the next', () => {
        const { scene: s } = scene('funnel', [{ name: 'Signups', data: [{ x: 'Visited', y: 1000 }, { x: 'Signed up', y: 620 }, { x: 'Paid', y: 310 }] }]);
        const bars = s.marks.flatMap((m) => (m.kind === 'bar' ? m.bars : []));
        expect(s.empty).toBe(false);
        expect(bars).toHaveLength(3);
        // Each stage is as wide as its share of the first, so they narrow.
        expect(bars[0]!.width).toBeGreaterThan(bars[1]!.width);
        expect(bars[1]!.width).toBeGreaterThan(bars[2]!.width);
        // They are stacked down the plot, in order.
        expect(bars[0]!.y).toBeLessThan(bars[1]!.y);
        // Every stage is a trapezoid, not a rectangle: five points and a close.
        expect(bars[0]!.path.startsWith('M')).toBe(true);
        expect(bars[0]!.path.endsWith('Z')).toBe(true);
        // And the tooltip carries the share, which is what a funnel is read for.
        expect(s.data[2]!.extra?.[0]!.text).toBe('31%');
        expect(s.columns.map((c) => c.label)).toEqual(['Visited', 'Signed up', 'Paid']);
    });

    it('draws a box plot as a box, a median and whiskers', () => {
        const { scene: s } = scene('boxPlot', [{ name: 'Latency', data: [{ x: 'Api', y: [10, 20, 30, 40, 90] }, { x: 'Web', y: [5, 8, 9, 11, 14] }] }]);
        const boxes = s.marks.flatMap((m) => (m.kind === 'candle' ? m.candles : []));
        expect(boxes).toHaveLength(2);
        const [api] = boxes;
        // The body is the quartiles and the whisker reaches the extremes, so the
        // whisker is always at least as tall as the box.
        expect(Math.abs(api!.wick.y1 - api!.wick.y2)).toBeGreaterThan(api!.body.height);
        // The median sits inside the body.
        expect(api!.median).toBeGreaterThanOrEqual(api!.body.y);
        expect(api!.median).toBeLessThanOrEqual(api!.body.y + api!.body.height);
        expect(api!.caps).toBe(true);
        // All five numbers reach the tooltip.
        expect(s.data[0]!.extra?.map((e) => e.text)).toEqual(['10', '20', '30', '40', '90']);
    });

    it('lines the plots of a group up on its widest axis', () => {
        const wideLabels = { yaxis: { labels: { formatter: '{value} million dollars' } }, xaxis: { categories: ['a', 'b', 'c'] } };
        const plain = { xaxis: { categories: ['a', 'b', 'c'] } };
        const data: ChartSeries = [{ name: 'a', data: [1, 2, 3] }];

        // Apart, each chart makes room for its own labels, and they differ.
        const aloneWide = scene('line', data, wideLabels).scene.plot.x;
        const aloneNarrow = scene('line', data, plain).scene.plot.x;
        expect(aloneWide).toBeGreaterThan(aloneNarrow);

        // In a group, the widest sets the inset and the others follow it.
        const grouped = (options: ChartOptions, id: string) => scene('line', data, { ...options, chart: { group: 'lineup', id } }).scene.plot;
        const wide = grouped(wideLabels, 'wide');
        const narrow = grouped(plain, 'narrow');
        expect(narrow.x).toBe(wide.x);
        expect(narrow.width).toBe(wide.width);

        // A chart that goes stops holding the rest open at its width.
        releaseInset('lineup', 'wide');
        expect(grouped(plain, 'narrow').x).toBeLessThan(wide.x);
        releaseInset('lineup', 'narrow');
    });
});

describe('text alternatives', () => {
    it('summarises, tabulates and exports the data', () => {
        const { scene: s, normalized } = scene('bar', [{ name: 'Sales', data: [3, 7, 12] }], { xaxis: { categories: ['Jan', 'Feb', 'Mar'] } });
        expect(chartSummary(s, normalized, 'bar', en, 'Quarter')).toBe('Quarter. Bar chart, 1 series: Sales. Sales, 3 points from 3 to 12. from Jan to Mar');
        expect(chartTable(s, normalized, en)).toEqual({
            head: ['Category', 'Sales'],
            rows: [
                ['Jan', '3'],
                ['Feb', '7'],
                ['Mar', '12']
            ]
        });
        expect(chartCsv(normalized, ['Jan', 'Feb', 'Mar'])).toBe('category,Sales\nJan,3\nFeb,7\nMar,12');
        const pie = scene('pie', [1, 3], { labels: ['a', 'b'] });
        expect(chartSummary(pie.scene, pie.normalized, 'pie', en)).toBe('Pie chart, 1 series: a, b. a: 25%, b: 75%');
    });
});
