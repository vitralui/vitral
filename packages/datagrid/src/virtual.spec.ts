import { afterEach, describe, expect, it } from 'vitest';
import { offsetsOf, windowOf } from './engine/virtual';
import { createDataGrid, type DataGridHandle } from './grid';

interface Item {
    id: number;
    name: string;
    group: string;
}

const items: Item[] = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, name: `Item ${String(i + 1).padStart(4, '0')}`, group: i % 2 ? 'odd' : 'even' }));

let handle: DataGridHandle<Item> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createDataGrid<Item>(element, {
        value: items,
        dataKey: 'id',
        columns: [
            { field: 'id', header: 'Id', sortable: true },
            { field: 'name', header: 'Name' }
        ],
        ariaLabel: 'Items',
        virtualScroll: true,
        ...config
    });
    const box = () => element.querySelector('.vt-datagrid-table-container') as HTMLElement;
    return {
        element,
        box,
        table: () => element.querySelector('[data-grid-table]')!,
        rows: () => Array.from(element.querySelectorAll<HTMLElement>('[data-section="body"] [role="row"][data-index]')),
        indexes: () => Array.from(element.querySelectorAll<HTMLElement>('[data-section="body"] [role="row"][data-index]')).map((row) => Number(row.dataset.index)),
        /** jsdom lays nothing out: the box is scrolled by saying where it is. */
        scrollTo: async (top: number, left = 0) => {
            Object.defineProperty(box(), 'scrollTop', { configurable: true, value: top });
            Object.defineProperty(box(), 'scrollLeft', { configurable: true, value: left });
            box().dispatchEvent(new Event('scroll'));
            await new Promise((done) => requestAnimationFrame(() => done(null)));
        }
    };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('the arithmetic of what is in view', () => {
    const offsets = offsetsOf(100, () => 10);

    it('places each item after the ones before it', () => {
        expect(Array.from(offsetsOf(3, (i) => [10, 20, 30][i]!))).toEqual([0, 10, 30, 60]);
    });

    it('takes the items that cover the view, and the room of the rest', () => {
        expect(windowOf(offsets, 0, 50)).toEqual({ start: 0, end: 5, before: 0, after: 950, total: 1000 });
        expect(windowOf(offsets, 205, 255)).toEqual({ start: 20, end: 26, before: 200, after: 740, total: 1000 });
    });

    it('draws a few more either side, and never past the ends', () => {
        expect(windowOf(offsets, 200, 250, 3)).toMatchObject({ start: 17, end: 28 });
        expect(windowOf(offsets, 0, 50, 3)).toMatchObject({ start: 0, end: 8 });
        expect(windowOf(offsets, 960, 1000, 3)).toMatchObject({ start: 93, end: 100, after: 0 });
    });

    it('has nothing to draw when there is nothing', () => {
        expect(windowOf(offsetsOf(0, () => 10), 0, 100)).toEqual({ start: 0, end: 0, before: 0, after: 0, total: 0 });
    });
});

describe('a virtual grid', () => {
    it('draws the rows in view rather than every row, and keeps the room of the rest', () => {
        const { rows, element, box } = mount();
        expect(rows().length).toBeGreaterThan(5);
        expect(rows().length).toBeLessThan(40);
        const spacer = element.querySelector('.vt-datagrid-spacer-row') as HTMLElement;
        expect(spacer.getAttribute('aria-hidden')).toBe('true');
        expect(parseFloat(spacer.style.height)).toBeGreaterThan(30000);
        // It scrolls in a box of its own, 400px unless told otherwise.
        expect(box().style.maxHeight).toBe('400px');
    });

    it('tells a reader how many rows the table has, and where each drawn one is', () => {
        const { table, rows } = mount();
        expect(table().getAttribute('aria-rowcount')).toBe('1001');
        expect(rows()[0]!.getAttribute('aria-rowindex')).toBe('2');
        expect(rows()[3]!.getAttribute('aria-rowindex')).toBe('5');
        expect(table().querySelector('[data-section="head"] [role="row"]')!.getAttribute('aria-rowindex')).toBe('1');
    });

    it('draws the rows the box is scrolled to', async () => {
        const { indexes, scrollTo, element } = mount();
        await scrollTo(20000);
        expect(indexes()[0]).toBeGreaterThan(480);
        expect(indexes()).toContain(500);
        expect(indexes().at(-1)).toBeLessThan(530);
        // The room above, and below.
        expect(element.querySelectorAll('.vt-datagrid-spacer-row').length).toBeGreaterThanOrEqual(2);
    });

    it('keeps each row on the stripe it would have with every row drawn', async () => {
        const { scrollTo, element } = mount({ stripedRows: true });
        for (const top of [20000, 20040, 20080]) {
            await scrollTo(top);
            const body = element.querySelector('[data-section="body"]')!;
            const row = body.querySelector('[role="row"][data-index]') as HTMLElement;
            const child = Array.from(body.children).indexOf(row) + 1;
            expect(child % 2).toBe((Number(row.dataset.index) + 1) % 2);
        }
    });

    it('sorts and filters over every row, not the ones drawn', () => {
        const { rows, element } = mount();
        handle!.update({ sortField: 'id', sortOrder: -1 });
        expect(rows()[0]!.textContent).toContain('Item 1000');
        handle!.update({ filters: { name: { value: '0999', matchMode: 'contains' } } });
        expect(rows()).toHaveLength(1);
        expect(element.querySelector('[data-grid-table]')!.getAttribute('aria-rowcount')).toBe('2');
    });

    it('scrolls a row that is not drawn into view, and draws it', () => {
        const { indexes, box } = mount();
        handle!.scrollToIndex(700);
        expect(indexes()).toContain(700);
        expect(box().scrollTop).toBeGreaterThan(20000);
    });

    it('takes the arrow keys past the rows drawn', () => {
        const { element, indexes } = mount({ selectionMode: 'single' });
        const last = Math.max(...indexes());
        const row = element.querySelector(`[role="row"][data-index="${last}"]`) as HTMLElement;
        row.focus();
        row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        expect(indexes()).toContain(last + 1);
        expect(document.activeElement).toBe(element.querySelector(`[role="row"][data-index="${last + 1}"]`));
        (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        expect(document.activeElement).toBe(element.querySelector('[role="row"][data-index="999"]'));
    });

    it('draws as few placeholder rows as it would draw rows', () => {
        const { element } = mount({ loading: true, loadingMode: 'skeleton' });
        expect(element.querySelectorAll('.vt-datagrid-row-skeleton').length).toBeLessThan(40);
    });

    it('counts a heading over a group and an open detail as rows of their own', () => {
        const { table, element } = mount({
            groupBy: 'group',
            columns: [{ expander: true }, { field: 'id', header: 'Id' }],
            content: { rowExpansion: () => 'detail' },
            expandedRows: [1]
        });
        // Two headings, a thousand rows and one detail, under one header row.
        expect(table().getAttribute('aria-rowcount')).toBe(String(1 + 2 + 1000 + 1));
        expect(element.querySelector('.vt-datagrid-expansion-row')).not.toBeNull();
    });

    it('is left out by default: every row is drawn', () => {
        const { rows, table } = mount({ virtualScroll: false });
        expect(rows()).toHaveLength(1000);
        expect(table().hasAttribute('aria-rowcount')).toBe(false);
    });
});

describe('a grid that draws its columns as they come into view', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ key: `c${i}`, header: `Column ${i}`, width: 100, body: () => String(i) }));

    it('draws the columns in view and a spacer for the rest, saying how many there are', async () => {
        const { element, table, scrollTo } = mount({ virtualScroll: false, value: items.slice(0, 3), columns: many, virtualColumns: true });
        const headers = () => Array.from(element.querySelectorAll('[data-section="head"] :is([role="columnheader"],[role="rowheader"])[data-column]')).map((th) => th.getAttribute('data-column'));
        expect(headers().length).toBeLessThan(20);
        expect(headers()[0]).toBe('c0');
        expect(table().getAttribute('aria-colcount')).toBe('40');
        expect(element.querySelector('[data-section="body"] :is([role="cell"],[role="gridcell"])')!.getAttribute('aria-colindex')).toBe('1');
        await scrollTo(0, 2000);
        expect(headers()).toContain('c20');
        expect(headers()).not.toContain('c0');
        const first = element.querySelector('[data-section="body"] [role="row"]')!.querySelector(':is([role="cell"],[role="gridcell"])[aria-colindex]')!;
        expect(Number(first.getAttribute('aria-colindex'))).toBeGreaterThan(15);
    });

    it('always draws the pinned columns', async () => {
        const { element, scrollTo } = mount({
            virtualScroll: false,
            value: items.slice(0, 3),
            columns: [{ key: 'pin', header: 'Pinned', pinned: 'left', width: 120, body: () => 'p' }, ...many],
            virtualColumns: true
        });
        await scrollTo(0, 3000);
        const headers = Array.from(element.querySelectorAll('[data-section="head"] :is([role="columnheader"],[role="rowheader"])[data-column]')).map((th) => th.getAttribute('data-column'));
        expect(headers[0]).toBe('pin');
        expect(headers).not.toContain('c1');
    });

    it('gives a column without a width its minimum, or 150px', () => {
        const { element } = mount({ virtualScroll: false, value: items.slice(0, 3), columns: [{ field: 'id', header: 'Id' }, { field: 'name', header: 'Name', minWidth: 90 }], virtualColumns: true });
        expect(element.querySelector<HTMLElement>('[data-grid-table]')!.style.gridTemplateColumns).toBe('150px 90px minmax(0, 1fr)');
    });
});
