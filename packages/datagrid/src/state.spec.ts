import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Order {
    id: number;
    customer: string;
    status: string;
    total: number;
}

const orders: Order[] = [
    { id: 1, customer: 'Ana', status: 'quote', total: 120 },
    { id: 2, customer: 'Bruno', status: 'shipped', total: 80 },
    { id: 3, customer: 'Carla', status: 'quote', total: 300 }
];

const columns: DataGridColumn<Order>[] = [
    { field: 'customer', header: 'Customer' },
    { field: 'status', header: 'Status' },
    { field: 'total', header: 'Total', visible: false }
];

let handle: DataGridHandle<Order> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const on = { change: vi.fn(), filter: vi.fn() };
    handle = createDataGrid<Order>(element, { value: orders, dataKey: 'id', columns, ariaLabel: 'Orders', on, ...config });
    const headings = () => Array.from(element.querySelectorAll('[data-section="head"] [role="columnheader"]'), (th) => th.textContent?.trim());
    const names = () => Array.from(element.querySelectorAll('[data-section="body"] > [role="row"] > :first-child'), (cell) => cell.textContent);
    return { element, on, headings, names };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
    localStorage.clear();
});

describe('a column that starts hidden', () => {
    it('is out of the rows but in the columns panel, to be shown from there', () => {
        const { element, headings } = mount({ sideBar: ['columns'], sideBarOpen: 'columns' });
        expect(headings()).toEqual(['Customer', 'Status']);
        const box = element.querySelector('[data-side-column="total"] input') as HTMLInputElement;
        expect(box.checked).toBe(false);
        box.click();
        expect(headings()).toEqual(['Customer', 'Status', 'Total']);
    });

    it('stays hidden when another column is hidden, and comes back hidden on a reset', () => {
        const { element, headings } = mount({ sideBar: ['columns'], sideBarOpen: 'columns' });
        (element.querySelector('[data-side-column="status"] input') as HTMLInputElement).click();
        expect(headings()).toEqual(['Customer']);
        handle!.update({ columnLayout: {} });
        expect(headings()).toEqual(['Customer', 'Status']);
    });
});

describe('a list filter of codes', () => {
    const open = (element: HTMLElement) => (element.querySelector('[data-filter-button="status"]') as HTMLButtonElement).click();
    const labels = () => Array.from(document.querySelectorAll('.vt-datagrid-filter-values label'), (label) => label.textContent);

    it('shows the label of an option given as { label, value }, and filters by its value', () => {
        const status: DataGridColumn<Order> = {
            field: 'status',
            header: 'Status',
            filter: true,
            filterOptions: [
                { label: 'Orçamento', value: 'quote' },
                { label: 'Enviado', value: 'shipped' }
            ]
        };
        const { element, on, names } = mount({ filterDisplay: 'menu', columns: [columns[0]!, status] });
        open(element);
        expect(labels()).toEqual(['Orçamento', 'Enviado']);
        (document.querySelectorAll('.vt-datagrid-filter-values input')[1] as HTMLInputElement).click();
        expect(names()).toEqual(['Ana', 'Carla']);
        expect(on.filter.mock.calls.at(-1)![0].filters.status).toEqual({ value: ['quote'], matchMode: 'anyOf' });
    });

    it('names a value by the column’s filterLabel, and draws it by filterOptionContent', () => {
        const words: Record<string, string> = { quote: 'Orçamento', shipped: 'Enviado' };
        const status: DataGridColumn<Order> = {
            field: 'status',
            header: 'Status',
            filter: 'set',
            filterLabel: (value) => words[value as string] ?? String(value),
            filterOptionContent: ({ label, value }) => {
                const tag = document.createElement('b');
                tag.className = `tag-${String(value)}`;
                tag.textContent = label;
                return tag;
            }
        };
        const { element } = mount({ filterDisplay: 'menu', columns: [columns[0]!, status] });
        open(element);
        expect(labels()).toEqual(['Orçamento', 'Enviado']);
        expect(document.querySelector('.vt-datagrid-filter-values .tag-quote')!.textContent).toBe('Orçamento');
        expect((document.querySelector('.vt-datagrid-filter-values input') as HTMLInputElement).getAttribute('aria-label')).toBe('Orçamento');
        // The search finds a value by its label.
        const search = document.querySelector('[data-filter-search]') as HTMLInputElement;
        search.value = 'envi';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        expect(labels()).toEqual(['Enviado']);
    });
});

describe('a grid that keeps what the reader arranged', () => {
    it('keeps the layout, the sort, the page size and the density under its key, and restores them', async () => {
        const sortable = [{ ...columns[0]!, sortable: true }, ...columns.slice(1)];
        const first = mount({ stateKey: 'orders', columns: sortable, paginator: true, rows: 5, toolbar: ['density'] });
        handle!.update({ columnLayout: { hidden: ['status'], widths: { customer: 140 } }, rows: 10 });
        // What the reader does is kept, with the rest of the arrangement as it stands.
        (first.element.querySelector('[data-column="customer"] button') as HTMLButtonElement).click();
        (first.element.querySelector('[data-toolbar="density"]') as HTMLButtonElement).click();
        (Array.from(document.querySelectorAll('[role="menuitem"]')).find((item) => item.textContent?.includes('Compact')) as HTMLElement).click();
        const stored = JSON.parse(localStorage.getItem('vitral:datagrid:orders')!);
        expect(stored).toMatchObject({ columnLayout: { hidden: ['status'], widths: { customer: 140 } }, sortField: 'customer', rows: 10, size: 'small' });
        handle!.destroy();
        document.body.innerHTML = '';

        const again = mount({ stateKey: 'orders', columns: sortable, paginator: true, rows: 5 });
        // A layout that names its hidden columns names them all: Total, hidden only at first, is in it no longer.
        expect(again.headings()).toEqual(['Customer', 'Total']);
        expect(handle!.state()).toMatchObject({ sortField: 'customer', rows: 10 });
        expect(again.element.classList).toContain('vt-datagrid-sm');
        await Promise.resolve();
        // The host hears what was restored, so its bindings follow.
        expect(again.on.change).toHaveBeenCalledWith(expect.objectContaining({ rows: 10, sortField: 'customer' }));
    });

    it('starts from the values handed in when nothing was kept, or what was kept cannot be read', () => {
        localStorage.setItem('vitral:datagrid:broken', '{not json');
        const { headings } = mount({ stateKey: 'broken' });
        expect(headings()).toEqual(['Customer', 'Status']);
        expect(handle!.state().rows).toBe(10);
    });
});
