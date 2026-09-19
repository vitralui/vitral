import { ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { createDataTable, type TableHandle } from './table';

interface Person {
    id: number;
    name: string;
    city: string;
    age: number;
}

const people: Person[] = [
    { id: 1, name: 'Ana Souza', city: 'São Paulo', age: 34 },
    { id: 2, name: 'Bruno Lima', city: 'Recife', age: 28 },
    { id: 3, name: 'Carla Mendes', city: 'Lisboa', age: 45 },
    { id: 4, name: 'Diego Ferreira', city: 'Porto', age: 31 },
    { id: 5, name: 'Élise Martin', city: 'Montréal', age: 39 }
];

const columns = [
    { field: 'name', header: 'Name', sortable: true },
    { field: 'city', header: 'City', sortable: true },
    { field: 'age', header: 'Age', sortable: true, align: 'right' as const }
];

let handle: TableHandle<Person> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createDataTable<Person>(element, { value: people, dataKey: 'id', columns, ariaLabel: 'People', ...config });
    return {
        element,
        table: () => element.querySelector('table')!,
        headers: () => Array.from(element.querySelectorAll<HTMLTableCellElement>('thead tr:first-child th')),
        headings: () => Array.from(element.querySelectorAll('thead tr:first-child th')).map((th) => th.textContent?.trim() ?? ''),
        rows: () => Array.from(element.querySelectorAll<HTMLTableRowElement>('tbody tr')),
        column: (i: number) => Array.from(element.querySelectorAll<HTMLTableRowElement>('tbody tr')).map((row) => row.cells[i]?.textContent?.trim())
    };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('a table with no framework in it', () => {
    it('draws a real table, named, with scoped headers and every row', () => {
        const { table, headings, rows, column } = mount();
        expect(table().tagName).toBe('TABLE');
        expect(table().getAttribute('aria-label')).toBe('People');
        expect(headings()).toEqual(['Name', 'City', 'Age']);
        expect(Array.from(table().querySelectorAll('th')).every((th) => th.getAttribute('scope') === 'col')).toBe(true);
        expect(rows()).toHaveLength(5);
        expect(column(0)).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Ferreira', 'Élise Martin']);
    });

    it('sorts by a header, and says so where a reader can hear it', () => {
        const sorted = vi.fn();
        const { headers, column } = mount({ on: { sort: sorted } });
        const button = headers()[0]!.querySelector('button')!;
        button.click();
        expect(column(0)?.[0]).toBe('Ana Souza');
        expect(headers()[0]!.getAttribute('aria-sort')).toBe('ascending');
        button.click();
        expect(column(0)?.[0]).toBe('Élise Martin');
        expect(headers()[0]!.getAttribute('aria-sort')).toBe('descending');
        expect(sorted).toHaveBeenCalledTimes(2);
        expect(sorted.mock.calls[1]![0]).toMatchObject({ sortField: 'name', sortOrder: -1 });
    });

    it('pages, and reports where it went', () => {
        const paged = vi.fn();
        const { rows, element, column } = mount({ paginator: true, rows: 2, on: { page: paged } });
        expect(rows()).toHaveLength(2);
        const next = element.querySelector<HTMLButtonElement>('.vt-paginator-next')!;
        next.click();
        expect(column(0)).toEqual(['Carla Mendes', 'Diego Ferreira']);
        expect(paged).toHaveBeenCalledWith({ first: 2, rows: 2, page: 1, pageCount: 3 });
        // The last page holds what is left of them.
        element.querySelector<HTMLButtonElement>('.vt-paginator-last')!.click();
        expect(rows()).toHaveLength(1);
    });

    it('filters from the row under the headers', async () => {
        const { rows, element } = mount({ filterDisplay: 'row', filters: { city: { value: null, matchMode: 'contains' } } });
        const box = element.querySelector<HTMLInputElement>('.vt-datatable-filter-input')!;
        expect(box.getAttribute('aria-label')).toBe('Filter City');
        box.value = 'por';
        box.dispatchEvent(new Event('input', { bubbles: true }));
        expect(rows()).toHaveLength(1);
        expect(rows()[0]!.textContent).toContain('Porto');
        // What matches nothing says so.
        box.value = 'nowhere';
        box.dispatchEvent(new Event('input', { bubbles: true }));
        expect(rows()[0]!.textContent).toContain('No results found');
    });

    it('selects rows by checkbox, by row and by keyboard, and reports each', () => {
        const selected = vi.fn();
        const { element, rows } = mount({
            selectionMode: 'multiple',
            columns: [{ selectionMode: 'multiple' as const }, ...columns],
            on: { 'row-select': selected }
        });
        const boxes = element.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]');
        expect(boxes).toHaveLength(5);
        boxes[1]!.click();
        expect(handle!.state().selection).toEqual([people[1]]);
        expect(selected).toHaveBeenCalledTimes(1);
        // The header's box says "some", then covers them all.
        const all = element.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!;
        expect(all.indeterminate).toBe(true);
        all.click();
        expect((handle!.state().selection as Person[]).length).toBe(5);
        // A row answers Space.
        rows()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
        expect((handle!.state().selection as Person[]).length).toBe(4);
    });

    it('draws a cell the host wants to draw itself', () => {
        const { rows } = mount({
            columns: [
                { field: 'name', header: 'Name' },
                {
                    field: 'age',
                    header: 'Age',
                    body: ({ value }: { value: unknown }) => {
                        const tag = document.createElement('strong');
                        tag.textContent = `${value} years`;
                        return tag;
                    }
                }
            ]
        });
        expect(rows()[0]!.querySelector('strong')?.textContent).toBe('34 years');
    });

    it('speaks the locale it is given', () => {
        const { element } = mount({ value: [], locale: ptBR });
        expect(element.textContent).toContain('Nenhuma opção disponível');
    });

    it('takes an update without losing what the reader did', () => {
        const { headers, column, rows } = mount();
        headers()[1]!.querySelector('button')!.click();
        expect(column(1)?.[0]).toBe('Lisboa');
        handle!.update({ value: [...people, { id: 6, name: 'Fatou Diallo', city: 'Dakar', age: 26 }] });
        expect(rows()).toHaveLength(6);
        // Still sorted by city, with the new row in its place.
        expect(column(1)?.[0]).toBe('Dakar');
    });

    it('has nothing axe objects to, however it is drawn', async () => {
        const { element } = mount({
            paginator: true,
            rows: 2,
            filterDisplay: 'row',
            filters: { name: { value: null, matchMode: 'contains' } },
            resizableColumns: true,
            reorderableColumns: true,
            columnToggle: true,
            caption: 'People of the company',
            selectionMode: 'multiple',
            columns: [{ selectionMode: 'multiple' as const }, ...columns.map((column) => ({ ...column, footer: column.header }))]
        });
        await expectNoA11yViolations(element);
        // And with the column list open, and nothing to show.
        element.querySelector<HTMLButtonElement>('.vt-datatable-chooser-button')!.click();
        handle!.update({ value: [] });
        await expectNoA11yViolations(element);
    });

    it('clears up after itself', () => {
        const { element } = mount();
        handle!.destroy();
        handle = null;
        expect(element.children).toHaveLength(0);
        expect(element.className).toBe('');
    });
});

describe('its columns', () => {
    it('are drawn in the order the layout gives, without what it hides', () => {
        const { headings } = mount({ columnLayout: { order: ['age', 'name'], hidden: ['city'] } });
        expect(headings()).toEqual(['Age', 'Name']);
    });

    it('resize from the handle, by keyboard as well as by pointer', () => {
        const resized = vi.fn();
        const { headers } = mount({ resizableColumns: true, columnLayout: { widths: { name: 200, city: 200, age: 200 } }, on: { 'column-resize': resized } });
        const handleEl = headers()[0]!.querySelector<HTMLElement>('[role="separator"]')!;
        expect(handleEl.getAttribute('aria-label')).toBe('Resize Name');
        handleEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
        const widths = handle!.state().columnLayout.widths!;
        expect(widths.name).toBe(216);
        // `fit` takes it from the next column, so the table keeps its width.
        expect(widths.city).toBe(184);
        expect(resized).toHaveBeenCalled();
    });

    it('move with Ctrl and an arrow', () => {
        const { headers, headings } = mount({ reorderableColumns: true });
        headers()[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true, bubbles: true, cancelable: true }));
        expect(headings()).toEqual(['City', 'Name', 'Age']);
        expect(handle!.state().columnLayout.order).toEqual(['city', 'name', 'age']);
    });

    it('stick to an edge, stacked from it', () => {
        const { headers } = mount({ columnLayout: { widths: { name: 150 }, pinned: { name: 'left', city: 'left', age: 'right' } } });
        expect(headers()[0]!.style.position).toBe('sticky');
        expect(headers()[0]!.style.getPropertyValue('inset-inline-start')).toBe('0px');
        expect(headers()[1]!.style.getPropertyValue('inset-inline-start')).toBe('150px');
        expect(headers()[2]!.style.getPropertyValue('inset-inline-end')).toBe('0px');
    });

    it('are shown and hidden from a list of their own', () => {
        const { element, headings } = mount({ columnToggle: true });
        const button = element.querySelector<HTMLButtonElement>('.vt-datatable-chooser-button')!;
        button.click();
        const boxes = Array.from(element.querySelectorAll<HTMLInputElement>('.vt-datatable-chooser-checkbox'));
        expect(boxes).toHaveLength(3);
        boxes[1]!.click();
        expect(headings()).toEqual(['Name', 'Age']);
        expect(handle!.state().columnLayout.hidden).toEqual(['city']);
    });
});
