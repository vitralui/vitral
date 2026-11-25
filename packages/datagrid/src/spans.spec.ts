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
    // What the eye reads: the text a screen reader alone is given left out.
    const seen = (key: string) =>
        Array.from(element.querySelectorAll(`[data-section="body"] [role="row"][data-index] [data-col="${key}"]`), (c) => {
            const copy = c.cloneNode(true) as HTMLElement;
            copy.querySelectorAll('.vt-sr-only').forEach((hidden) => hidden.remove());
            return copy.textContent;
        });
    const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    return { element, row, cell, column, seen, key };
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

describe('row spanning', () => {
    it('draws a run of one value once, over its rows, and still says it in each to a screen reader', () => {
        const { cell, column, seen } = mount([{ field: 'region', header: 'Region', spanRows: true }, { field: 'city', header: 'City' }]);
        expect(seen('region')).toEqual(['North', '', '', 'South', 'West']);
        expect(column('region')).toEqual(['North', 'North', 'North', 'South', 'West']);
        expect([0, 1, 2, 3].map((index) => cell(index, 'region')!.dataset.rowRun)).toEqual(['start', 'middle', 'end', undefined]);
        const top = cell(0, 'region')!;
        expect(top.dataset.rowRunRows).toBe('3');
        expect(top.querySelector<HTMLElement>('[data-row-run-content]')!.style.getPropertyValue('--vt-datagrid-row-run-rows')).toBe('3');
        expect(seen('city')).toEqual(['Oslo', 'Bergen', 'Tromso', 'Kristiansand', 'Stavanger']);
    });

    it('keeps the value of a tall run to the part in view, unless told not to', () => {
        const value = (sticky?: boolean) => {
            const { cell } = mount([{ field: 'region', header: 'Region', spanRows: true, spanRowsSticky: sticky }]);
            const found = cell(0, 'region')!.querySelector('[data-row-run-content] > *')!;
            handle!.destroy();
            handle = null;
            return found.classList.contains('vt-datagrid-row-run-value-sticky');
        };
        expect(value()).toBe(true);
        expect(value(false)).toBe(false);
    });

    it('goes together by a rule of the host', () => {
        const { seen } = mount([
            { field: 'region', header: 'Region' },
            { field: 'total', header: 'Total', spanRows: (above, below) => (above.value as number) < 25 && (below.value as number) < 25 }
        ]);
        expect(seen('total')).toEqual(['10', '', '30', '40', '50']);
    });

    it('keeps to the page', () => {
        const { seen } = mount([{ field: 'region', header: 'Region', spanRows: true }, { field: 'city', header: 'City' }], { paginator: true, rows: 2, first: 2 });
        expect(seen('region')).toEqual(['North', 'South']);
    });

    it('follows the sort', () => {
        const { seen } = mount([{ field: 'region', header: 'Region', spanRows: true }, { field: 'total', header: 'Total', sortable: true }], { sortField: 'total', sortOrder: -1 });
        expect(seen('region')).toEqual(['West', 'South', 'North', '', '']);
    });

    it('ends at a row opened to its detail', () => {
        const { seen } = mount([{ expander: true }, { field: 'region', header: 'Region', spanRows: true }], {
            expandedRows: [2],
            content: { rowExpansion: ({ row }: { row: Sale }) => row.city }
        });
        expect(seen('region')).toEqual(['North', '', 'North', 'South', 'West']);
    });

    it('draws the cell being edited as it is', () => {
        const { cell } = mount([{ field: 'region', header: 'Region', spanRows: true, editable: true }]);
        handle!.startEdit(0, 'region');
        expect(cell(0, 'region')!.dataset.rowRun).toBeUndefined();
        expect(cell(0, 'region')!.querySelector('[data-row-run-content]')).toBeNull();
    });
});

describe('row spanning in pinned rows', () => {
    it('runs within each band of pinned rows, apart from the body', () => {
        const total = (region: string, city: string): Sale => ({ id: 0, region, city, total: 0 });
        const { element, seen } = mount([{ field: 'region', header: 'Region', spanRows: true }, { field: 'city', header: 'City' }], {
            pinnedTopRows: [total('Plan', 'Oslo'), total('Plan', 'Bergen')],
            pinnedBottomRows: [total('North', 'All'), total('North', 'All again'), total('South', 'All')]
        });
        const band = (which: string) =>
            Array.from(element.querySelectorAll(`.vt-datagrid-pinned-row-${which}`), (row) => {
                const cell = row.querySelector('[data-row-run-col="region"]') as HTMLElement | null;
                return cell ? `${cell.dataset.rowRun}:${cell.querySelector('[data-row-run-content]')?.textContent ?? ''}` : '-';
            });
        expect(band('top')).toEqual(['start:Plan', 'end:']);
        expect(band('bottom')).toEqual(['start:North', 'end:', '-']);
        // The body's runs are its own: the bottom band's North does not carry on from it.
        expect(seen('region')).toEqual(['North', '', '', 'South', 'West']);
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
