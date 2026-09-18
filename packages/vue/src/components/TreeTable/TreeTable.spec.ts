import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Column from '../DataTable/Column.vue';
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
