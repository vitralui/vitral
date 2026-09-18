import { emptyScene, fonts, measurer, seriesColor, titles } from './common';
import { chartFormatter } from './format';
import type { ChartScene, SceneAxis, SceneCell, SceneDatum, SceneInput } from './scene';

const DAY = 86400000;

/** Midnight of the day a timestamp falls in, in local time. */
export function startOfDay(ms: number): number {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/** Days between two timestamps, counting whole days and ignoring the clock. */
export function daysBetween(from: number, to: number): number {
    return Math.round((startOfDay(to) - startOfDay(from)) / DAY);
}

/**
 * Which column and row a day belongs to on a calendar laid out in weeks:
 * the column is the week it falls in, counted from the week the range starts
 * in, and the row is the weekday, with `weekStart` deciding which day is the
 * top row.
 */
export function calendarCell(day: number, first: number, weekStart: number): { column: number; row: number } {
    const row = (new Date(day).getDay() - weekStart + 7) % 7;
    const firstRow = (new Date(first).getDay() - weekStart + 7) % 7;
    return { column: Math.floor((daysBetween(first, day) + firstRow) / 7), row };
}

/**
 * A year of days as a grid of weeks: the calendar heat map a contribution
 * graph made familiar. The value is the shade, the position is the date, and
 * the whole year is on screen at once — which is what it is for, since a line
 * of 365 points shows the trend but not the day.
 */
export function buildCalendar(input: SceneInput): ChartScene {
    const { options: o, locale } = input;
    const base = emptyScene(input);
    const visible = input.series.filter((s) => !input.hidden.has(s.index));
    const days = new Map<number, { value: number; series: number; index: number }>();
    for (const s of visible)
        for (const p of s.points) {
            const ms = typeof p.x === 'number' ? p.x : Date.parse(String(p.x));
            if (!Number.isFinite(ms) || p.y === null) continue;
            const day = startOfDay(ms);
            // Several readings on one day are the day's total, which is what a
            // count of things done that day means.
            const prev = days.get(day);
            days.set(day, { value: (prev?.value ?? 0) + p.y, series: s.index, index: p.index });
        }
    if (!days.size) return base;

    const c = o.plotOptions?.calendar ?? {};
    const keys = [...days.keys()].sort((a, b) => a - b);
    const from = c.from !== undefined ? startOfDay(new Date(c.from).getTime()) : keys[0]!;
    const to = c.to !== undefined ? startOfDay(new Date(c.to).getTime()) : keys[keys.length - 1]!;
    if (!(to >= from)) return base;
    const weekStart = Math.max(0, Math.min(6, c.weekStart ?? 0));
    const lastCell = calendarCell(to, from, weekStart);
    const weeks = lastCell.column + 1;

    const t = titles(input);
    const font = fonts(input);
    const measure = measurer(input);
    const labelSize = font.label;
    const month = new Intl.DateTimeFormat(locale.code, { month: 'short' });
    const weekday = new Intl.DateTimeFormat(locale.code, { weekday: 'short' });
    const full = new Intl.DateTimeFormat(locale.code, { dateStyle: 'medium' });
    // Room for the weekday column on the left and the month row on the top.
    const left = Math.max(0, ...[1, 3, 5].map((r) => measure(weekday.format(new Date(from + ((r - ((new Date(from).getDay() - weekStart + 7) % 7) + 7) % 7) * DAY)), labelSize))) + 10;
    const top = t.height + labelSize * 1.6;
    const plot = { x: left, y: top, width: Math.max(10, input.width - left - 4), height: Math.max(10, input.height - top - 4) };
    const gap = c.gap ?? 2;
    // Square cells: whichever of the two fits is the one both take.
    const size = Math.max(2, Math.min(plot.width / weeks, plot.height / 7));
    // A year is fifty-three weeks by seven days, so the grid rarely fills the
    // box it is given: it sits in the middle of what is left rather than in a
    // corner of it.
    const grid = { x: plot.x + Math.max(0, (plot.width - size * weeks) / 2), y: plot.y + Math.max(0, (plot.height - size * 7) / 2), width: size * weeks, height: size * 7 };

    const values = [...days.values()].map((d) => d.value);
    const min = c.min ?? 0;
    const max = c.max ?? Math.max(...values, 1);
    const steps = Math.max(1, c.shadeSteps ?? 4);
    const color = seriesColor(o, visible[0], 0, Math.max(1, visible.length));
    const format = chartFormatter(o.tooltip?.y?.formatter, '{value}', locale);

    const cells: SceneCell[] = [];
    const data: SceneDatum[] = [];
    for (let i = 0; i <= daysBetween(from, to); i++) {
        const day = startOfDay(from + i * DAY + DAY / 2);
        const at = calendarCell(day, from, weekStart);
        const entry = days.get(day);
        const value = entry?.value ?? null;
        const share = value === null ? 0 : max > min ? (value - min) / (max - min) : 1;
        const level = value === null ? 0 : Math.max(1, Math.ceil(share * steps)) / steps;
        const fill = value === null ? 'var(--vt-chart-heatmap-empty)' : `color-mix(in srgb, ${color} ${Math.round(100 * (0.2 + 0.8 * level))}%, var(--vt-chart-heatmap-base))`;
        const x = grid.x + at.column * size;
        const y = grid.y + at.row * size;
        cells.push({ series: entry?.series ?? 0, index: entry?.index ?? i, column: i, x: x + gap / 2, y: y + gap / 2, width: Math.max(1, size - gap), height: Math.max(1, size - gap), radius: c.radius ?? 2, color: fill, level, stroke: false });
        data.push({
            series: entry?.series ?? 0,
            index: entry?.index ?? i,
            column: i,
            x: x + size / 2,
            y: y + size / 2,
            r: size / 2,
            value,
            text: value === null ? '' : format(value, { seriesIndex: entry?.series ?? 0, dataPointIndex: entry?.index ?? i, seriesName: visible[0]?.name ?? '' }),
            label: full.format(new Date(day)),
            color: fill
        });
    }

    // Months are named once, above the week their first day falls in, on an
    // axis of their own so the renderer draws them as it draws any other.
    const monthTicks: SceneAxis['ticks'] = [];
    for (let i = 0; i <= daysBetween(from, to); i++) {
        const day = startOfDay(from + i * DAY + DAY / 2);
        const d = new Date(day);
        if (d.getDate() !== 1 && i !== 0) continue;
        const at = calendarCell(day, from, weekStart);
        const x = grid.x + at.column * size;
        const previous = monthTicks[monthTicks.length - 1];
        if (previous && x - previous.pos < measure(month.format(d), labelSize) + 8) continue;
        monthTicks.push({ pos: x, value: d.getMonth(), label: { x, y: grid.y - 6, text: month.format(d), anchor: 'start', baseline: 'auto' } });
    }

    const axes: SceneAxis[] = [
        { side: 'top', at: grid.y, line: false, tickMarks: false, tickLength: 0, ticks: monthTicks },
        {
            side: 'left',
            at: grid.x,
            line: false,
            tickMarks: false,
            tickLength: 0,
            // Every other weekday, which is as many as the rows have room for.
            ticks: [1, 3, 5].map((r) => {
                const day = new Date(from + (((r - ((new Date(from).getDay() - weekStart + 7) % 7) + 7) % 7) + 7) * DAY);
                return { pos: grid.y + r * size + size / 2, value: r, label: { x: grid.x - 6, y: grid.y + r * size + size / 2, text: weekday.format(day), anchor: 'end' as const, baseline: 'middle' as const } };
            })
        }
    ];

    return {
        ...base,
        empty: false,
        plot: grid,
        axes,
        heatmap: { kind: 'heatmap', cells, rows: [], strokeWidth: 0 },
        columns: data.map((d) => ({ index: d.column, pos: d.x, half: size / 2, label: d.label, value: d.value ?? 0, visible: true })),
        data,
        visibleSeries: visible.map((s) => s.index)
    };
}
