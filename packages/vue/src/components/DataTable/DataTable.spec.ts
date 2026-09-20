import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Column from './Column.vue';
import DataTable from './DataTable.vue';
import { DataTableEmpty, DataTableHeader } from './parts';

const people = () => [
    { id: 3, name: 'Ada', role: 'Engineer', seats: 9 },
    { id: 1, name: 'Grace', role: 'Admiral', seats: 40 },
    { id: 2, name: 'Alan', role: 'Engineer', seats: 10 }
];

function mountTable(props: Record<string, unknown> = {}, children?: () => unknown[]) {
    const sortField = ref<string | null>(null);
    const sortOrder = ref<1 | -1 | null>(null);
    mountVt(
        defineComponent(() => () =>
            h(
                DataTable,
                {
                    value: people(),
                    dataKey: 'id',
                    'aria-label': 'People',
                    ...props,
                    sortField: sortField.value,
                    'onUpdate:sortField': (v: string | null) => (sortField.value = v),
                    sortOrder: sortOrder.value,
                    'onUpdate:sortOrder': (v: 1 | -1 | null) => (sortOrder.value = v)
                },
                children ?? (() => [h(Column, { field: 'name', header: 'Name', sortable: true }), h(Column, { field: 'seats', header: 'Seats', sortable: true, align: 'right' })])
            )
        )
    );
    const table = () => document.querySelector<HTMLTableElement>('.vt-datatable-table')!;
    const headers = () => [...document.querySelectorAll<HTMLElement>('.vt-datatable-header-cell')];
    const column = (index: number) => [...document.querySelectorAll('.vt-datatable-tbody tr')].map((r) => r.children[index]!.textContent);
    return { table, headers, column, sortField, sortOrder };
}

describe('DataTable, the small one', () => {
    it('is a real table: a column each, named by its header', async () => {
        const { table, headers, column } = mountTable();
        expect(table().getAttribute('aria-label')).toBe('People');
        expect(headers().map((h) => h.textContent?.trim())).toEqual(['Name', 'Seats']);
        expect(headers().every((h) => h.tagName === 'TH' && h.getAttribute('scope') === 'col')).toBe(true);
        // The rows arrive in the order they were given, not sorted behind the reader's back.
        expect(column(0)).toEqual(['Ada', 'Grace', 'Alan']);
        expect(headers()[1]!.classList.contains('vt-datatable-align-right')).toBe(true);
        await expectNoA11yViolations();
    });

    it('sorts a column up, then down, then back to the order the rows came in', async () => {
        const { headers, column, sortField, sortOrder } = mountTable();
        const sort = headers()[0]!.querySelector('button')!;
        expect(headers()[0]!.getAttribute('aria-sort')).toBe('none');

        sort.click();
        await nextTick();
        expect(column(0)).toEqual(['Ada', 'Alan', 'Grace']);
        expect(headers()[0]!.getAttribute('aria-sort')).toBe('ascending');
        expect([sortField.value, sortOrder.value]).toEqual(['name', 1]);

        headers()[0]!.querySelector('button')!.click();
        await nextTick();
        expect(column(0)).toEqual(['Grace', 'Alan', 'Ada']);
        expect(headers()[0]!.getAttribute('aria-sort')).toBe('descending');

        // A third press puts the table back, so a reader who sorted by mistake can undo it.
        headers()[0]!.querySelector('button')!.click();
        await nextTick();
        expect(column(0)).toEqual(['Ada', 'Grace', 'Alan']);
        expect(headers()[0]!.getAttribute('aria-sort')).toBe('none');
        expect([sortField.value, sortOrder.value]).toEqual([null, null]);
    });

    it('sorts numbers as numbers and only ever by one column', async () => {
        const { headers, column } = mountTable();
        headers()[1]!.querySelector('button')!.click();
        await nextTick();
        expect(column(1)).toEqual(['9', '10', '40']);
        // The second column takes over rather than joining: that is the grid's job.
        headers()[0]!.querySelector('button')!.click();
        await nextTick();
        expect(headers()[1]!.getAttribute('aria-sort')).toBe('none');
        expect(column(0)).toEqual(['Ada', 'Alan', 'Grace']);
    });

    it('gives a column with no field no sort button at all', () => {
        mountTable({}, () => [h(Column, { header: 'Name' }), h(Column, { header: 'Actions', sortable: true })]);
        expect(document.querySelectorAll('.vt-datatable-sort-button')).toHaveLength(0);
    });

    it('takes a cell body from a slot, and says so when there is nothing to show', async () => {
        mountTable({ value: [] }, () => [h(Column, { field: 'name', header: 'Name' })]);
        const empty = document.querySelector('.vt-datatable-empty-cell')!;
        expect(empty.getAttribute('colspan')).toBe('1');
        // The same words DataGrid says when it has no rows.
        expect(empty.textContent).toBe('No available options');

        mountTable({}, () => [h(Column, { field: 'name', header: 'Name' }, { body: ({ data }: { data: { name: string } }) => [h('b', `${data.name}!`)] })]);
        await nextTick();
        expect([...document.querySelectorAll('.vt-datatable-tbody b')].map((b) => b.textContent)).toEqual(['Ada!', 'Grace!', 'Alan!']);
    });

    it('places the parts written as children where each one belongs', async () => {
        mountTable({ value: [] }, () => [h(Column, { field: 'name', header: 'Name' }), h(DataTableHeader, null, () => 'Team'), h(DataTableEmpty, null, () => 'Nobody yet')]);
        await nextTick();
        expect(document.querySelector('.vt-datatable-header')!.textContent).toBe('Team');
        expect(document.querySelector('.vt-datatable-empty-cell')!.textContent).toBe('Nobody yet');
    });

    it('wears the looks it is asked for', async () => {
        mountTable({ stripedRows: true, showGridlines: true, size: 'small', rowHover: true, scrollHeight: '12rem' });
        const root = document.querySelector('.vt-datatable')!;
        expect([...root.classList]).toEqual(expect.arrayContaining(['vt-datatable-striped', 'vt-datatable-gridlines', 'vt-datatable-sm', 'vt-datatable-scrollable']));
        expect(document.querySelector<HTMLElement>('.vt-datatable-table-container')!.style.maxHeight).toBe('12rem');
        expect(document.querySelector('.vt-datatable-tbody tr')!.classList.contains('vt-datatable-row-hoverable')).toBe(true);
    });
});
