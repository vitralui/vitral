import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Line {
    id: number;
    product: string;
    price: number;
    quantity: number;
    size: string;
}

const lines: Line[] = [
    { id: 1, product: 'Tote', price: 30, quantity: 2, size: 'M' },
    { id: 2, product: 'Jacket', price: 120, quantity: 1, size: 'XL' },
    { id: 3, product: 'Scarf', price: 15, quantity: 6, size: 'S' },
    { id: 4, product: 'Shirt', price: 45, quantity: 3, size: 'L' }
];

const SIZES = ['S', 'M', 'L', 'XL'];
const money = (v: unknown) => (typeof v === 'number' ? `$${v.toFixed(2)}` : '');

let handle: DataGridHandle<Line> | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

function mount(columns: DataGridColumn<Line>[], config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createDataGrid<Line>(element, { value: lines, dataKey: 'id', ariaLabel: 'Lines', columns: [{ field: 'product', header: 'Product' }, ...columns], ...config });
    const column = (n: number) => Array.from(element.querySelectorAll(`[data-section="body"] [role="row"][data-index] > :nth-child(${n})`), (c) => c.textContent);
    return { element, column };
}

describe('worked-out values', () => {
    it('shows, sorts and totals a value worked out from the row, written its own way', () => {
        const { column, element } = mount(
            [{ key: 'total', header: 'Total', valueGetter: (row) => row.price * row.quantity, valueFormatter: money, sortable: true, aggregate: 'sum' }],
            { sortField: 'total', sortOrder: -1, totalRow: true }
        );
        expect(column(2)).toEqual(['$135.00', '$120.00', '$90.00', '$60.00']);
        expect(column(1)).toEqual(['Shirt', 'Jacket', 'Scarf', 'Tote']);
        expect(element.querySelector('[data-section="foot"]')!.textContent).toContain('$405.00');
    });

    it('filters a worked-out column by its value, and lists its values in a set filter written as the cells are', () => {
        const { column } = mount([{ key: 'total', header: 'Total', valueGetter: (row) => row.price * row.quantity, valueFormatter: money, filter: 'number' }], {
            filters: { total: { value: 100, matchMode: 'gt' } }
        });
        expect(column(1)).toEqual(['Jacket', 'Shirt']);
    });

    it('orders a column by its own comparator, blanks still last', () => {
        const { column } = mount([{ field: 'size', header: 'Size', sortable: true, comparator: (a, b) => SIZES.indexOf(a as string) - SIZES.indexOf(b as string) }], { sortField: 'size', sortOrder: 1 });
        expect(column(2)).toEqual(['S', 'M', 'L', 'XL']);
    });

    it('exports the value itself, not its text', () => {
        mount([{ key: 'total', header: 'Total', valueGetter: (row) => row.price * row.quantity, valueFormatter: money }]);
        expect(handle!.toCSV().split('\r\n')[1]).toBe('Tote,60');
    });
});

describe('more of what AG Grid has', () => {
    it('shares the room left among flex columns, a dragged width winning', () => {
        const { element } = mount([{ field: 'price', header: 'Price', flex: 2, minWidth: 80 }, { field: 'quantity', header: 'Quantity', flex: 1 }]);
        const table = element.querySelector('[data-grid-table]') as HTMLElement;
        expect(table.style.gridTemplateColumns).toBe('auto minmax(80px, 2fr) minmax(0px, 1fr)');
    });

    it('totals the first and the last value', () => {
        const { element } = mount([{ field: 'quantity', header: 'Quantity', aggregate: 'first' }, { field: 'price', header: 'Price', aggregate: 'last' }], { totalRow: true });
        const foot = Array.from(element.querySelectorAll('[data-section="foot"] [role="row"] > *'), (c) => c.textContent);
        expect(foot.slice(1)).toEqual(['2', '45']);
    });

    it('leaves out the rows a filter of the host refuses, before the search and the totals', () => {
        const { column } = mount([{ field: 'price', header: 'Price', aggregate: 'sum' }], { externalFilter: (row: Line) => row.price < 100, totalRow: true });
        expect(column(1)).toEqual(['Tote', 'Scarf', 'Shirt']);
        handle!.update({ externalFilter: (row: Line) => row.size === 'XL' });
        expect(column(1)).toEqual(['Jacket']);
    });
});

describe('cell rules', () => {
    it('gives each cell a class and a style by its value, and a tooltip', () => {
        const tip = vi.fn(({ value }: { value: unknown }) => `Quantity ${value}`);
        const { element } = mount([
            {
                field: 'quantity',
                header: 'Quantity',
                bodyClass: ({ value }) => ({ 'is-low': (value as number) < 3 }),
                bodyStyle: ({ value }) => ((value as number) > 5 ? { fontWeight: '700' } : null),
                tooltip: tip
            },
            { field: 'price', header: 'Price', valueFormatter: money, tooltip: true }
        ]);
        const cells = Array.from(element.querySelectorAll('[data-section="body"] [data-col="quantity"]')) as HTMLElement[];
        expect(cells.map((c) => c.classList.contains('is-low'))).toEqual([true, true, false, false]);
        expect(cells[2]!.style.fontWeight).toBe('700');
        expect(cells[0]!.title).toBe('Quantity 2');
        expect((element.querySelector('[data-section="body"] [data-col="price"]') as HTMLElement).title).toBe('$30.00');
    });
});
