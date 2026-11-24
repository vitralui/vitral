import { formatMessage, type Locale } from '@vitral/core';
import { h, mergeAttrs, s, type Child, type Props } from '@vitral/dom';
import type { DataGridSparkline, DataGridSparklinePoint, Row } from '../engine/types';

/**
 * A chart a cell tall, drawn from the cell's numbers as plain SVG: a line, an
 * area, columns, or one value as a bar across the cell. Nothing is measured
 * and nothing is kept, so a page of them costs what a page of text does. The
 * shapes stretch to the cell (`preserveAspectRatio="none"`) while the strokes
 * and the dots keep their size; each point is named for a screen reader and a
 * pointer resting on it.
 */

type Part = (name: string, state?: unknown) => Props;

/** The numbers a row draws: the column's own reading, or the cell's value. */
export function sparklinePoints<T = Row>(spark: DataGridSparkline<T>, row: T, value: unknown): number[] {
    const read = spark.values ? spark.values(row) : value;
    const list = Array.isArray(read) ? read : read === null || read === undefined || read === '' ? [] : [read];
    return list.map((v) => (typeof v === 'number' ? v : Number(v))).filter((v) => Number.isFinite(v));
}

/** The range every row's marks share: from the lowest to the highest over the rows (a bar's from 0). */
export function sparklineDomain<T = Row>(spark: DataGridSparkline<T>, rows: T[], valueOf: (row: T) => unknown): [number, number] {
    let low = Infinity;
    let high = -Infinity;
    for (const row of rows) {
        for (const v of sparklinePoints(spark, row, valueOf(row))) {
            if (v < low) low = v;
            if (v > high) high = v;
        }
    }
    if (low > high) return [0, 1];
    return spark.type === 'bar' ? [Math.min(0, low), Math.max(0, high)] : [low, high];
}

const extremes = (values: number[]): [number, number] => [Math.min(...values), Math.max(...values)];

/** Which points are dotted, by the names the column gave or its own test. */
function marked(spark: DataGridSparkline, values: number[]): Set<number> {
    const out = new Set<number>();
    const markers = spark.markers;
    if (!markers || !values.length) return out;
    if (typeof markers === 'function') {
        values.forEach((value, index) => markers({ value, index, values }) && out.add(index));
        return out;
    }
    const [low, high] = extremes(values);
    for (const name of markers) {
        if (name === 'first') out.add(0);
        else if (name === 'last') out.add(values.length - 1);
        else if (name === 'min') out.add(values.indexOf(low));
        else if (name === 'max') out.add(values.indexOf(high));
        else if (name === 'negative') values.forEach((v, i) => v < 0 && out.add(i));
    }
    return out;
}

/** What a dot is called, for its colour: the first, the last, the highest... */
function markerKind(values: number[], index: number): string {
    const [low, high] = extremes(values);
    if (values[index]! < 0) return 'negative';
    if (values[index] === high) return 'max';
    if (values[index] === low) return 'min';
    return index === 0 ? 'first' : 'last';
}

const round = (n: number) => Math.round(n * 100) / 100;

export interface SparklineInput<T = Row> {
    spark: DataGridSparkline<T>;
    row: T;
    values: number[];
    /** The range to scale to, when the column shares one. */
    domain?: [number, number];
    locale: Locale;
    part: Part;
}

export function sparklineView<T = Row>({ spark, row, values, domain, locale, part }: SparklineInput<T>): Child {
    const type = spark.type ?? 'line';
    const number = new Intl.NumberFormat(locale.code, { maximumFractionDigits: 2 });
    const format = (value: number, index: number) => (spark.format ? spark.format(value, index) : number.format(value));
    const labels = typeof spark.labels === 'function' ? spark.labels(row) : spark.labels;
    const nameOf = (value: number, index: number) => (labels?.[index] !== undefined ? `${labels[index]}: ${format(value, index)}` : format(value, index));
    const colorOf = (point: DataGridSparklinePoint<T>) => (typeof spark.color === 'function' ? spark.color(point) : undefined);
    const own = typeof spark.color === 'string' ? { color: spark.color } : undefined;

    if (!values.length) return h('span', part('sparkline', { type, empty: true }), '');

    if (type === 'bar') {
        const value = values[values.length - 1]!;
        const [low, high] = domain ?? [Math.min(0, value), Math.max(0, value, 1)];
        const share = high === low ? 0 : Math.max(0, Math.min(1, (value - low) / (high - low)));
        const fill = colorOf({ value, index: 0, values, row });
        const text = spark.text === false ? null : format(value, 0);
        return h(
            'span',
            mergeAttrs(part('sparkline', { type }), { style: own }),
            h(
                'span',
                mergeAttrs(part('sparklineTrack'), { role: 'img', 'aria-label': nameOf(value, 0), title: nameOf(value, 0) }),
                h('span', mergeAttrs(part('sparklineFill', { negative: value < 0 }), { style: { width: `${round(share * 100)}%`, ...(fill ? { background: fill } : {}) } }))
            ),
            text === null ? null : h('span', mergeAttrs(part('sparklineText'), { 'aria-hidden': 'true' }), text)
        );
    }

    const [low, high] = domain ?? extremes(values);
    // Columns stand on zero when it is in view, so a fall reads as a column below the line.
    const bottom = type === 'column' ? Math.min(0, low) : low;
    const top = type === 'column' ? Math.max(0, high) : high;
    const span = top - bottom || 1;
    const y = (v: number) => round(100 - ((v - bottom) / span) * 100);
    const n = values.length;
    const width = type === 'column' ? n : Math.max(1, n - 1);
    const x = (i: number) => (type === 'column' ? i + 0.5 : n === 1 ? 0.5 : i);
    const [first, last] = [values[0]!, values[n - 1]!];
    const [least, most] = extremes(values);
    const summary = formatMessage(locale.datagrid.sparkline, {
        count: n,
        first: format(first, 0),
        last: format(last, n - 1),
        min: format(least, values.indexOf(least)),
        max: format(most, values.indexOf(most))
    });

    const shapes: Child[] = [];
    if (type === 'column') {
        const zero = y(Math.max(bottom, Math.min(top, 0)));
        values.forEach((value, index) => {
            const fill = colorOf({ value, index, values, row });
            const yv = y(value);
            shapes.push(
                s('rect',
                    mergeAttrs(part('sparklineColumn', { negative: value < 0 }), {
                        x: round(index + 0.1),
                        width: 0.8,
                        y: Math.min(yv, zero),
                        height: Math.max(round(Math.abs(zero - yv)), 1),
                        ...(fill ? { style: { fill } } : {})
                    })
                )
            );
        });
    } else {
        const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ') + (n === 1 ? ` h0.01` : '');
        if (type === 'area') shapes.push(s('path', mergeAttrs(part('sparklineArea'), { d: `${line} L${x(n - 1)} 100 L${x(0)} 100 Z` })));
        shapes.push(s('path', mergeAttrs(part('sparklineLine'), { d: line, 'vector-effect': 'non-scaling-stroke' })));
    }
    // A dot is a stroke of no length with round ends: it stays round however the chart is stretched.
    for (const index of marked(spark, values)) {
        const fill = colorOf({ value: values[index]!, index, values, row });
        shapes.push(
            s('path',
                mergeAttrs(part('sparklineMarker', { kind: markerKind(values, index) }), {
                    d: `M${x(index)} ${y(values[index]!)} h0`,
                    'vector-effect': 'non-scaling-stroke',
                    ...(fill ? { style: { stroke: fill } } : {})
                })
            )
        );
    }
    // A slice the full height over each point, for the pointer to rest on and read it.
    if (spark.tooltip !== false) {
        values.forEach((value, index) => {
            const left = type === 'column' ? index : n === 1 ? 0 : Math.max(0, index - 0.5);
            const right = type === 'column' ? index + 1 : n === 1 ? 1 : Math.min(width, index + 0.5);
            shapes.push(s('rect', mergeAttrs(part('sparklineHit'), { x: left, y: 0, width: right - left, height: 100 }), s('title', null, nameOf(value, index))));
        });
    }
    return h(
        'span',
        mergeAttrs(part('sparkline', { type }), { style: own }),
        s('svg',
            mergeAttrs(part('sparklineSvg'), {
                viewBox: `0 0 ${width} 100`,
                preserveAspectRatio: 'none',
                role: 'img',
                'aria-label': summary,
                focusable: 'false'
            }),
            ...shapes
        )
    );
}
