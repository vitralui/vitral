import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { aggregateOf, groupLines, treeRows, childrenOf } from './engine/rows';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Sale {
    id: number;
    region: string;
    country: string;
    rep: string;
    amount: number;
}

const sales: Sale[] = [
    { id: 1, region: 'Europe', country: 'Portugal', rep: 'Ana', amount: 100 },
    { id: 2, region: 'Europe', country: 'Spain', rep: 'Bruno', amount: 250 },
    { id: 3, region: 'Americas', country: 'Brazil', rep: 'Carla', amount: 400 },
    { id: 4, region: 'Europe', country: 'Portugal', rep: 'Diego', amount: 50 },
    { id: 5, region: 'Americas', country: 'Brazil', rep: 'Elisa', amount: 30 }
];

interface Folder {
    id: string;
    name: string;
    size: number;
    children?: Folder[];
}

const files = (): Folder[] => [
    {
        id: 'src',
        name: 'src',
        size: 120,
        children: [
            { id: 'app', name: 'app.ts', size: 40 },
            { id: 'lib', name: 'lib', size: 80, children: [{ id: 'util', name: 'util.ts', size: 80 }] }
        ]
    },
    { id: 'readme', name: 'README.md', size: 4 },
    { id: 'docs', name: 'docs', size: 30, children: [{ id: 'guide', name: 'guide.md', size: 30 }] }
];

let handle: DataGridHandle<never> | null = null;

function mount<T>(config: Record<string, unknown>) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createDataGrid<T>(element, { dataKey: 'id', ariaLabel: 'Grid', ...config }) as unknown as DataGridHandle<never>;
    const texts = (selector: string) => Array.from(element.querySelectorAll(selector), (node) => node.textContent?.trim());
    return { element, texts };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('groups inside groups', () => {
    it('heads each group at each level, a key joining it to its parents', () => {
        const lines = groupLines(sales, ['region', 'country'], new Set());
        expect(lines.map((line) => (line.kind === 'group' ? `${line.level}:${line.group.value}` : line.row.rep))).toEqual([
            '0:Europe',
            '1:Portugal',
            'Ana',
            'Diego',
            '1:Spain',
            'Bruno',
            '0:Americas',
            '1:Brazil',
            'Carla',
            'Elisa'
        ]);
        const brazil = lines.find((line) => line.kind === 'group' && line.group.value === 'Brazil')!;
        expect(brazil.kind === 'group' && brazil.group.key).toBe('Americas\u0001Brazil');
    });

    it('shuts a group with every group under it', () => {
        const lines = groupLines(sales, ['region', 'country'], new Set(['Europe']));
        expect(lines.filter((line) => line.kind === 'group').map((line) => line.kind === 'group' && line.group.value)).toEqual(['Europe', 'Americas', 'Brazil']);
    });

    it('works values out over a group’s rows, by name or by function', () => {
        const column = (aggregate: DataGridColumn<Sale>['aggregate']): DataGridColumn<Sale> => ({ field: 'amount', aggregate });
        expect(aggregateOf(column('sum'), sales)).toBe(830);
        expect(aggregateOf(column('avg'), sales)).toBe(166);
        expect(aggregateOf(column('min'), sales)).toBe(30);
        expect(aggregateOf(column('max'), sales)).toBe(400);
        expect(aggregateOf(column('count'), sales)).toBe(5);
        expect(aggregateOf(column(({ values }) => new Set(values).size), sales)).toBe(5);
        expect(aggregateOf({ field: 'when', aggregate: 'max' }, [{ when: new Date(2026, 0, 1) }, { when: new Date(2026, 5, 1) }])).toEqual(new Date(2026, 5, 1));
        expect(aggregateOf(column('sum'), [])).toBeNull();
    });

    it('draws the values under their columns on each heading', () => {
        const { element, texts } = mount<Sale>({
            value: sales,
            groupBy: ['region', 'country'],
            columns: [
                { field: 'rep', header: 'Rep' },
                { field: 'amount', header: 'Amount', aggregate: 'sum', align: 'right' }
            ]
        });
        expect(texts('.vt-datagrid-group-row td[data-aggregate="amount"]')).toEqual(['400', '150', '250', '430', '430']);
        const nested = element.querySelectorAll('.vt-datagrid-group-row')[1] as HTMLElement;
        expect(nested.querySelector('th')!.getAttribute('style')).toContain('--vt-datagrid-group-level: 1');
        (nested.querySelector('button') as HTMLButtonElement).click();
        expect(texts('tbody tr[data-index] td:first-child')).toEqual(['Bruno', 'Carla', 'Elisa']);
    });

    it('opens and shuts every group at once', () => {
        const { texts } = mount<Sale>({ value: sales, groupBy: ['region', 'country'], columns: [{ field: 'rep', header: 'Rep' }] });
        handle!.collapseAll();
        expect(texts('tbody tr[data-index]')).toEqual([]);
        expect(texts('.vt-datagrid-group-row')).toHaveLength(2);
        handle!.expandAll();
        expect(texts('tbody tr[data-index]')).toHaveLength(5);
    });

    it('is a table a screen reader can read', async () => {
        const { element } = mount<Sale>({ value: sales, groupBy: ['region', 'country'], columns: [{ field: 'rep', header: 'Rep' }, { field: 'amount', header: 'Amount', aggregate: 'sum' }] });
        await expectNoA11yViolations(element);
    });
});

describe('a tree', () => {
    const keyOf = (row: Folder) => row.id;

    it('shows a row’s rows only while it is open', () => {
        const shut = treeRows(files(), childrenOf<Folder>('children'), {}, new Set(), keyOf);
        expect(shut.rows.map((row) => row.name)).toEqual(['src', 'README.md', 'docs']);
        const open = treeRows(files(), childrenOf<Folder>('children'), {}, new Set(['src', 'lib']), keyOf);
        expect(open.rows.map((row) => row.name)).toEqual(['src', 'app.ts', 'lib', 'util.ts', 'README.md', 'docs']);
        expect(open.places.get(open.rows[3]!)).toMatchObject({ depth: 2, hasChildren: false, position: 1, siblings: 1 });
    });

    it('sorts the rows beside one another', () => {
        const sorted = treeRows(files(), childrenOf<Folder>('children'), { sort: [{ field: 'size', order: -1 }] }, new Set(['src']), keyOf);
        expect(sorted.rows.map((row) => row.name)).toEqual(['src', 'lib', 'app.ts', 'docs', 'README.md']);
    });

    it('keeps a match and the rows above it, the way down to it open', () => {
        const found = treeRows(files(), childrenOf<Folder>('children'), { filters: { name: { value: 'util', matchMode: 'contains' } } }, new Set(), keyOf);
        expect(found.rows.map((row) => row.name)).toEqual(['src', 'lib', 'util.ts']);
    });

    it('draws a toggle and the depth in the first column, and opens a row from it', () => {
        const toggles = vi.fn();
        const { element, texts } = mount<Folder>({
            value: files(),
            treeData: 'children',
            columns: [
                { field: 'name', header: 'Name' },
                { field: 'size', header: 'Size' }
            ],
            on: { 'tree-toggle': toggles }
        });
        expect(element.querySelector('table')!.getAttribute('role')).toBe('treegrid');
        const src = element.querySelector('tr[data-index="0"]')!;
        expect(src.getAttribute('aria-level')).toBe('1');
        expect(src.getAttribute('aria-expanded')).toBe('false');
        (element.querySelector('[data-tree-toggle="src"]') as HTMLButtonElement).click();
        expect(toggles).toHaveBeenCalledWith(expect.objectContaining({ key: 'src', expanded: true }));
        expect(texts('tbody tr[data-index] td:first-child')).toEqual(['src', 'app.ts', 'lib', 'README.md', 'docs']);
        const app = element.querySelector('tr[data-index="1"]')!;
        expect(app.getAttribute('aria-level')).toBe('2');
        expect(app.hasAttribute('aria-expanded')).toBe(false);
        expect((app.querySelector('.vt-datagrid-tree-cell') as HTMLElement).style.getPropertyValue('--vt-datagrid-tree-depth')).toBe('1');
    });

    it('opens on Enter and with the arrows from the keyboard', () => {
        const { element, texts } = mount<Folder>({
            value: files(),
            treeData: (row: Folder) => row.children,
            selectionMode: 'single',
            columns: [{ field: 'name', header: 'Name' }]
        });
        const row = () => element.querySelector('tr[data-index="0"]') as HTMLElement;
        row().focus();
        row().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(texts('tbody tr[data-index]')).toHaveLength(5);
        row().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        expect(texts('tbody tr[data-index]')).toHaveLength(3);
        handle!.expandAll();
        expect(texts('tbody tr[data-index]')).toHaveLength(7);
        handle!.collapseAll();
        expect(texts('tbody tr[data-index]')).toHaveLength(3);
    });

    it('is a tree a screen reader can read', async () => {
        const { element } = mount<Folder>({ value: files(), treeData: 'children', expandedTree: ['src'], columns: [{ field: 'name', header: 'Name' }] });
        await expectNoA11yViolations(element);
    });
});

describe('rows moved by their handle', () => {
    const columns = [{ key: 'drag', rowDrag: true }, { field: 'rep', header: 'Rep' }];

    it('moves a row with Ctrl and an arrow, handing the rows back in their new order', () => {
        const reorder = vi.fn();
        const { element } = mount<Sale>({ value: sales, columns, on: { 'row-reorder': reorder } });
        const grip = element.querySelector('tr[data-index="1"] [data-row-drag]') as HTMLElement;
        expect(grip.getAttribute('aria-label')).toBe('Move row');
        grip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true, cancelable: true }));
        const event = reorder.mock.calls[0]![0];
        expect(event).toMatchObject({ dragIndex: 1, dropIndex: 0 });
        expect(event.value.map((row: Sale) => row.rep)).toEqual(['Bruno', 'Ana', 'Carla', 'Diego', 'Elisa']);
        expect(element.querySelector('[aria-live]')!.textContent).toBe('Moved to row 1 of 5');
        // The host keeps the new order; the handle keeps the keyboard.
        handle!.update({ value: event.value } as never);
        expect(document.activeElement).toBe(element.querySelector('tr[data-index="0"] [data-row-drag]'));
    });

    it('moves a row dragged over another, before or after it', () => {
        const reorder = vi.fn();
        const { element } = mount<Sale>({ value: sales, columns, on: { 'row-reorder': reorder } });
        const drag = (type: string, target: Element, clientY = 0) => {
            const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
            Object.assign(event, { clientY, dataTransfer: null });
            target.dispatchEvent(event);
            return event;
        };
        drag('dragstart', element.querySelector('tr[data-index="0"] [data-row-drag]')!);
        expect(element.querySelector('tr[data-index="0"]')!.className).toContain('vt-datagrid-row-dragging');
        const target = element.querySelector('tr[data-index="3"] td')!;
        expect(drag('dragover', target, 100).defaultPrevented).toBe(true);
        expect(element.querySelector('tr[data-index="3"]')!.className).toContain('vt-datagrid-row-drop-after');
        drag('drop', target, 100);
        expect(reorder.mock.calls[0]![0].value.map((row: Sale) => row.rep)).toEqual(['Bruno', 'Carla', 'Diego', 'Ana', 'Elisa']);
    });
});

describe('the status bar', () => {
    it('counts the rows, the ones the filters let through and the ones selected', () => {
        const { element } = mount<Sale>({ value: sales, statusBar: true, columns: [{ field: 'rep', header: 'Rep' }] });
        const bar = () => element.querySelector('.vt-datagrid-status-bar')!.textContent;
        expect(bar()).toBe('5 rows');
        handle!.update({ filters: { rep: { value: 'a', matchMode: 'contains' } }, selection: [sales[0]] } as never);
        expect(bar()).toBe('3 of 5 rows1 selected');
    });

    it('draws what the host’s function makes of the counts', () => {
        const { element } = mount<Sale>({ value: sales, statusBar: ({ filtered }: { filtered: number }) => `Showing ${filtered}`, columns: [{ field: 'rep', header: 'Rep' }] });
        expect(element.querySelector('.vt-datagrid-status-bar')!.textContent).toBe('Showing 5');
    });

    it('is not drawn unless asked for', () => {
        const { element } = mount<Sale>({ value: sales, columns: [{ field: 'rep', header: 'Rep' }] });
        expect(element.querySelector('.vt-datagrid-status-bar')).toBeNull();
    });
});
