import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { DataGridColumn } from './engine/types';
import type { PivotConfig } from './engine/pivot';
import { createDataGrid, type DataGridHandle } from './grid';

interface Sale {
    id: number;
    region: string;
    year: number;
    amount: number;
}

const sales: Sale[] = [
    { id: 1, region: 'Europe', year: 2025, amount: 100 },
    { id: 2, region: 'Europe', year: 2026, amount: 50 },
    { id: 3, region: 'Americas', year: 2025, amount: 200 }
];

const columns: DataGridColumn<Sale>[] = [
    { field: 'region', header: 'Region' },
    { field: 'year', header: 'Year' },
    { field: 'amount', header: 'Amount', body: ({ value }) => `€${value}` }
];

let handle: DataGridHandle<Sale> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const on = { 'pivot-change': vi.fn() };
    handle = createDataGrid<Sale>(element, { value: sales, dataKey: 'id', columns, ariaLabel: 'Sales', sideBar: ['columns', 'pivot'], sideBarOpen: 'pivot', on, ...config });
    const headers = () => Array.from(element.querySelectorAll('thead tr:last-child th'), (th) => th.textContent?.trim());
    const cells = () => Array.from(element.querySelectorAll('tbody tr[data-index]'), (tr) => Array.from(tr.querySelectorAll('td'), (td) => td.textContent));
    const zone = (name: string) => Array.from(element.querySelectorAll(`[data-pivot-zone="${name}"] [data-pivot-item]`), (li) => li.getAttribute('data-pivot-item'));
    const tick = (field: string) => (element.querySelector(`[data-pivot-field="${field}"] input`) as HTMLInputElement).click();
    const mode = () => element.querySelector('[data-pivot-mode]') as HTMLInputElement;
    const last = () => on['pivot-change'].mock.calls.at(-1)![0].pivot as PivotConfig<Sale>;
    return { element, on, headers, cells, zone, tick, mode, last };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('the pivot panel', () => {
    it('is a tab only when asked for', () => {
        const { element } = mount({ sideBar: true, sideBarOpen: null });
        expect(element.querySelector('[data-side-tab="pivot"]')).toBeNull();
        handle!.destroy();
        const again = mount({ sideBarOpen: null });
        expect(again.element.querySelector('[data-side-tab="pivot"]')).not.toBeNull();
    });

    it('lists the fields, and a field ticked goes where its kind suggests and turns the pivot on', () => {
        const { element, zone, tick, mode, headers, on, last } = mount();
        expect(Array.from(element.querySelectorAll('[data-pivot-field]'), (li) => li.textContent)).toEqual(['Region', 'Year', 'Amount']);
        expect(mode().checked).toBe(false);
        tick('region');
        expect(zone('rows')).toEqual(['region']);
        expect(mode().checked).toBe(true);
        tick('amount');
        expect(zone('values')).toEqual(['amount']);
        expect(last()).toMatchObject({ enabled: true, rows: ['region'], values: [{ field: 'amount', aggregate: 'sum' }] });
        expect(on['pivot-change']).toHaveBeenCalledTimes(2);
        expect(headers()).toContain('Region');
    });

    it('draws a value as its column draws it, a count as a number', () => {
        const { cells } = mount({ pivot: { rows: ['region'], values: [{ field: 'amount' }, { field: 'amount', aggregate: 'count', header: 'Sales' }] } });
        const europe = cells().find((row) => row[0] === 'Europe')!;
        expect(europe).toContain('€150');
        expect(europe).toContain('2');
    });

    it('sends a field to a place from its menu, and takes it out with its button', () => {
        const { element, zone } = mount({ pivot: { rows: ['region'], values: [{ field: 'amount' }] } });
        (element.querySelector('[data-pivot-menu="year"]') as HTMLButtonElement).click();
        const item = Array.from(document.querySelectorAll('[role="menuitem"]')).find((entry) => entry.textContent?.includes('Add to Columns')) as HTMLElement;
        item.click();
        expect(zone('columns')).toEqual(['year']);
        (element.querySelector('[data-pivot-zone="columns"] [data-pivot-item="year"] button') as HTMLButtonElement).click();
        expect(zone('columns')).toEqual([]);
    });

    it('moves a field within its place with Ctrl and an arrow, and out of it with Delete', () => {
        const { element, zone } = mount({ pivot: { rows: ['region', 'year'], values: [{ field: 'amount' }] } });
        const handleOf = (field: string) => element.querySelector(`[data-pivot-zone="rows"] [data-pivot-item="${field}"] [role="button"]`) as HTMLElement;
        handleOf('year').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true }));
        expect(zone('rows')).toEqual(['year', 'region']);
        handleOf('year').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
        expect(zone('rows')).toEqual(['region', 'year']);
        handleOf('region').dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
        expect(zone('rows')).toEqual(['year']);
    });

    it('turns off without forgetting, showing the rows themselves', () => {
        const { mode, headers, zone, last } = mount({ pivot: { rows: ['region'], values: [{ field: 'amount' }] } });
        mode().click();
        expect(headers()).toEqual(['Region', 'Year', 'Amount']);
        expect(zone('rows')).toEqual(['region']);
        expect(last().enabled).toBe(false);
        mode().click();
        expect(headers()).not.toContain('Year');
    });

    it('is a panel a screen reader can read', async () => {
        const { element } = mount({ pivot: { rows: ['region'], columns: ['year'], values: [{ field: 'amount' }] } });
        await expectNoA11yViolations(element);
    });
});
