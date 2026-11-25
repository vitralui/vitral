import { afterEach, describe, expect, it } from 'vitest';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Sale {
    id: number;
    region: string;
    city: string;
    total: number;
    note?: string;
}

const sales: Sale[] = [
    { id: 1, region: 'North', city: 'Oslo', total: 10 },
    { id: 2, region: 'North', city: 'Bergen', total: 20 },
    { id: 3, region: 'North', city: 'Tromso', total: 30, note: 'Closed for the season' },
    { id: 4, region: 'South', city: 'Kristiansand', total: 40 },
    { id: 5, region: 'West', city: 'Stavanger', total: 50 }
];

let handle: DataGridHandle<Sale> | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

function mount(columns: DataGridColumn<Sale>[], config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createDataGrid<Sale>(element, { value: sales, dataKey: 'id', ariaLabel: 'Sales', columns, ...config });
    const row = (index: number) => element.querySelector(`[data-section="body"] [role="row"][data-index="${index}"]`) as HTMLElement;
    const cell = (index: number, key: string) => row(index).querySelector(`[data-col="${key}"]`) as HTMLElement | null;
    const column = (key: string) => Array.from(element.querySelectorAll(`[data-section="body"] [role="row"][data-index] [data-col="${key}"]`), (c) => c.textContent);
    const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    return { element, row, cell, column, key };
}

const columns: DataGridColumn<Sale>[] = [
    { field: 'region', header: 'Region' },
    { field: 'city', header: 'City', colSpan: ({ row }) => (row.note ? 2 : 1) },
    { field: 'total', header: 'Total', editable: true }
];

describe('column spanning', () => {
    it('stretches a cell over the columns beside it and leaves the covered ones out', () => {
        const { cell } = mount(columns);
        expect(cell(2, 'city')!.style.gridColumn).toBe('span 2');
        expect(cell(2, 'city')!.getAttribute('aria-colspan')).toBe('2');
        expect(cell(2, 'total')).toBeNull();
        expect(cell(1, 'city')!.getAttribute('aria-colspan')).toBeNull();
        expect(cell(1, 'total')).not.toBeNull();
    });

    it('stops at the last column', () => {
        const { row, cell } = mount([{ field: 'region', header: 'Region', colSpan: () => 9 }, { field: 'city', header: 'City' }]);
        expect(cell(0, 'region')!.getAttribute('aria-colspan')).toBe('2');
        expect(row(0).querySelectorAll('[data-col]')).toHaveLength(1);
    });

    it('moves the keyboard past a spanning cell, and onto it from a covered column', () => {
        const { cell, key } = mount(columns, { navigation: 'cell' });
        cell(2, 'city')!.focus();
        key(cell(2, 'city')!, 'ArrowRight');
        expect(document.activeElement).toBe(cell(2, 'city'));
        cell(1, 'total')!.focus();
        key(cell(1, 'total')!, 'ArrowDown');
        expect(document.activeElement).toBe(cell(2, 'city'));
        key(cell(2, 'city')!, 'ArrowLeft');
        expect(document.activeElement).toBe(cell(2, 'region'));
    });
});

describe('column spanning in pinned rows', () => {
    it('stretches a pinned row\'s cell as a body row\'s', () => {
        const { element } = mount(columns, { pinnedBottomRows: [{ id: 0, region: 'All', city: 'Every city', total: 150, note: 'Totals' }] });
        const pinned = element.querySelector('.vt-datagrid-pinned-row')!;
        expect(pinned.querySelector('[aria-colspan="2"]')!.textContent).toBe('Every city');
        expect(pinned.querySelectorAll(':is([role="cell"],[role="gridcell"])')).toHaveLength(2);
    });
});

describe('row spanning', () => {
    it('writes a run of one value once, at its top, and marks where each row stands in it', () => {
        const { cell, column } = mount([{ field: 'region', header: 'Region', spanRows: true }, { field: 'city', header: 'City' }]);
        expect(column('region')).toEqual(['North', '', '', 'South', 'West']);
        expect([0, 1, 2, 3].map((index) => cell(index, 'region')!.dataset.rowRun)).toEqual(['start', 'middle', 'end', undefined]);
        expect(column('city')).toEqual(['Oslo', 'Bergen', 'Tromso', 'Kristiansand', 'Stavanger']);
    });

    it('goes together by a rule of the host', () => {
        const { column } = mount([
            { field: 'region', header: 'Region' },
            { field: 'total', header: 'Total', spanRows: (above, below) => (above.value as number) < 25 && (below.value as number) < 25 }
        ]);
        expect(column('total')).toEqual(['10', '', '30', '40', '50']);
    });

    it('keeps to the page', () => {
        const { column } = mount([{ field: 'region', header: 'Region', spanRows: true }, { field: 'city', header: 'City' }], { paginator: true, rows: 2, first: 2 });
        expect(column('region')).toEqual(['North', 'South']);
    });

    it('follows the sort', () => {
        const { column } = mount([{ field: 'region', header: 'Region', spanRows: true }, { field: 'total', header: 'Total', sortable: true }], { sortField: 'total', sortOrder: -1 });
        expect(column('region')).toEqual(['West', 'South', 'North', '', '']);
    });
});

describe('row numbers', () => {
    it('puts a column of numbers first, counting across the pages', () => {
        const { column, element } = mount(columns, { rowNumbers: true, paginator: true, rows: 2, first: 2 });
        expect(column('row-number')).toEqual(['3', '4']);
        expect(element.querySelector('[data-section="body"] [role="row"][data-index] > *')!.getAttribute('data-col')).toBe('row-number');
    });

    it('holds the numbers to the left edge, unless told otherwise', () => {
        const { cell } = mount(columns, { rowNumbers: true });
        expect(cell(0, 'row-number')!.style.position).toBe('sticky');
        handle!.update({ rowNumbers: { pinned: undefined, header: 'No.' } });
        expect(cell(0, 'row-number')!.style.position).toBe('');
        expect(document.querySelector('[data-section="head"]')!.textContent).toContain('No.');
    });

    it('leaves the other columns their keys, so a stored layout still fits', () => {
        const unkeyed: DataGridColumn<Sale>[] = [{ header: 'Region', body: ({ row }) => row.region }];
        const { element } = mount(unkeyed, { rowNumbers: true });
        expect(Array.from(element.querySelectorAll('[data-section="body"] [role="row"][data-index="0"] [data-col]'), (c) => c.getAttribute('data-col'))).toEqual(['row-number', 'column-0']);
    });

    it('is turned off again, and is not exported', () => {
        const { column } = mount(columns, { rowNumbers: true });
        expect(handle!.toCSV().split(/\r?\n/)[0]).toBe('Region,City,Total');
        handle!.update({ rowNumbers: false });
        expect(column('row-number')).toEqual([]);
    });

    it('takes a column of the host for its place and header', () => {
        const { column } = mount([...columns, { key: 'n', header: 'No.', rowNumber: true }], { rowNumbers: true });
        expect(column('n')).toEqual(['1', '2', '3', '4', '5']);
        expect(column('row-number')).toEqual([]);
    });
});
