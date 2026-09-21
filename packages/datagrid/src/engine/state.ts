import {
    flattenGroups,
    getField,
    groupRows,
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
    type GroupedRow,
    type SortMeta
} from '@vitral/core';
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
    collapsedGroups: []
});

/** The columns as declared, before the reader's layout: hidden ones are already out. */
export function declaredColumns<T>(config: DataGridConfig<T>): { column: DataGridColumn<T>; key: string }[] {
    return (config.columns ?? []).filter((column) => !column.hidden).map((column, index) => ({ column, key: keyOf(column, index) }));
}

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
    return { order: given.order, hidden: given.hidden ?? [], widths, pinned };
}

/** The columns to draw, in order, with their widths and sticky offsets. */
export function tableColumns<T>(config: DataGridConfig<T>, models: DataGridModels): ResolvedColumn<T>[] {
    const declared = declaredColumns(config);
    const layout = tableLayout(config, models);
    const byKey = new Map(declared.map((entry) => [entry.key, entry.column]));
    const order = orderColumns(
        declared.map((entry) => entry.key),
        layout
    );
    const sticky = stickyOffsets(order, layout);
    return order
        .filter((key) => byKey.has(key))
        .map((key) => {
            const column = byKey.get(key)!;
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
                selectionMode: column.selectionMode
            };
        });
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
export function linesOf<T>(config: DataGridConfig<T>, models: DataGridModels, page: T[]): GroupedRow<T>[] {
    if (!config.groupBy) return page.map((row, index) => ({ kind: 'row', row, index }));
    const groups = groupRows(page, config.groupBy);
    return flattenGroups(groups, page, new Set(models.collapsedGroups ?? []));
}

/** What a group's heading says: what the template asked for, or the value itself. */
export function groupTitle<T>(config: DataGridConfig<T>, group: { value: unknown; rows: T[] }): string {
    if (config.groupLabel) return config.groupLabel({ value: group.value, count: group.rows.length, rows: group.rows });
    return group.value === null || group.value === undefined || group.value === '' ? '—' : String(group.value);
}

/** Whether anything is being filtered, which decides which empty message is shown. */
export function hasActiveFilter(filters: FilterMeta): boolean {
    return Object.values(filters).some((filter) => (isComposite(filter) ? filter.constraints.some((c) => !isBlankFilter(c.value)) : !isBlankFilter(filter.value)));
}

/** A column takes a filter box when it has a field to filter and a filter to put in it. */
export function isFilterable(column: ResolvedColumn, filters: FilterMeta): boolean {
    return !column.selectionMode && !!column.filterField && (!!column.column.filterContent || !!filters[column.filterField]);
}

export const selectionKind = (config: DataGridConfig, columns: ResolvedColumn[]): 'single' | 'multiple' | undefined =>
    columns.find((column) => column.selectionMode)?.selectionMode ?? config.selectionMode;

export const rowSelected = (config: DataGridConfig, models: DataGridModels, kind: 'single' | 'multiple' | undefined, row: unknown): boolean =>
    !!kind && isSelected(models.selection, row, kind, config.dataKey);

export const allSelectedState = (config: DataGridConfig, models: DataGridModels, rows: readonly unknown[]) => selectionState(rows, models.selection, config.dataKey);

/** The key a row is drawn under: its `dataKey` field, or where it sits. */
export const rowKey = (config: DataGridConfig, row: unknown, index: number, offset: number): string | number =>
    config.dataKey ? String(getField(row, config.dataKey)) : offset + index;

/** The text of a cell that draws itself no other way. */
export function cellText(value: unknown, locale?: string): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString(locale);
    return String(value);
}
