import { getField, groupKeyOf } from '@vitral/core';
import { aggregateOf } from './rows';
import type { Content, DataGridColumn, Row } from './types';

/**
 * Rows turned about: the values of some fields down the side, the values of
 * others across the top, and in each cell a value worked out over the rows
 * that meet there. The answer is rows and columns like any others, so the
 * grid sorts, filters, pages and exports them as it does its own.
 */

/** What a pivot puts where. */
export interface PivotConfig<T = Row> {
    /** The fields whose values go down the side, a column each. */
    rows: string[];
    /** The fields whose values go across the top, in groups inside groups. With none, one column a value. */
    columns?: string[];
    /** What each cell works out: over which field, how, under what heading, and how it is drawn. */
    values: {
        field: string;
        aggregate?: DataGridColumn<T>['aggregate'];
        header?: string;
        content?: (context: { value: unknown; rows: T[] }) => Content;
    }[];
    /** A column of totals over every value across the top, at the end. True by default. */
    totals?: boolean;
    /** The heading of the totals' columns. */
    totalsHeader?: string;
}

/** The key a pivot's row is known by. */
export const PIVOT_KEY = '__pivot';

/** A value across the top, as its heading says it: a number as written, since across the top it is a year or a code more often than an amount. */
const label = (value: unknown, locale?: string) => (value === null || value === undefined || value === '' ? '—' : value instanceof Date ? value.toLocaleDateString(locale) : String(value));

/**
 * The pivot of `rows`: a row for each mix of the side's values, and under
 * each value across the top a column for each thing worked out. `columns`
 * are the grid's own, whose headers and formats the side's columns take.
 */
export function pivotOf<T>(rows: readonly T[], config: PivotConfig<T>, declared: readonly DataGridColumn<T>[] = [], locale?: string): { rows: Row[]; columns: DataGridColumn<Row>[] } {
    const across = config.columns ?? [];
    const own = (field: string) => declared.find((column) => column.field === field);
    // The values across the top, as a tree: each level's values in the order they first appear.
    interface Node {
        value: unknown;
        path: string;
        children: Map<string, Node>;
    }
    const top: Node = { value: null, path: '', children: new Map() };
    const side = new Map<string, { values: unknown[]; rows: T[]; cells: Map<string, T[]> }>();
    for (const row of rows) {
        const sideValues = config.rows.map((field) => getField(row, field));
        const sideKey = sideValues.map(groupKeyOf).join('\u0001');
        let entry = side.get(sideKey);
        if (!entry) side.set(sideKey, (entry = { values: sideValues, rows: [], cells: new Map() }));
        entry.rows.push(row);
        let node = top;
        for (const field of across) {
            const value = getField(row, field);
            const key = groupKeyOf(value);
            let next = node.children.get(key);
            if (!next) node.children.set(key, (next = { value, path: node.path ? `${node.path}\u0001${key}` : key, children: new Map() }));
            node = next;
        }
        if (across.length) {
            const cell = entry.cells.get(node.path);
            if (cell) cell.push(row);
            else entry.cells.set(node.path, [row]);
        }
    }
    const measure = (value: PivotConfig<T>['values'][number], at: number, path: string): DataGridColumn<Row> => {
        const source = own(value.field);
        return {
            key: `${path ? `${path}\u0002` : ''}${at}`,
            field: `${PIVOT_KEY}:${path}:${at}`,
            header: value.header ?? `${source?.header ?? value.field}`,
            align: 'right',
            sortable: true,
            body: value.content ? ({ row }) => value.content!({ value: (row as Row)[`${PIVOT_KEY}:${path}:${at}`], rows: ((row as Row)[`${PIVOT_KEY}:rows:${path}`] as T[]) ?? [] }) : undefined
        };
    };
    const measures = (path: string) => config.values.map((value, at) => measure(value, at, path));
    // One value worked out: a single column under the value, no group of one.
    const under = (path: string, heading: string): DataGridColumn<Row> =>
        config.values.length === 1 ? { ...measures(path)[0]!, header: heading } : { key: `group:${path}`, header: heading, columns: measures(path) };
    // Across the top in order — 2025 before 2026, Q1 before Q4 — whatever order the rows came in.
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    const ordered = (node: Node) =>
        [...node.children.values()].sort((a, b) =>
            typeof a.value === 'number' && typeof b.value === 'number'
                ? a.value - b.value
                : a.value instanceof Date && b.value instanceof Date
                  ? a.value.getTime() - b.value.getTime()
                  : collator.compare(label(a.value, locale), label(b.value, locale))
        );
    const columnsOf = (node: Node): DataGridColumn<Row>[] =>
        ordered(node).map((child) => (child.children.size ? { key: `group:${child.path}`, header: label(child.value, locale), columns: columnsOf(child) } : under(child.path, label(child.value, locale))));
    const totals = config.totals !== false || !across.length;
    const columns: DataGridColumn<Row>[] = [
        ...config.rows.map((field) => {
            const source = own(field);
            return { ...source, key: `side:${field}`, field, header: source?.header ?? field, sortable: true, editable: false, columns: undefined } as DataGridColumn<Row>;
        }),
        ...(across.length ? columnsOf(top) : []),
        ...(totals ? [across.length ? under('', config.totalsHeader ?? 'Total') : measures('')].flat() : [])
    ];
    const out = [...side.values()].map((entry) => {
        const line: Row = { [PIVOT_KEY]: entry.values.map(groupKeyOf).join('\u0001') };
        config.rows.forEach((field, at) => (line[field] = entry.values[at]));
        const work = (path: string, cellRows: T[]) => {
            line[`${PIVOT_KEY}:rows:${path}`] = cellRows;
            config.values.forEach((value, at) => (line[`${PIVOT_KEY}:${path}:${at}`] = aggregateOf({ field: value.field, aggregate: value.aggregate ?? 'sum' }, cellRows)));
        };
        for (const [path, cellRows] of entry.cells) work(path, cellRows);
        if (totals) work('', entry.rows);
        return line;
    });
    return { rows: out, columns };
}
