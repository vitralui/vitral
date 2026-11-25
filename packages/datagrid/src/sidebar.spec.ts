import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Order {
    id: number;
    customer: string;
    city: string;
    total: number;
}

const orders: Order[] = [
    { id: 1, customer: 'Ana', city: 'Lisbon', total: 120 },
    { id: 2, customer: 'Bruno', city: 'Porto', total: 80 },
    { id: 3, customer: 'Carla', city: 'Lisbon', total: 300 }
];

const columns: DataGridColumn<Order>[] = [
    { field: 'customer', header: 'Customer', filter: true },
    { field: 'city', header: 'City', filter: 'set' },
    { field: 'total', header: 'Total', filter: true }
];

let handle: DataGridHandle<Order> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const on = { filter: vi.fn(), 'column-toggle': vi.fn(), 'column-reorder': vi.fn() };
    handle = createDataGrid<Order>(element, { value: orders, dataKey: 'id', columns, ariaLabel: 'Orders', sideBar: true, on, ...config });
    const headers = () => Array.from(element.querySelectorAll('[data-section="head"] :is([role="columnheader"],[role="rowheader"])[data-column]'), (th) => th.textContent?.trim());
    const names = () => Array.from(element.querySelectorAll('[data-section="body"] [role="row"][data-index] :is([role="cell"],[role="gridcell"]):first-child'), (td) => td.textContent);
    const tab = (panel: string) => element.querySelector(`[data-side-tab="${panel}"]`) as HTMLButtonElement;
    const listed = () => Array.from(element.querySelectorAll('[data-side-column]'), (li) => li.textContent);
    const type = (input: Element, text: string) => {
        (input as HTMLInputElement).value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    return { element, on, headers, names, tab, listed, type };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('the side bar', () => {
    it('is not there unless asked for, and asked for shows only its tabs', () => {
        const plain = mount({ sideBar: undefined });
        expect(plain.element.querySelector('.vt-datagrid-side-bar')).toBeNull();
        handle!.destroy();
        const { element, tab } = mount({ sideBar: ['columns'] });
        expect(element.querySelector('.vt-datagrid-side-panel')).toBeNull();
        expect(tab('columns').getAttribute('aria-pressed')).toBe('false');
        expect(tab('filters')).toBeNull();
    });

    it('lists the columns to show and hide, and finds them by name', () => {
        const { element, tab, listed, headers, on, type } = mount();
        tab('columns').click();
        expect(tab('columns').getAttribute('aria-pressed')).toBe('true');
        expect(listed()).toEqual(['Customer', 'City', 'Total']);
        (element.querySelector('[data-side-column="city"] input') as HTMLInputElement).click();
        expect(headers()).not.toContain('City');
        expect(on['column-toggle']).toHaveBeenCalled();
        type(element.querySelector('[data-side-search]')!, 'tot');
        expect(listed()).toEqual(['Total']);
    });

    it('names a panel by its tab alone, keeping its search and its tick for all at the top as the list scrolls', () => {
        const { element, tab } = mount();
        tab('columns').click();
        const panel = element.querySelector('.vt-datagrid-side-panel')!;
        expect(panel.querySelector('h2')).toBeNull();
        expect(panel.getAttribute('aria-label')).toBe('Columns');
        const head = panel.querySelector('.vt-datagrid-side-panel-head')!;
        expect(head.querySelector('[data-side-search]')).not.toBeNull();
        expect(head.querySelector('input[type="checkbox"]')).not.toBeNull();
        expect(head.querySelector('[data-side-column]')).toBeNull();
    });

    it('shows every column at once, and keeps one when hiding them all', () => {
        const { element, tab, headers } = mount();
        tab('columns').click();
        const all = () => element.querySelector('.vt-datagrid-side-panel .vt-datagrid-filter-value-all input') as HTMLInputElement;
        all().click();
        expect(headers()).toEqual(['Customer']);
        expect(all().indeterminate).toBe(true);
        all().click();
        expect(headers()).toEqual(['Customer', 'City', 'Total']);
    });

    it('puts a column in another order with Ctrl and an arrow on its handle', () => {
        const { element, tab, headers, listed, on } = mount();
        tab('columns').click();
        const handleOf = (key: string) => element.querySelector(`[data-side-column="${key}"] [role="button"]`) as HTMLElement;
        handleOf('total').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true }));
        expect(headers()).toEqual(['Customer', 'Total', 'City']);
        expect(listed()).toEqual(['Customer', 'Total', 'City']);
        handleOf('customer').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
        expect(headers()).toEqual(['Total', 'Customer', 'City']);
        expect(on['column-reorder']).toHaveBeenCalledTimes(2);
    });

    it('holds each column’s filter, one open at a time, and clears them all', () => {
        const { element, tab, names, type, on } = mount({ sideBarOpen: 'filters' });
        const sections = () => Array.from(element.querySelectorAll('[data-side-filter]'), (button) => button.textContent);
        expect(sections()).toEqual(['Customer', 'City', 'Total']);
        (element.querySelector('[data-side-filter="customer"]') as HTMLButtonElement).click();
        expect(element.querySelector('[data-side-filter="customer"]')!.getAttribute('aria-expanded')).toBe('true');
        // Drawn in the bar itself, not in a popup.
        const inline = element.querySelector('.vt-datagrid-filter-panel-inline') as HTMLElement;
        expect(inline.getAttribute('role')).toBe('group');
        type(inline.querySelector('[data-filter-value="0"]')!, 'ana');
        expect(names()).toEqual(['Ana']);
        expect(on.filter).toHaveBeenCalled();
        expect(element.querySelector('.vt-datagrid-side-filter-active')).not.toBeNull();
        (element.querySelector('[data-side-filter="city"]') as HTMLButtonElement).click();
        expect(element.querySelector('[data-side-filter="customer"]')!.getAttribute('aria-expanded')).toBe('false');
        (Array.from(element.querySelectorAll('.vt-datagrid-filter-values input'))[1] as HTMLInputElement).click();
        expect(names()).toEqual(['Ana']);
        const clear = Array.from(element.querySelectorAll('.vt-datagrid-side-panel button')).find((button) => button.textContent === 'Clear all filters') as HTMLButtonElement;
        clear.click();
        expect(names()).toEqual(['Ana', 'Bruno', 'Carla']);
        expect(element.querySelector('.vt-datagrid-side-filter-active')).toBeNull();
    });

    it('shuts the panel when its tab is pressed again', () => {
        const { element, tab } = mount({ sideBarOpen: 'columns' });
        expect(element.querySelector('.vt-datagrid-side-panel-columns')).not.toBeNull();
        tab('columns').click();
        expect(element.querySelector('.vt-datagrid-side-panel')).toBeNull();
    });

    it('is a bar a screen reader can read, with each panel open', async () => {
        const { element, tab } = mount({ sideBarOpen: 'columns' });
        await expectNoA11yViolations(element);
        tab('filters').click();
        (element.querySelector('[data-side-filter="city"]') as HTMLButtonElement).click();
        await expectNoA11yViolations(element);
    });
});
