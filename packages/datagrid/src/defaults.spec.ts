import { afterEach, describe, expect, it } from 'vitest';
import { createDataGrid, type DataGridHandle } from './grid';

interface Sale {
    id: number;
    customer: string;
    gross: number;
}

const sales: Sale[] = [
    { id: 1, customer: 'Ana', gross: 120 },
    { id: 2, customer: 'Bruno', gross: 80 }
];

let handle: DataGridHandle<Sale> | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('columnDefaults', () => {
    it('gives every plain column what it does not say itself, and leaves the selection column alone', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        handle = createDataGrid<Sale>(element, {
            value: sales,
            dataKey: 'id',
            ariaLabel: 'Sales',
            filterDisplay: 'menu',
            selectionMode: 'multiple',
            columnDefaults: { filter: true, sortable: true },
            columns: [{ selectionMode: 'multiple' }, { field: 'customer', header: 'Customer' }, { field: 'gross', header: 'Gross', sortable: false, filter: false }]
        });
        const headers = () => Array.from(element.querySelectorAll('[data-section="head"] [role="columnheader"]')) as HTMLElement[];
        expect(headers().map((h) => !!h.querySelector('[data-filter-button]'))).toEqual([false, true, false]);
        // A sortable header's title is a button; one that is not sortable has none.
        expect(headers().map((h) => !!h.querySelector('button:not([data-filter-button]):not([data-menu-button])'))).toEqual([false, true, false]);
        headers()[1]!.querySelector('button')!.click();
        expect(headers()[1]!.getAttribute('aria-sort')).toBe('ascending');
    });
});
