import { createDataSource } from '@vitral/core';
import { describe, expect, it } from 'vitest';
import { allSelectedState, cellText, defaultModels, hasActiveFilter, isFilterable, loadRequest, modeOf, resolveRows, rowKey, rowSelected, selectionKind, sortsOf, tableColumns, tableLayout } from './state';
import type { DataGridColumn, DataGridConfig, DataGridModels } from './types';

interface Row {
    id: number;
    name: string;
    city: string;
}

const rows: Row[] = [
    { id: 1, name: 'Ana', city: 'Recife' },
    { id: 2, name: 'Bruno', city: 'Lisboa' },
    { id: 3, name: 'Carla', city: 'Porto' }
];

const columns: DataGridColumn<Row>[] = [{ field: 'name', header: 'Name' }, { field: 'city', header: 'City' }, { key: 'actions' }];
const models = (over: Partial<DataGridModels> = {}): DataGridModels => ({ ...defaultModels(), ...over });

describe('the columns a table draws', () => {
    it('are named by their key, their field, or where they sit', () => {
        expect(tableColumns({ columns }, models()).map((column) => column.key)).toEqual(['name', 'city', 'actions']);
        expect(tableColumns({ columns: [{ header: 'Anonymous' }] }, models()).map((column) => column.key)).toEqual(['column-0']);
    });

    it('take the widths and pins the columns declared, until the reader changes them', () => {
        const declared: DataGridColumn<Row>[] = [
            { field: 'name', width: 120, pinned: 'left' },
            { field: 'city', width: 200 }
        ];
        expect(tableLayout({ columns: declared }, models())).toMatchObject({ widths: { name: 120, city: 200 }, pinned: { name: 'left' } });
        // What the reader changed wins, column by column.
        const layout = tableLayout({ columns: declared }, models({ columnLayout: { widths: { city: 80 } } }));
        expect(layout.widths).toEqual({ name: 120, city: 80 });
    });

    it('leave out what is hidden, in the declaration and in the layout', () => {
        expect(tableColumns({ columns: [{ field: 'name' }, { field: 'city', hidden: true }] }, models()).map((c) => c.key)).toEqual(['name']);
        expect(tableColumns({ columns }, models({ columnLayout: { hidden: ['city'] } })).map((c) => c.key)).toEqual(['name', 'actions']);
    });

    it('stand at the edge they are pinned to, each behind the one before it', () => {
        const pinned = tableColumns({ columns }, models({ columnLayout: { widths: { name: 100, city: 80 }, pinned: { name: 'left', city: 'left' } } }));
        expect(pinned[0]!.sticky).toEqual({ side: 'left', offset: 0, last: false });
        expect(pinned[1]!.sticky).toEqual({ side: 'left', offset: 100, last: true });
        expect(pinned[2]!.sticky).toBeUndefined();
    });

    it('sort and filter by their own field when they are given one', () => {
        const [column] = tableColumns({ columns: [{ field: 'address.city', sortField: 'city', filterField: 'cityName', header: 'City' }] }, models());
        expect(column).toMatchObject({ key: 'address.city', sortField: 'city', filterField: 'cityName', header: 'City' });
    });
});

describe('what the table asks for', () => {
    it('is the same request whoever answers it', () => {
        const config: DataGridConfig<Row> = { paginator: true, globalFilterFields: ['name', 'city'] };
        const request = loadRequest(config, models({ first: 20, rows: 10, sortField: 'name', sortOrder: -1 }), {
            city: { value: 'por', matchMode: 'contains' },
            global: { value: 'an', matchMode: 'contains' }
        });
        expect(request).toEqual({
            first: 20,
            rows: 10,
            sort: [{ field: 'name', order: -1 }],
            filters: { city: { value: 'por', matchMode: 'contains' } },
            globalFilter: { value: 'an', fields: ['name', 'city'], matchMode: 'contains' },
            locale: undefined
        });
    });

    it('carries no page when there is no paginator', () => {
        expect(loadRequest({}, models({ first: 20 }), {})).toMatchObject({ first: undefined, rows: undefined });
    });

    it('holds every sort when several are allowed', () => {
        const multi = models({ multiSortMeta: [{ field: 'city', order: 1 }, { field: 'name', order: -1 }], sortField: 'name', sortOrder: 1 });
        expect(sortsOf({ sortMode: 'multiple' }, multi)).toHaveLength(2);
        expect(sortsOf({}, multi)).toEqual([{ field: 'name', order: 1 }]);
    });

    it('knows who answers it', () => {
        expect(modeOf({})).toBe('local');
        expect(modeOf({ lazy: true })).toBe('lazy');
        expect(modeOf({ dataSource: createDataSource<Row>([]) })).toBe('source');
    });
});

describe('the rows to draw', () => {
    it('are queried here when the data is here', () => {
        const resolved = resolveRows({ value: rows, paginator: true }, models({ rows: 2, sortField: 'name', sortOrder: -1 }), {});
        expect(resolved.page.map((row) => row.name)).toEqual(['Carla', 'Bruno']);
        // Select-all covers everything the query matched, not just the page.
        expect(resolved.all).toHaveLength(3);
        expect(resolved.total).toBe(3);
    });

    it('are taken as given when the host is doing the work', () => {
        const lazy = resolveRows({ value: rows.slice(0, 1), lazy: true, totalRecords: 97, paginator: true }, models({ first: 40 }), {});
        expect(lazy).toMatchObject({ page: [rows[0]], total: 97, offset: 40 });
    });

    it('are what a data source last answered, and nothing before it answers', () => {
        const config: DataGridConfig<Row> = { dataSource: createDataSource(rows) };
        expect(resolveRows(config, models(), {})).toMatchObject({ page: [], total: 0 });
        expect(resolveRows(config, models(), {}, { items: rows, total: 3 })).toMatchObject({ page: rows, total: 3 });
    });
});

describe('what a table says about itself', () => {
    it('tells an empty table from one filtered down to nothing', () => {
        expect(hasActiveFilter({ city: { value: null, matchMode: 'contains' } })).toBe(false);
        expect(hasActiveFilter({ city: { value: 'por', matchMode: 'contains' } })).toBe(true);
        expect(hasActiveFilter({ city: { operator: 'and', constraints: [{ value: '', matchMode: 'contains' }] } })).toBe(false);
        expect(hasActiveFilter({ city: { operator: 'and', constraints: [{ value: 'por', matchMode: 'contains' }] } })).toBe(true);
    });

    it('gives a filter box to a column that has something to filter', () => {
        const [name, city, actions] = tableColumns({ columns }, models());
        const filters = { name: { value: null, matchMode: 'contains' } };
        expect(isFilterable(name!, filters)).toBe(true);
        expect(isFilterable(city!, filters)).toBe(false);
        // A column with no field has nothing to filter by, however it is asked.
        expect(isFilterable(actions!, { actions: { value: null, matchMode: 'contains' } })).toBe(false);
    });

    it('selects the way the table or the column says', () => {
        const declared = tableColumns({ columns: [{ selectionMode: 'multiple' }, ...columns] }, models());
        expect(selectionKind({}, declared)).toBe('multiple');
        expect(selectionKind({ selectionMode: 'single' }, tableColumns({ columns }, models()))).toBe('single');
        expect(selectionKind({}, tableColumns({ columns }, models()))).toBeUndefined();
    });

    it('knows a selected row by its key, not by the object it was given', () => {
        const config: DataGridConfig<Row> = { dataKey: 'id' };
        const state = models({ selection: [{ id: 2, name: 'Bruno', city: 'Lisboa' }] });
        expect(rowSelected(config, state, 'multiple', rows[1])).toBe(true);
        expect(rowSelected(config, state, 'multiple', rows[0])).toBe(false);
        // With no kind, nothing is selected however full the model is.
        expect(rowSelected(config, state, undefined, rows[1])).toBe(false);
    });

    it('reports select-all as all, some or none', () => {
        expect(allSelectedState({ dataKey: 'id' }, models({ selection: rows }), rows)).toBe('all');
        expect(allSelectedState({ dataKey: 'id' }, models({ selection: [rows[0]] }), rows)).toBe('some');
        expect(allSelectedState({ dataKey: 'id' }, models({ selection: [] }), rows)).toBe('none');
    });

    it('keys a row by its data key, or by where it is on the page', () => {
        expect(rowKey({ dataKey: 'id' }, rows[2], 2, 10)).toBe('3');
        expect(rowKey({}, rows[2], 2, 10)).toBe(12);
    });

    it('writes a cell nothing else drew', () => {
        expect(cellText('Recife')).toBe('Recife');
        expect(cellText(0)).toBe('0');
        expect(cellText(null)).toBe('');
        expect(cellText(undefined)).toBe('');
        expect(cellText(new Date(Date.UTC(2024, 4, 17)), 'en-GB')).toContain('2024');
    });
});
