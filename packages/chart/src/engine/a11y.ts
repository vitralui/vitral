import { formatMessage, type Locale } from '@vitral/core';
import type { ChartScene } from './scene';
import type { NormalizedSeries } from './series';
import type { ChartType } from './types';

/**
 * The words that stand in for the picture: a summary that names the chart
 * (its kind, its series and their ranges), the readout for one point, and
 * the data as table rows or CSV.
 */
export function chartSummary(scene: ChartScene, series: NormalizedSeries[], type: ChartType, locale: Locale, title?: string): string {
    const c = locale.chart;
    const visible = series.filter((s) => scene.visibleSeries.includes(s.index));
    const names = visible.map((s, i) => s.name || String(i + 1));
    const parts: string[] = [];
    if (title) parts.push(title);
    const pieLike = type === 'pie' || type === 'donut';
    parts.push(formatMessage(c.summary, { type: c.types[type], count: pieLike ? 1 : visible.length, names: pieLike ? names.join(', ') : names.join(', ') }));
    if (!pieLike) {
        for (const s of visible) {
            const points = scene.data.filter((d) => d.series === s.index && d.value !== null);
            if (!points.length) continue;
            const min = points.reduce((a, b) => (b.value! < a.value! ? b : a));
            const max = points.reduce((a, b) => (b.value! > a.value! ? b : a));
            parts.push(formatMessage(c.seriesSummary, { name: s.name || String(s.index + 1), count: points.length, min: min.text, max: max.text }));
        }
        const cols = scene.columns.filter((col) => col.visible);
        if (cols.length > 1) parts.push(formatMessage(c.rangeSummary, { from: cols[0]!.label, to: cols[cols.length - 1]!.label }));
    } else if (scene.pie) {
        parts.push(scene.pie.slices.map((s) => `${series[s.series]?.name}: ${Math.round(s.percent)}%`).join(', '));
    }
    return parts.join('. ');
}

export interface ChartTable {
    head: string[];
    rows: string[][];
}

/** The data as a table: one row per column (category), one column per visible series. */
export function chartTable(scene: ChartScene, series: NormalizedSeries[], locale: Locale): ChartTable {
    const visible = series.filter((s) => scene.visibleSeries.includes(s.index));
    if (scene.pie) {
        return { head: [locale.chart.category, locale.chart.value], rows: scene.data.map((d) => [d.label, d.text]) };
    }
    const byColumn = new Map<number, Map<number, string>>();
    const labels = new Map<number, string>();
    for (const d of scene.data) {
        if (!byColumn.has(d.column)) byColumn.set(d.column, new Map());
        byColumn.get(d.column)!.set(d.series, d.extra ? d.extra.map((e) => `${e.name} ${e.text}`).join(', ') : d.text);
        labels.set(d.column, d.label);
    }
    const columns = [...byColumn.keys()].sort((a, b) => a - b);
    return {
        head: [locale.chart.category, ...visible.map((s, i) => s.name || String(i + 1))],
        rows: columns.map((c) => [labels.get(c) ?? String(c), ...visible.map((s) => byColumn.get(c)?.get(s.index) ?? '')])
    };
}

const csvCell = (value: string) => (/[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** The raw data as CSV: categories and numbers unformatted, so a spreadsheet reads them. */
export function chartCsv(series: NormalizedSeries[], categories: (string | number)[] | undefined, headerCategory = 'category'): string {
    const length = Math.max(0, ...series.map((s) => s.points.length));
    const lines = [[headerCategory, ...series.map((s, i) => s.name || `series ${i + 1}`)].map(csvCell).join(',')];
    for (let i = 0; i < length; i++) {
        const point = series.find((s) => s.points[i])?.points[i];
        const x = categories?.[i] ?? (point && point.x !== point.index ? point.x : i + 1);
        const cells = series.map((s) => {
            const p = s.points[i];
            if (!p) return '';
            if (p.ohlc) return p.ohlc.join(' ');
            return p.y === null ? '' : String(p.y);
        });
        lines.push([csvCell(String(x)), ...cells.map(csvCell)].join(','));
    }
    return lines.join('\n');
}
