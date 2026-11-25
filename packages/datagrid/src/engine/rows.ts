import { getField, groupKeyOf, isBlankFilter, queryData, type GroupedRow, type LoadOptions, type RowGroup } from '@vitral/core';
import { readValue } from './edit';
import type { DataGridColumn, Row } from './types';

/**
 * The shapes rows take beyond a flat list, with the DOM left out: groups
 * inside groups, a value worked out over each group's rows, and rows that
 * hold rows of their own, a tree.
 */

/** Where a row of a tree stands: how deep, whether it holds rows, whether they show. */
export interface TreePlace {
    depth: number;
    key: string | number;
    hasChildren: boolean;
    expanded: boolean;
    /** Its place among the rows beside it, for a reader told "3 of 5". */
    position: number;
    siblings: number;
}

/** A line of the grid: a group's heading, at its level, or a row, with its place in a tree. */
export type GridLine<T = Row> =
    | (Extract<GroupedRow<T>, { kind: 'group' }> & { level: number; field: string })
    | (Extract<GroupedRow<T>, { kind: 'row' }> & { tree?: TreePlace });

/** The key that joins a group's to its parents', so two groups of one value under two parents shut apart. */
const SEP = '\u0001';

/**
 * The page as the lines a grid grouped by several fields draws: a heading for
 * each group at each level, then its rows; a shut group's rows and groups are
 * left out. A group's key is its parents' keys and its own, so the first
 * level's keys are the ones a single field gives.
 */
export function groupLines<T>(page: readonly T[], fields: readonly string[], collapsed: ReadonlySet<string>): GridLine<T>[] {
    const indexOf = new Map<T, number>();
    page.forEach((row, index) => {
        if (!indexOf.has(row)) indexOf.set(row, index);
    });
    const out: GridLine<T>[] = [];
    const walk = (rows: readonly T[], level: number, parent: string) => {
        const field = fields[level]!;
        const groups: RowGroup<T>[] = [];
        const byKey = new Map<string, RowGroup<T>>();
        for (const row of rows) {
            const value = getField(row, field);
            const own = groupKeyOf(value);
            let group = byKey.get(own);
            if (!group) {
                group = { value, key: parent ? `${parent}${SEP}${own}` : own, rows: [] };
                byKey.set(own, group);
                groups.push(group);
            }
            group.rows.push(row);
        }
        groups.forEach((group, index) => {
            const shut = collapsed.has(group.key);
            out.push({ kind: 'group', group, index, collapsed: shut, level, field });
            if (shut) return;
            if (level + 1 < fields.length) walk(group.rows, level + 1, group.key);
            else for (const row of group.rows) out.push({ kind: 'row', row, index: indexOf.get(row) ?? 0 });
        });
    };
    if (fields.length) walk(page, 0, '');
    return out;
}

/** Every group key the page has, at every level: what "expand all" opens and "collapse all" shuts. */
export function groupKeys<T>(page: readonly T[], fields: readonly string[]): string[] {
    return groupLines(page, fields, new Set()).flatMap((line) => (line.kind === 'group' ? [line.group.key] : []));
}

/** The fields a grid groups by, as a list. */
export const groupFields = (groupBy: string | readonly string[] | undefined): string[] => (!groupBy ? [] : typeof groupBy === 'string' ? [groupBy] : [...groupBy]);

/** A column's value over a group's rows: by name, or by the column's own function. */
export function aggregateOf<T>(column: DataGridColumn<T>, rows: readonly T[]): unknown {
    const how = column.aggregate;
    if (!how) return undefined;
    const values = column.field || column.valueGetter ? rows.map((row) => readValue(column, row, column.field)) : [];
    if (typeof how === 'function') return how({ rows: [...rows], values });
    if (how === 'count') return rows.length;
    if (how === 'first') return values[0];
    if (how === 'last') return values[values.length - 1];
    const numbers = values.map((value) => (value instanceof Date ? value.getTime() : value)).filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
    if (!numbers.length) return null;
    switch (how) {
        case 'sum':
            return numbers.reduce((sum, n) => sum + n, 0);
        case 'avg':
            return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        case 'min':
        case 'max': {
            const n = how === 'min' ? Math.min(...numbers) : Math.max(...numbers);
            // A date stays a date.
            return values.some((value) => value instanceof Date) ? new Date(n) : n;
        }
        default:
            return undefined;
    }
}

/** How a tree's rows are found under a row: in a field, or by a function. */
export const childrenOf =
    <T,>(tree: string | ((row: T) => T[] | null | undefined)) =>
    (row: T): T[] => {
        const own = typeof tree === 'function' ? tree(row) : getField(row, tree);
        return Array.isArray(own) ? (own as T[]) : [];
    };

/**
 * A tree's rows as the grid shows them: each row's rows under it when it is
 * open, sorted among the rows beside it, and filtered so a row shows when it
 * matches or something under it does — with the way down to a match open
 * while a filter is on.
 */
export function treeRows<T>(
    roots: readonly T[],
    children: (row: T) => T[],
    request: Pick<LoadOptions, 'sort' | 'filters' | 'globalFilter' | 'locale'>,
    open: ReadonlySet<string>,
    /** A row's key: its `dataKey`, or, with none, where it stands in the tree as it was handed in. */
    keyOf: (row: T, path: string) => string | number
): { rows: T[]; places: Map<T, TreePlace> } {
    const filtering = Object.values(request.filters ?? {}).some((filter) => ('constraints' in filter ? filter.constraints.some((c) => !isBlankFilter(c.value)) : !isBlankFilter(filter.value))) || (!!request.globalFilter && !isBlankFilter(request.globalFilter.value));
    let keep: ((row: T) => boolean) | null = null;
    if (filtering) {
        const every: T[] = [];
        const gather = (rows: readonly T[]) => rows.forEach((row) => (every.push(row), gather(children(row))));
        gather(roots);
        const matched = new Set(queryData(every, { filters: request.filters, globalFilter: request.globalFilter, locale: request.locale }).items);
        const kept = new Map<T, boolean>();
        const mark = (row: T): boolean => {
            let any = matched.has(row);
            for (const child of children(row)) any = mark(child) || any;
            kept.set(row, any);
            return any;
        };
        roots.forEach(mark);
        keep = (row) => kept.get(row) === true;
    }
    const order = (rows: readonly T[]) => (request.sort?.length ? queryData([...rows], { sort: request.sort, locale: request.locale }).items : [...rows]);
    const out: T[] = [];
    const places = new Map<T, TreePlace>();
    const walk = (rows: readonly T[], depth: number, parent: string) => {
        const paths = new Map(rows.map((row, at) => [row, parent ? `${parent}.${at}` : String(at)]));
        const shown = order(keep ? rows.filter(keep) : rows);
        shown.forEach((row, position) => {
            const under = children(row);
            const path = paths.get(row)!;
            const key = keyOf(row, path);
            const hasChildren = keep ? under.some(keep) : under.length > 0;
            const expanded = hasChildren && (open.has(String(key)) || !!keep);
            out.push(row);
            places.set(row, { depth, key, hasChildren, expanded, position: position + 1, siblings: shown.length });
            if (expanded) walk(under, depth + 1, path);
        });
    };
    walk(roots, 0, '');
    return { rows: out, places };
}

/** Every key of a tree's rows that hold rows: what "expand all" opens. */
export function treeKeys<T>(roots: readonly T[], children: (row: T) => T[], keyOf: (row: T, path: string) => string | number): (string | number)[] {
    const out: (string | number)[] = [];
    const walk = (rows: readonly T[], parent: string) =>
        rows.forEach((row, at) => {
            const under = children(row);
            const path = parent ? `${parent}.${at}` : String(at);
            if (!under.length) return;
            out.push(keyOf(row, path));
            walk(under, path);
        });
    walk(roots, '');
    return out;
}

