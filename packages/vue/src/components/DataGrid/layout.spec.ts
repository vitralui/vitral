import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mountVt } from '../../../test/utils';
import Column from './Column.vue';
import ColumnGroup from './ColumnGroup.vue';
import DataGrid from './DataGrid.vue';
import { DataGrid as DataGridParts } from './index';

const sales = [
    { id: 1, product: 'Desk', q1: 4, q2: 6 },
    { id: 2, product: 'Lamp', q1: 10, q2: 3 }
];

function mount(props: Record<string, unknown>, columns: () => unknown[]) {
    const wrapper = mountVt(defineComponent(() => () => h(DataGrid, { 'aria-label': 'Sales', value: sales, dataKey: 'id', ...props }, { default: columns })));
    return { wrapper, root: wrapper.element as HTMLElement };
}

describe('DataGrid: groups of columns, pinned rows and the rows drawn', () => {
    it('draws a <ColumnGroup> as a heading over its columns, with its own header slot', async () => {
        const { root, wrapper } = mount({}, () => [
            h(Column, { field: 'product', header: 'Product' }),
            h(ColumnGroup, { header: 'Units' }, { default: () => [h(Column, { field: 'q1', header: 'Q1' }), h(Column, { field: 'q2', header: 'Q2' })], header: () => 'Units sold' })
        ]);
        await nextTick();
        const group = root.querySelector('thead th[data-group]') as HTMLTableCellElement;
        expect(group.textContent).toBe('Units sold');
        expect(group.colSpan).toBe(2);
        expect(Array.from(root.querySelectorAll('thead th[data-column]')).map((th) => th.getAttribute('data-column'))).toEqual(['product', 'q1', 'q2']);
        expect(Array.from(root.querySelectorAll('tbody tr:first-child td')).map((td) => td.textContent)).toEqual(['Desk', '4', '6']);
        wrapper.unmount();
    });

    it('is a part of the table too: <DataGrid.ColumnGroup>', () => {
        expect(DataGridParts.ColumnGroup).toBe(ColumnGroup);
    });

    it('holds pinned rows, which a body slot can tell apart', async () => {
        const { root, wrapper } = mount({ pinnedBottomRows: ({ rows }: { rows: typeof sales }) => [{ id: 0, product: 'Total', q1: rows.reduce((s, r) => s + r.q1, 0), q2: 0 }] }, () => [
            h(Column, { field: 'product', header: 'Product' }),
            h(Column, { field: 'q1', header: 'Q1' }, { body: ({ data, pinned }: { data: { q1: number }; pinned?: string }) => (pinned ? `Σ ${data.q1}` : String(data.q1)) })
        ]);
        await nextTick();
        expect(Array.from(root.querySelectorAll('tfoot .vt-datagrid-pinned-row td')).map((td) => td.textContent)).toEqual(['Total', 'Σ 14']);
        expect(Array.from(root.querySelectorAll('tbody td:nth-child(2)')).map((td) => td.textContent)).toEqual(['4', '10']);
        wrapper.unmount();
    });

    it('draws only the rows in view with virtual-scroll, and scrolls to one on request', async () => {
        const many = Array.from({ length: 2000 }, (_, i) => ({ id: i, product: `P${i}`, q1: i, q2: 0 }));
        const grid = { value: null as null | { scrollToIndex: (index: number) => void } };
        const wrapper = mountVt(
            defineComponent(() => () => h(DataGrid, { ref: (el: unknown) => (grid.value = el as typeof grid.value), 'aria-label': 'Many', value: many, dataKey: 'id', virtualScroll: true, rowHeight: 30 }, () => [h(Column, { field: 'product', header: 'Product' })]))
        );
        await nextTick();
        const root = wrapper.element as HTMLElement;
        expect(root.querySelectorAll('tbody tr[data-index]').length).toBeLessThan(40);
        expect(root.querySelector('table')!.getAttribute('aria-rowcount')).toBe('2001');
        grid.value!.scrollToIndex(1500);
        expect(root.querySelector('tr[data-index="1500"]')).not.toBeNull();
        wrapper.unmount();
    });

    it('filters when a search box changes the bound filters in place', async () => {
        const filters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
        const wrapper = mountVt(
            defineComponent(
                () => () =>
                    h(DataGrid, { 'aria-label': 'Sales', value: sales, dataKey: 'id', globalFilterFields: ['product'], filters: filters.value, 'onUpdate:filters': (v: unknown) => (filters.value = v as typeof filters.value) }, () => [
                        h(Column, { field: 'product', header: 'Product' })
                    ])
            )
        );
        await nextTick();
        filters.value.global.value = 'lam';
        await nextTick();
        await nextTick();
        const root = wrapper.element as HTMLElement;
        expect(Array.from(root.querySelectorAll('tbody td')).map((td) => td.textContent)).toEqual(['Lamp']);
        wrapper.unmount();
    });
});
