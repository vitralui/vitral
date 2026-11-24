import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Sale {
    id: number;
    customer: string;
    seller: string;
    gross: number;
    discount: number;
}

const sales: Sale[] = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, customer: ['Ana', 'Bruno', 'Carla'][i % 3]!, seller: ['Hugo', 'Inês'][i % 2]!, gross: 100 + i, discount: i % 3 }));

const columns: DataGridColumn<Sale>[] = [
    { field: 'customer', header: 'Customer' },
    { field: 'seller', header: 'Seller' },
    { field: 'gross', header: 'Gross sale', aggregate: 'sum' },
    { field: 'discount', header: 'Discount' }
];

let handle: DataGridHandle<Sale> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const on = { 'group-by-change': vi.fn(), 'aggregates-change': vi.fn(), 'pivot-change': vi.fn(), 'column-reorder': vi.fn() };
    handle = createDataGrid<Sale>(element, { value: sales, dataKey: 'id', columns, ariaLabel: 'Sales', on, toolbar: ['columns'], columnsDrawer: true, sideBar: ['columns', 'pivot'], ...config });
    const drawer = () => document.querySelector('[data-columns-drawer]') as HTMLElement | null;
    const headings = () => Array.from(element.querySelectorAll('[data-section="head"] [role="columnheader"]'), (th) => th.textContent?.trim());
    const open = () => (element.querySelector('[data-toolbar="columns"]') as HTMLButtonElement).click();
    const tab = (name: string) => (drawer()!.querySelector(`[data-drawer-tab="${name}"]`) as HTMLButtonElement).click();
    const pick = (selector: string, value: string) => {
        const select = drawer()!.querySelector(selector) as HTMLSelectElement;
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const apply = () => (drawer()!.querySelector('[data-drawer-apply]') as HTMLButtonElement).click();
    return { element, on, drawer, headings, open, tab, pick, apply };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('the columns drawer', () => {
    it('opens from the toolbar as a modal dialog of three tabs, and changes nothing until Apply', () => {
        const { element, drawer, headings, open } = mount();
        open();
        const dialog = drawer()!;
        expect(dialog.getAttribute('role')).toBe('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(Array.from(dialog.querySelectorAll('[role="tab"]'), (tab) => tab.textContent)).toEqual(['Visible columns', 'Organization', 'Column values']);
        expect(document.activeElement).toBe(dialog.querySelector('[data-drawer-tab="visible"]'));
        (dialog.querySelector('[data-drawer-column="seller"] input') as HTMLInputElement).click();
        expect(headings()).toEqual(['Customer', 'Seller', 'Gross sale', 'Discount']);
        (dialog.querySelector('[data-drawer-cancel]') as HTMLButtonElement).click();
        expect(drawer()).toBeNull();
        expect(headings()).toEqual(['Customer', 'Seller', 'Gross sale', 'Discount']);
        expect(document.activeElement).toBe(element.querySelector('[data-toolbar="columns"]'));
    });

    it('hides and orders columns on Apply, by the keyboard as well as by a drag', () => {
        const { drawer, headings, open, apply, on } = mount();
        open();
        (drawer()!.querySelector('[data-drawer-column="seller"] input') as HTMLInputElement).click();
        const handleOf = (key: string) => drawer()!.querySelector(`[data-drawer-column="${key}"] [role="button"]`) as HTMLElement;
        handleOf('discount').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true }));
        expect(document.activeElement).toBe(handleOf('discount'));
        apply();
        expect(drawer()).toBeNull();
        expect(headings()).toEqual(['Customer', 'Discount', 'Gross sale']);
        expect(on['column-reorder']).toHaveBeenCalledTimes(1);
    });

    it('moves the tabs with the arrow keys', () => {
        const { drawer, open } = mount();
        open();
        drawer()!.querySelector('[role="tablist"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(drawer()!.querySelector('[data-drawer-tab="organize"]')!.getAttribute('aria-selected')).toBe('true');
        expect(document.activeElement).toBe(drawer()!.querySelector('[data-drawer-tab="organize"]'));
        drawer()!.querySelector('[role="tablist"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        drawer()!.querySelector('[role="tablist"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        expect(drawer()!.querySelector('[data-drawer-tab="values"]')!.getAttribute('aria-selected')).toBe('true');
    });

    it('groups the rows by a column and a subgroup, listing them', () => {
        const { element, drawer, open, tab, pick, apply, on } = mount();
        open();
        tab('organize');
        expect(drawer()!.textContent).toContain('No grouping selected.');
        pick('[data-drawer-select="group"]', 'customer');
        pick('[data-drawer-select="subgroup"]', 'seller');
        expect(Array.from(drawer()!.querySelectorAll('[data-drawer-group]'), (chip) => chip.getAttribute('data-drawer-group'))).toEqual(['customer', 'seller']);
        apply();
        expect(on['group-by-change']).toHaveBeenCalledWith({ groupBy: ['customer', 'seller'] });
        expect(element.querySelectorAll('.vt-datagrid-group-row').length).toBeGreaterThan(0);
    });

    it('picks how each number column is worked out, and clears them', () => {
        const { drawer, open, tab, apply, on } = mount({ totalRow: true });
        open();
        tab('values');
        expect(Array.from(drawer()!.querySelectorAll('[data-drawer-value]'), (row) => row.getAttribute('data-drawer-value'))).toEqual(['gross', 'discount']);
        const select = (key: string) => drawer()!.querySelector(`[data-drawer-value="${key}"] select`) as HTMLSelectElement;
        expect(select('gross').value).toBe('sum');
        select('discount').value = 'max';
        select('discount').dispatchEvent(new Event('change', { bubbles: true }));
        apply();
        expect(on['aggregates-change']).toHaveBeenCalledWith({ aggregates: { gross: 'sum', discount: 'max' } });
        expect(document.querySelector('[data-total="discount"]')!.textContent).toBe('2');
        open();
        tab('values');
        (drawer()!.querySelector('[data-drawer-clear]') as HTMLButtonElement).click();
        apply();
        expect(on['aggregates-change']).toHaveBeenLastCalledWith({ aggregates: { gross: undefined, discount: undefined } });
        expect(document.querySelector('[data-total="gross"]')!.textContent).toBe('');
    });

    it('turns the table into a pivot of the rows, columns and values chosen', () => {
        const { drawer, open, tab, pick, apply, on } = mount();
        open();
        tab('organize');
        (drawer()!.querySelector('[data-drawer-pivot]') as HTMLInputElement).click();
        pick('[data-drawer-select="group"]', 'customer');
        pick('[data-drawer-select="pivot-columns"]', 'seller');
        apply();
        expect(on['pivot-change']).toHaveBeenLastCalledWith({ pivot: expect.objectContaining({ enabled: true, rows: ['customer'], columns: ['seller'], values: [{ field: 'gross', aggregate: 'sum' }] }) });
    });

    it('shuts on Escape, and reads well to a screen reader', async () => {
        const { drawer, open } = mount();
        open();
        await expectNoA11yViolations(drawer()!);
        drawer()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(drawer()).toBeNull();
    });
});
