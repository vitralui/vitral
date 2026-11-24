import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Sale {
    id: number;
    product: string;
    q1units: number;
    q1revenue: number;
    q2units: number;
    q2revenue: number;
}

const sales: Sale[] = [
    { id: 1, product: 'Desk', q1units: 4, q1revenue: 1200, q2units: 6, q2revenue: 1800 },
    { id: 2, product: 'Lamp', q1units: 10, q1revenue: 400, q2units: 3, q2revenue: 120 },
    { id: 3, product: 'Chair', q1units: 7, q1revenue: 1050, q2units: 9, q2revenue: 1350 }
];

const grouped: DataGridColumn<Sale>[] = [
    { field: 'product', header: 'Product', sortable: true },
    {
        header: 'First quarter',
        columns: [
            { field: 'q1units', header: 'Units', align: 'right' },
            { field: 'q1revenue', header: 'Revenue', align: 'right' }
        ]
    },
    {
        header: 'Second quarter',
        key: 'q2',
        columns: [
            { field: 'q2units', header: 'Units', align: 'right' },
            { field: 'q2revenue', header: 'Revenue', align: 'right' }
        ]
    }
];

let handle: DataGridHandle<Sale> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createDataGrid<Sale>(element, { value: sales, dataKey: 'id', columns: grouped, ariaLabel: 'Sales', ...config });
    const headRows = () => Array.from(element.querySelectorAll<HTMLElement>('[data-section="head"] [role="row"]'));
    return {
        element,
        headRows,
        groupCells: () => Array.from(element.querySelectorAll<HTMLElement>('[data-section="head"] :is([role="columnheader"],[role="rowheader"])[data-group]')).map((th) => [th.textContent, Number(th.getAttribute('aria-colspan') ?? 1)]),
        leaves: () => Array.from(element.querySelectorAll<HTMLElement>('[data-section="head"] :is([role="columnheader"],[role="rowheader"])[data-column]')).map((th) => th.dataset.column),
        firstRow: () => Array.from(element.querySelectorAll('[data-section="body"] [role="row"]:first-child :is([role="cell"],[role="gridcell"])')).map((td) => td.textContent)
    };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('columns in groups', () => {
    it('draws a row of group headings over the columns, each spanning its own', () => {
        const { headRows, groupCells, leaves, element } = mount();
        expect(headRows()).toHaveLength(2);
        expect(groupCells()).toEqual([
            ['First quarter', 2],
            ['Second quarter', 2]
        ]);
        const group = element.querySelector('[data-section="head"] :is([role="columnheader"],[role="rowheader"])[data-group]')!;
        expect(group.getAttribute('role')).toBe('columnheader');
        expect((group as HTMLElement).style.gridColumn).toBe('span 2');
        // A column in no group has its header in the last row, the room over it the head's ground, which a reader is not told of.
        const product = element.querySelector('[role="columnheader"][data-column="product"]') as HTMLElement;
        expect(product.parentElement).toBe(headRows()[1]);
        const over = headRows()[0]!.children[0] as HTMLElement;
        expect(over.classList).toContain('vt-datagrid-blank-header-cell');
        expect(over.getAttribute('aria-hidden')).toBe('true');
        expect(leaves()).toEqual(['product', 'q1units', 'q1revenue', 'q2units', 'q2revenue']);
    });

    it('sorts, filters and draws by the columns alone', () => {
        const { firstRow } = mount({ sortField: 'product', sortOrder: 1 });
        expect(firstRow()).toEqual(['Chair', '7', '1050', '9', '1350']);
    });

    it('nests, a row of headings for each level', () => {
        const { headRows, groupCells } = mount({
            columns: [
                { field: 'product', header: 'Product' },
                { header: 'Year', columns: [{ header: 'First quarter', columns: [{ field: 'q1units', header: 'Units' }] }, { field: 'q2units', header: 'Q2 units' }] }
            ]
        });
        expect(headRows()).toHaveLength(3);
        expect(groupCells()).toEqual([
            ['Year', 2],
            ['First quarter', 1]
        ]);
    });

    it('splits a heading where a column of its group is moved away from the rest', () => {
        const { groupCells } = mount({ columnLayout: { order: ['product', 'q1units', 'q2units', 'q1revenue', 'q2revenue'] } });
        expect(groupCells()).toEqual([
            ['First quarter', 1],
            ['Second quarter', 1],
            ['First quarter', 1],
            ['Second quarter', 1]
        ]);
    });

    it('splits a heading where the pinned block ends, and sticks the pinned part', () => {
        const { element, groupCells } = mount({ columnLayout: { pinned: { q1units: 'left' }, widths: { q1units: 80 } } });
        expect(groupCells()).toEqual([
            ['First quarter', 1],
            ['First quarter', 1],
            ['Second quarter', 2]
        ]);
        const stuck = element.querySelector('[data-section="head"] :is([role="columnheader"],[role="rowheader"])[data-group]') as HTMLElement;
        expect(stuck.style.position).toBe('sticky');
        expect(stuck.className).toContain('vt-datagrid-pinned-left');
    });

    it('keys a column by its place among the columns, as a flat table does', () => {
        const { leaves } = mount({ columns: [{ header: 'A' }, { header: 'Group', columns: [{ header: 'B' }, { header: 'C' }] }] });
        expect(leaves()).toEqual(['column-0', 'column-1', 'column-2']);
    });

    it('hides a whole group with its columns', () => {
        const { leaves, headRows } = mount({ columns: [grouped[0]!, { ...grouped[1]!, hidden: true }] });
        expect(leaves()).toEqual(['product']);
        expect(headRows()).toHaveLength(1);
    });

    it('puts the filler under no heading, reaching through every row', () => {
        const { element } = mount({ resizableColumns: true, columnLayout: { widths: { product: 100, q1units: 80, q1revenue: 80, q2units: 80, q2revenue: 80 } } });
        const fillers = Array.from(element.querySelectorAll('[data-section="head"] > [role="row"]'), (row) => row.lastElementChild!);
        expect(fillers).toHaveLength(2);
        expect(fillers.every((cell) => cell.classList.contains('vt-datagrid-filler-cell') && !cell.hasAttribute('data-group'))).toBe(true);
    });

    it('is a table a screen reader can read', async () => {
        const { element } = mount();
        await expectNoA11yViolations(element);
    });
});
