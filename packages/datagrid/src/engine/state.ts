import {
    getField,
    isBlankFilter,
    isSelected,
    orderColumns,
    queryData,
    selectionState,
    stickyOffsets,
    type ColumnLayout,
    type ColumnSticky,
    type CompositeFilter,
    type FilterConstraint,
    type FilterMeta,
    type SortMeta
} from '@vitral/core';
import { childrenOf, groupFields, groupLines, treeRows, type GridLine, type TreePlace } from './rows';
import type { LoadRequest, Row, DataGridColumn, DataGridConfig, DataGridModels } from './types';

/**
 * What a table draws, worked out from what it was told: which columns, in what
 * order and at what width; which rows, sorted, filtered and paged; and what is
 * selected. Everything here is a function of the configuration and the state —
 * no DOM, no timers — so the renderer only has to draw the answer and the same
 * answer can be tested on its own.
 */

/** A column with everything the renderer needs decided: its key, its width, where it sticks. */
export interface ResolvedColumn<T = Row> {
    column: DataGridColumn<T>;
    key: string;
    field?: string;
    sortField: string;
    filterField: string;
    header: string;
    sticky?: ColumnSticky;
    width?: number;
    align?: 'left' | 'center' | 'right';
    selectionMode?: 'single' | 'multiple';
    /** The groups this column sits in, outermost first: one heading row each. */
    groups: ColumnGroupRef<T>[];
    /** Where it stands among the columns drawn, from 1: what `aria-colindex` says when columns are left out of view. */
    position: number;
}

/** A group of columns a column sits in, as the header draws it. */
export interface ColumnGroupRef<T = Row> {
    key: string;
    column: DataGridColumn<T>;
}

export const keyOf = (column: DataGridColumn, index: number): string => String(column.key ?? column.field ?? `column-${index}`);
export const isComposite = (filter: FilterConstraint | CompositeFilter): filter is CompositeFilter => 'constraints' in filter;

export const defaultModels = (): DataGridModels => ({
    first: 0,
    rows: 10,
    sortField: null,
    sortOrder: null,
    multiSortMeta: [],
    filters: {},
    selection: null,
    columnLayout: {},
    collapsedGroups: [],
    expandedRows: [],
    expandedTree: []
});

/**
 * The columns as declared, before the reader's layout: hidden ones are already
 * out, and a group is the columns inside it, each knowing the groups it is in.
 * A column is keyed by where it stands among the columns, as it was before
 * groups, so a layout stored from a flat table still fits.
 */
export function declaredColumns<T>(config: DataGridConfig<T>): { column: DataGridColumn<T>; key: string; groups: ColumnGroupRef<T>[] }[] {
    const out: { column: DataGridColumn<T>; key: string; groups: ColumnGroupRef<T>[] }[] = [];
    const walk = (list: DataGridColumn<T>[], groups: ColumnGroupRef<T>[], path: string) =>
        list
            .filter((column) => !column.hidden)
            .forEach((column, index) => {
                if (column.columns) walk(column.columns, [...groups, { key: String(column.key ?? `group-${path}${index}`), column }], `${path}${index}-`);
                else out.push({ column, key: keyOf(column, out.length), groups });
            });
    walk(config.columns ?? [], [], '');
    return out;
}

/** How many heading rows the groups take over the columns' own. */
export const groupDepth = (columns: readonly { groups: readonly unknown[] }[]): number => columns.reduce((deepest, column) => Math.max(deepest, column.groups.length), 0);

/** The width a column without one is given where every column needs one: a grid that draws its columns as they come into view. */
export const VIRTUAL_COLUMN_WIDTH = 150;

/**
 * The layout the table draws from: what the reader changed, over what the
 * columns themselves asked for, so a table is laid out as written until
 * someone moves something.
 */
export function tableLayout<T>(config: DataGridConfig<T>, models: DataGridModels): ColumnLayout {
    const declared = declaredColumns(config);
    const given = models.columnLayout ?? {};
    const widths = { ...Object.fromEntries(declared.filter(({ column }) => column.width !== undefined).map(({ column, key }) => [key, column.width!])), ...given.widths };
    const pinned = { ...Object.fromEntries(declared.filter(({ column }) => column.pinned).map(({ column, key }) => [key, column.pinned!])), ...given.pinned };
    // Until the reader says otherwise, the columns that start hidden are.
    const hidden = given.hidden ?? declared.filter(({ column }) => column.visible === false).map(({ key }) => key);
    return { order: given.order, hidden, widths, pinned };
}

/**
 * The columns to draw, in order, with their widths and sticky offsets. A grid
 * that draws its columns as they come into view needs every width, so there a
 * column without one has its minimum, or `VIRTUAL_COLUMN_WIDTH`.
 */
export function tableColumns<T>(config: DataGridConfig<T>, models: DataGridModels): ResolvedColumn<T>[] {
    const declared = declaredColumns(config);
    const given = tableLayout(config, models);
    const byKey = new Map(declared.map((entry) => [entry.key, entry]));
    const layout = config.virtualColumns
        ? { ...given, widths: { ...Object.fromEntries(declared.map(({ column, key }) => [key, column.minWidth ?? VIRTUAL_COLUMN_WIDTH])), ...given.widths } }
        : given;
    const order = orderColumns(
        declared.map((entry) => entry.key),
        layout
    );
    const sticky = stickyOffsets(order, layout);
    return order
        .filter((key) => byKey.has(key))
        .map((key, index) => {
            const { column, groups } = byKey.get(key)!;
            return {
                column,
                key,
                field: column.field,
                sortField: String(column.sortField ?? column.field ?? ''),
                filterField: String(column.filterField ?? column.field ?? ''),
                header: column.header ?? column.field ?? '',
                sticky: sticky[key],
                width: layout.widths?.[key],
                align: column.align,
                selectionMode: column.selectionMode,
                groups,
                position: index + 1
            };
        });
}

/** A pinned band's rows: the list it was given, or what its function makes of the rows the query let through. */
export function pinnedRowsOf<T>(rows: DataGridConfig<T>['pinnedTopRows'], resolved: ResolvedRows<T>): T[] {
    if (!rows) return [];
    return typeof rows === 'function' ? rows({ rows: resolved.all, page: resolved.page }) : rows;
}

/** The sort the table is in, however it was expressed. */
export function sortsOf(config: DataGridConfig, models: DataGridModels): SortMeta[] {
    if (config.sortMode === 'multiple') return models.multiSortMeta ?? [];
    const order = models.sortOrder;
    return models.sortField && (order === 1 || order === -1) ? [{ field: models.sortField, order }] : [];
}

/** What the table asks for: the same request whether it is answered here or by a server. */
export function loadRequest(config: DataGridConfig, models: DataGridModels, filters: FilterMeta): LoadRequest {
    const { global, ...fields } = filters;
    const globalFilter =
        global && !isComposite(global) && config.globalFilterFields?.length ? { value: global.value, fields: [...config.globalFilterFields], matchMode: global.matchMode } : undefined;
    return {
        first: config.paginator ? models.first : undefined,
        rows: config.paginator ? models.rows : undefined,
        sort: sortsOf(config, models).map((sort) => ({ field: sort.field, order: sort.order })),
        filters: fields,
        globalFilter,
        locale: config.locale?.code
    };
}

export type TableMode = 'local' | 'lazy' | 'source';
export const modeOf = (config: DataGridConfig): TableMode => (config.dataSource ? 'source' : config.lazy ? 'lazy' : 'local');

export interface ResolvedRows<T = Row> {
    /** The rows on the page. */
    page: T[];
    /** In a tree, where each row shown stands in it. */
    tree?: Map<T, TreePlace>;
    /** Every row the query matched, which is what select-all covers; the page itself for a server. */
    all: T[];
    total: number;
    /** Where the page starts, for the index a row reports. */
    offset: number;
}

/** The rows to draw. `remote` is what a data source last answered. */
export function resolveRows<T>(config: DataGridConfig<T>, models: DataGridModels, filters: FilterMeta, remote?: { items: T[]; total: number }): ResolvedRows<T> {
    const mode = modeOf(config);
    const value = config.value ?? [];
    const offset = config.paginator ? models.first : 0;
    if (mode === 'lazy') return { page: value, all: value, total: config.totalRecords ?? value.length, offset };
    if (mode === 'source') return { page: remote?.items ?? [], all: remote?.items ?? [], total: remote?.total ?? 0, offset };
    const request = loadRequest(config, models, filters);
    if (config.treeData) {
        // A tree pages over the rows it shows, the open rows' rows among them.
        const tree = treeRows(value, childrenOf(config.treeData), request, new Set((models.expandedTree ?? []).map(String)), (row, path) => treeKey(config, row, path));
        const page = config.paginator ? tree.rows.slice(models.first, models.first + models.rows) : tree.rows;
        return { page, all: tree.rows, total: tree.rows.length, offset, tree: tree.places };
    }
    const processed = queryData(value, { ...request, first: undefined, rows: undefined });
    const page = config.paginator ? queryData(processed.items, { first: models.first, rows: models.rows }).items : processed.items;
    return { page, all: processed.items, total: processed.total, offset };
}

/**
 * The page as the lines a grouped grid draws: a heading over each run of rows
 * that share the grouping field, and the rows of a shut group left out. With
 * no `groupBy` there is nothing to gather and the rows are handed back as they
 * are, so the body renderer walks one list either way.
 *
 * Each row keeps the index it had on the page. That index is the row's identity
 * to selection, to the keyboard and to every event the grid emits, and shifting
 * it because a heading was inserted would break all three.
 */
export function linesOf<T>(config: DataGridConfig<T>, models: DataGridModels, page: T[], tree?: Map<T, TreePlace>): GridLine<T>[] {
    if (tree) return page.map((row, index) => ({ kind: 'row', row, index, tree: tree.get(row) }));
    const fields = groupFields(config.groupBy);
    if (!fields.length) return page.map((row, index) => ({ kind: 'row', row, index }));
    return groupLines(page, fields, new Set(models.collapsedGroups ?? []));
}

/** What a row of a tree is opened by: its `dataKey` value, or its place in the tree as handed in. */
export const treeKey = (config: DataGridConfig, row: unknown, path: string): string | number => (config.dataKey ? (getField(row, config.dataKey) as string | number) : path);

/** What a group's heading says: what the template asked for, or the value itself. */
export function groupTitle<T>(config: DataGridConfig<T>, group: { value: unknown; rows: T[] }, field = groupFields(config.groupBy)[0] ?? '', level = 0): string {
    if (config.groupLabel) return config.groupLabel({ value: group.value, count: group.rows.length, rows: group.rows, field, level });
    return group.value === null || group.value === undefined || group.value === '' ? '—' : String(group.value);
}

/** Whether anything is being filtered, which decides which empty message is shown. */
export function hasActiveFilter(filters: FilterMeta): boolean {
    return Object.values(filters).some((filter) => (isComposite(filter) ? filter.constraints.some((c) => !isBlankFilter(c.value)) : !isBlankFilter(filter.value)));
}

/** A column takes a filter box when it has a field to filter and a filter to put in it. */
export function isFilterable(column: ResolvedColumn, filters: FilterMeta): boolean {
    // A list of values is ticked in its panel; a box in the row could not hold it.
    if (column.column.filter === 'set' && !column.column.filterContent) return false;
    return !column.selectionMode && !!column.filterField && (!!column.column.filterContent || !!column.column.filter || !!filters[column.filterField]);
}

export const selectionKind = (config: DataGridConfig, columns: ResolvedColumn[]): 'single' | 'multiple' | undefined =>
    columns.find((column) => column.selectionMode)?.selectionMode ?? config.selectionMode;

export const rowSelected = (config: DataGridConfig, models: DataGridModels, kind: 'single' | 'multiple' | undefined, row: unknown): boolean =>
    !!kind && isSelected(models.selection, row, kind, config.dataKey);

export const allSelectedState = (config: DataGridConfig, models: DataGridModels, rows: readonly unknown[]) => selectionState(rows, models.selection, config.dataKey);

/** The key a row is drawn under: its `dataKey` field, or where it sits. */
export const rowKey = (config: DataGridConfig, row: unknown, index: number, offset: number): string | number =>
    config.dataKey ? String(getField(row, config.dataKey)) : offset + index;

/** What a row's open detail is remembered by: its `dataKey` value as it is, so `[7]` means the row whose id is 7. */
export const expansionKey = (config: DataGridConfig, row: unknown, index: number, offset: number): string | number =>
    config.dataKey ? (getField(row, config.dataKey) as string | number) : offset + index;

/** Whether a key is among the open ones, a number and its text being the same key. */
export const isExpanded = (keys: readonly (string | number)[] | undefined, key: string | number): boolean => (keys ?? []).some((k) => String(k) === String(key));

/** The text of a cell that draws itself no other way. */
export function cellText(value: unknown, locale?: string): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString(locale);
    return String(value);
}
