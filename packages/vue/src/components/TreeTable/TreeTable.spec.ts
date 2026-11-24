import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Column from '../DataGrid/Column.vue';
import type { TreeNodeLike, TreeSelectionKeys } from '../Tree/types';
import TreeTable from './TreeTable.vue';

const files = (): TreeNodeLike[] => [
    {
        key: 'app',
        data: { name: 'Applications', size: 300 },
        children: [
            { key: 'vue', data: { name: 'Vue', size: 25 } },
            { key: 'cli', data: { name: 'CLI', size: 80 }, children: [{ key: 'cli-bin', data: { name: 'bin', size: 10 } }] }
        ]
    },
    { key: 'docs', data: { name: 'Documents', size: 75 }, children: [{ key: 'cv', data: { name: 'CV.pdf', size: 1 } }] },
    { key: 'music', data: { name: 'Music', size: 500 } }
];

function mountTable(props: Record<string, unknown> = {}) {
    const expanded = ref<Record<string, boolean>>((props.expandedKeys as Record<string, boolean>) ?? {});
    const selection = ref<TreeSelectionKeys>({});
    const sortField = ref<string | null>(null);
    const sortOrder = ref<1 | -1 | null>(null);
    mountVt(
        defineComponent(() => () =>
            h(
                TreeTable,
                {
                    value: files(),
                    'aria-label': 'Files',
                    ...props,
                    expandedKeys: expanded.value,
                    'onUpdate:expandedKeys': (v: Record<string, boolean>) => (expanded.value = v),
                    selectionKeys: selection.value,
                    'onUpdate:selectionKeys': (v: TreeSelectionKeys) => (selection.value = v),
                    sortField: sortField.value,
                    'onUpdate:sortField': (v: string | null) => (sortField.value = v),
                    sortOrder: sortOrder.value,
                    'onUpdate:sortOrder': (v: 1 | -1 | null) => (sortOrder.value = v)
                },
                () => [h(Column, { field: 'name', header: 'Name', expander: true, sortable: true }), h(Column, { field: 'size', header: 'Size', sortable: true, align: 'right' })]
            )
        )
    );
    const rows = () => Array.from(document.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    const names = () => rows().map((r) => r.cells[0]!.textContent?.trim());
    const row = (name: string) => rows().find((r) => r.cells[0]!.textContent?.trim() === name)!;
    const key = async (k: string) => {
        await press(document.activeElement!, k);
        await nextTick();
        await nextTick();
    };
    return { expanded, selection, sortField, rows, names, row, key };
}

describe('TreeTable', () => {
    it('is a named treegrid whose rows carry level, position and expansion', () => {
        const { rows } = mountTable();
        const table = document.querySelector('table')!;
        expect(table.getAttribute('role')).toBe('treegrid');
        expect(table.getAttribute('aria-label')).toBe('Files');
        const first = rows()[0]!;
        expect(first.getAttribute('aria-level')).toBe('1');
        expect(first.getAttribute('aria-posinset')).toBe('1');
        expect(first.getAttribute('aria-setsize')).toBe('3');
        expect(first.getAttribute('aria-expanded')).toBe('false');
        expect(rows()[2]!.hasAttribute('aria-expanded')).toBe(false);
        expect(rows().map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    });

    it('walks the rows with the treegrid keys', async () => {
        const { row, key, names, expanded } = mountTable();
        row('Applications').focus();
        await key('ArrowRight');
        expect(expanded.value).toEqual({ app: true });
        expect(names()).toEqual(['Applications', 'Vue', 'CLI', 'Documents', 'Music']);
        expect(row('Vue').getAttribute('aria-level')).toBe('2');
        await key('ArrowRight');
        expect(document.activeElement).toBe(row('Vue'));
        await key('ArrowDown');
        await key('ArrowRight');
        await key('ArrowRight');
        expect(document.activeElement).toBe(row('bin'));
        await key('ArrowLeft');
        expect(document.activeElement).toBe(row('CLI'));
        await key('End');
        expect(document.activeElement).toBe(row('Music'));
        await key('Home');
        await key('ArrowLeft');
        expect(names()).toEqual(['Applications', 'Documents', 'Music']);
    });

    it('selects rows with Space and the pointer, and checks branches in checkbox mode', async () => {
        const single = mountTable({ selectionMode: 'single' });
        single.row('Music').focus();
        await single.key(' ');
        expect(single.selection.value).toEqual({ music: true });
        expect(single.row('Music').getAttribute('aria-selected')).toBe('true');
        single.row('Documents').click();
        await nextTick();
        expect(single.selection.value).toEqual({ docs: true });
    });

    it('checks a branch and its children', async () => {
        const { row, key, selection } = mountTable({ selectionMode: 'checkbox', expandedKeys: { docs: true } });
        expect(document.querySelector('table')!.getAttribute('aria-multiselectable')).toBe('true');
        row('Documents').focus();
        await key(' ');
        expect(selection.value).toMatchObject({ docs: { checked: true }, cv: { checked: true } });
        expect(row('CV.pdf').getAttribute('aria-selected')).toBe('true');
    });

    it('sorts each level, keeping the nesting, and reports it on the header', async () => {
        const { names, sortField } = mountTable({ expandedKeys: { app: true } });
        const size = Array.from(document.querySelectorAll<HTMLButtonElement>('th button')).find((b) => b.textContent?.includes('Size'))!;
        size.click();
        await nextTick();
        expect(sortField.value).toBe('size');
        expect(names()).toEqual(['Documents', 'Applications', 'Vue', 'CLI', 'Music']);
        expect(size.closest('th')!.getAttribute('aria-sort')).toBe('ascending');
        size.click();
        await nextTick();
        expect(names()).toEqual(['Music', 'Applications', 'CLI', 'Vue', 'Documents']);
    });

    it('filters to the matching rows and the branches above them', () => {
        const { names } = mountTable({ globalFilter: 'bin', globalFilterFields: ['name'] });
        expect(names()).toEqual(['Applications', 'CLI', 'bin']);
    });

    it('lets a branch the filter opened be closed and opened again', async () => {
        const { names, row } = mountTable({ globalFilter: 'bin', globalFilterFields: ['name'] });
        row('CLI').focus();
        await press(row('CLI'), 'ArrowLeft');
        await nextTick();
        expect(names()).toEqual(['Applications', 'CLI']);
        await press(row('CLI'), 'ArrowRight');
        await nextTick();
        expect(names()).toEqual(['Applications', 'CLI', 'bin']);
    });

    it('has no accessibility violations', async () => {
        mountTable({ selectionMode: 'checkbox', expandedKeys: { app: true }, paginator: true, rows: 2 });
        await expectNoA11yViolations();
    });
});

describe('TreeTable totals and the whole tree at once', () => {
    function mountTotals(props: Record<string, unknown> = {}, sizeSlots: Record<string, unknown> = {}) {
        const table = ref<{ expandAll: () => void; collapseAll: () => void } | null>(null);
        const expanded = ref<Record<string, boolean>>({ app: true, cli: true, docs: true });
        mountVt(
            defineComponent(() => () =>
                h(
                    TreeTable,
                    {
                        ref: table,
                        value: files(),
                        'aria-label': 'Files',
                        expandedKeys: expanded.value,
                        'onUpdate:expandedKeys': (v: Record<string, boolean>) => (expanded.value = v),
                        ...props
                    },
                    () => [h(Column, { field: 'name', header: 'Name', expander: true }), h(Column, { field: 'size', header: 'Size', aggregate: 'sum', align: 'right' }, sizeSlots)]
                )
            )
        );
        const sizes = () => Object.fromEntries(Array.from(document.querySelectorAll<HTMLTableRowElement>('tbody tr'), (r) => [r.cells[0]!.textContent?.trim(), r.cells[1]!.textContent?.trim()]));
        return { table, expanded, sizes };
    }

    it('puts on each row with rows under it the total of the rows its branches end in', () => {
        const { sizes } = mountTotals();
        expect(sizes()).toEqual({ Applications: '35', Vue: '25', CLI: '10', bin: '10', Documents: '1', 'CV.pdf': '1', Music: '500' });
        expect(document.querySelectorAll('.vt-treetable-body-cell-total')).toHaveLength(3);
    });

    it('hands every cell of a parent row its totals, so a column worked out from them holds there', () => {
        mountVt(
            defineComponent(() => () =>
                h(TreeTable, { value: files(), 'aria-label': 'Files', expandedKeys: { app: true } }, () => [
                    h(Column, { field: 'name', header: 'Name', expander: true }),
                    h(Column, { field: 'size', header: 'Size', aggregate: 'sum' }),
                    h(Column, { columnKey: 'kb', header: 'KB' }, { body: ({ data }: { data: { size: number } }) => `${data.size * 1024}` })
                ])
            )
        );
        const kb = Array.from(document.querySelectorAll<HTMLTableRowElement>('tbody tr'), (r) => r.cells[2]!.textContent);
        // Applications: 25 + 10, not its own 300.
        expect(kb.slice(0, 3)).toEqual(['35840', '25600', '10240']);
    });

    it('adds up only what a filter left, and draws a total through the body slot', async () => {
        const { sizes } = mountTotals({ globalFilter: 'v', globalFilterFields: ['name'] }, { body: ({ data }: { data: { size: number } }) => `${data.size} KB` });
        await nextTick();
        expect(sizes()).toEqual({ Applications: '25 KB', Vue: '25 KB', Documents: '1 KB', 'CV.pdf': '1 KB' });
    });

    it('draws a total through the aggregate slot when there is one', () => {
        const { sizes } = mountTotals({}, { aggregate: ({ value, rows }: { value: number; rows: unknown[] }) => `${value} in ${rows.length}` });
        expect(sizes().Applications).toBe('35 in 2');
        expect(sizes().Vue).toBe('25');
    });

    it('opens and closes every row at once', async () => {
        const { table, expanded } = mountTotals();
        table.value!.collapseAll();
        await nextTick();
        expect(document.querySelectorAll('tbody tr')).toHaveLength(3);
        table.value!.expandAll();
        await nextTick();
        expect(expanded.value).toEqual({ app: true, cli: true, docs: true });
        expect(document.querySelectorAll('tbody tr')).toHaveLength(7);
    });
});
