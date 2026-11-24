import { en, FilterService } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { distinctValues, filterKind, filterValue, fromPanel, matchModesFor, panelFilter } from './engine/filters';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Order {
    id: number;
    customer: string;
    city: string | null;
    total: number;
    placed: Date;
}

const orders: Order[] = [
    { id: 1, customer: 'Ana', city: 'Lisbon', total: 120, placed: new Date(2026, 0, 10) },
    { id: 2, customer: 'Bruno', city: 'Porto', total: 80, placed: new Date(2026, 1, 3) },
    { id: 3, customer: 'Carla', city: 'Lisbon', total: 300, placed: new Date(2026, 2, 21) },
    { id: 4, customer: 'Diego', city: null, total: 45, placed: new Date(2026, 3, 2) },
    { id: 5, customer: 'Elisa', city: 'Faro', total: 210, placed: new Date(2026, 4, 9) }
];

const columns: DataGridColumn<Order>[] = [
    { field: 'customer', header: 'Customer', filter: true, sortable: true },
    { field: 'city', header: 'City', filter: 'set' },
    { field: 'total', header: 'Total', filter: true, sortable: true },
    { field: 'placed', header: 'Placed', filter: true, body: ({ value }) => (value as Date).toISOString().slice(0, 10) }
];

let handle: DataGridHandle<Order> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const on = { filter: vi.fn(), sort: vi.fn(), 'column-pin': vi.fn(), 'column-toggle': vi.fn() };
    handle = createDataGrid<Order>(element, { value: orders, dataKey: 'id', columns, ariaLabel: 'Orders', filterDisplay: 'menu', on, ...config });
    const names = () => Array.from(element.querySelectorAll('[data-section="body"] [role="row"][data-index] :is([role="cell"],[role="gridcell"]):first-child'), (td) => td.textContent);
    const panel = () => document.querySelector('.vt-datagrid-filter-panel') as HTMLElement | null;
    const openFilter = (key: string) => (element.querySelector(`[data-filter-button="${key}"]`) as HTMLButtonElement).click();
    const type = (input: Element, text: string) => {
        (input as HTMLInputElement).value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    return { element, on, names, panel, openFilter, type };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('the filter panel’s workings', () => {
    it('reads a column’s kind from its values, or from what it says', () => {
        expect(filterKind(columns[0]!, orders, 'customer')).toBe('text');
        expect(filterKind(columns[2]!, orders, 'total')).toBe('number');
        expect(filterKind(columns[3]!, orders, 'placed')).toBe('date');
        expect(filterKind(columns[1]!, orders, 'city')).toBe('set');
        expect(matchModesFor(columns[2]!, 'number')).toContain('gte');
        expect(matchModesFor({ filterMatchModes: ['equals'] }, 'text')).toEqual(['equals']);
    });

    it('lists a column’s values once each, in order, with the blanks last', () => {
        expect(distinctValues(columns[1]!, orders, 'city', 'en')).toEqual(['Faro', 'Lisbon', 'Porto', null]);
        expect(distinctValues(columns[2]!, orders, 'total')).toEqual([45, 80, 120, 210, 300]);
        expect(distinctValues({ filterOptions: ['x'] }, orders, 'city')).toEqual(['x']);
    });

    it('turns a filter into two conditions and back, the empty second left out', () => {
        const panel = panelFilter({ value: 'a', matchMode: 'startsWith' }, ['contains']);
        expect(panel.constraints[1]).toEqual({ value: null, matchMode: 'contains' });
        expect(fromPanel(panel)).toEqual({ operator: 'and', constraints: [{ value: 'a', matchMode: 'startsWith' }] });
        expect(filterValue('1.5', 'number', en)).toBe(1.5);
        expect(filterValue('-', 'number', en)).toBeNull();
    });

    it('matches one of a list, where an empty list matches nothing and a blank is null', () => {
        expect(FilterService.matches('a', ['a', 'b'], 'anyOf')).toBe(true);
        expect(FilterService.matches('c', [], 'anyOf')).toBe(false);
        expect(FilterService.matches(null, [null], 'anyOf')).toBe(true);
        expect(FilterService.matches('', [null], 'anyOf')).toBe(true);
    });
});

describe('filtering from a header', () => {
    it('draws a button in each filtered header, which opens the panel and lights while it filters', () => {
        const { element, panel, openFilter, type, names, on } = mount();
        const button = element.querySelector('[data-filter-button="customer"]')!;
        expect(button.getAttribute('aria-label')).toBe('Filter Customer');
        expect(button.getAttribute('aria-haspopup')).toBe('dialog');
        openFilter('customer');
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(panel()!.getAttribute('role')).toBe('dialog');
        const box = panel()!.querySelector('[data-filter-value="0"]')!;
        expect(document.activeElement).toBe(box);
        type(box, 'ar');
        expect(names()).toEqual(['Carla']);
        expect(on.filter).toHaveBeenCalled();
        expect(element.querySelector('[data-filter-button="customer"]')!.className).toContain('vt-datagrid-header-tool-active');
    });

    it('joins a second condition with Or', () => {
        const { panel, openFilter, type, names } = mount();
        openFilter('customer');
        type(panel()!.querySelector('[data-filter-value="0"]')!, 'ana');
        expect(names()).toEqual(['Ana']);
        (panel()!.querySelector('input[value="or"]') as HTMLInputElement).click();
        type(panel()!.querySelector('[data-filter-value="1"]')!, 'elisa');
        expect(names()).toEqual(['Ana', 'Elisa']);
    });

    it('compares numbers as numbers, by the mode chosen', () => {
        const { panel, openFilter, type, names } = mount();
        openFilter('total');
        const box = panel()!.querySelector('[data-filter-value="0"]') as HTMLInputElement;
        expect(box.getAttribute('inputmode')).toBe('decimal');
        type(box, '120');
        expect(names()).toEqual(['Ana']);
        // The first mode of a number is Equals; ask for Greater than through the grid's models instead of the select's popup.
        handle!.update({ filters: { total: { operator: 'and', constraints: [{ value: 100, matchMode: 'gt' }] } } });
        expect(names()).toEqual(['Ana', 'Carla', 'Elisa']);
    });

    it('filters dates with a date input', () => {
        const { panel, openFilter, type, names } = mount();
        openFilter('placed');
        const box = panel()!.querySelector('[data-filter-value="0"]') as HTMLInputElement;
        expect(box.type).toBe('date');
        type(box, '2026-02-03');
        expect(names()).toEqual(['Bruno']);
    });

    it('ticks values in a list, searches it, and selects all of what it found', () => {
        const { panel, openFilter, names, type } = mount();
        openFilter('city');
        const boxes = () => Array.from(panel()!.querySelectorAll('.vt-datagrid-filter-values input')) as HTMLInputElement[];
        expect(Array.from(panel()!.querySelectorAll('.vt-datagrid-filter-values li'), (li) => li.textContent)).toEqual(['Faro', 'Lisbon', 'Porto', '(Blank)']);
        expect(boxes().every((box) => box.checked)).toBe(true);
        boxes()[1]!.click();
        expect(names()).toEqual(['Bruno', 'Diego', 'Elisa']);
        const all = panel()!.querySelector('.vt-datagrid-filter-value-all input') as HTMLInputElement;
        expect(all.indeterminate).toBe(true);
        all.click();
        expect(names()).toEqual(['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa']);
        all.click();
        expect(names()).toEqual([]);
        type(panel()!.querySelector('[data-filter-search]')!, 'r');
        expect(boxes()).toHaveLength(2);
        all.click();
        expect(names()).toEqual(['Bruno', 'Elisa']);
    });

    it('clears a column’s filter', () => {
        const { panel, openFilter, type, names } = mount();
        openFilter('customer');
        type(panel()!.querySelector('[data-filter-value="0"]')!, 'ana');
        (panel()!.querySelector('.vt-datagrid-filter-clear') as HTMLButtonElement).click();
        expect(names()).toHaveLength(5);
        expect((panel()!.querySelector('[data-filter-value="0"]') as HTMLInputElement).value).toBe('');
    });

    it('opens with the filter the grid already has', () => {
        const { panel, openFilter } = mount({ filters: { city: { value: ['Porto'], matchMode: 'anyOf' } } });
        openFilter('city');
        const ticked = Array.from(panel()!.querySelectorAll('.vt-datagrid-filter-values li'))
            .filter((li) => (li.querySelector('input') as HTMLInputElement).checked)
            .map((li) => li.textContent);
        expect(ticked).toEqual(['Porto']);
    });

    it('closes on Escape, the keyboard back on its button', () => {
        const { element, panel, openFilter } = mount();
        openFilter('customer');
        document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(panel()).toBeNull();
        expect(document.activeElement).toBe(element.querySelector('[data-filter-button="customer"]'));
    });

    it('draws no buttons with filters in a row, and both with both', () => {
        expect(mount({ filterDisplay: 'row' }).element.querySelector('[data-filter-button]')).toBeNull();
        handle!.destroy();
        const { element } = mount({ filterDisplay: 'both' });
        expect(element.querySelector('[data-filter-button]')).not.toBeNull();
        // A list of values is ticked in its panel, not typed in the row.
        expect(element.querySelector('.vt-datagrid-filter-row :is([role="cell"],[role="gridcell"]):nth-child(2) input')).toBeNull();
        expect(element.querySelector('.vt-datagrid-filter-row :is([role="cell"],[role="gridcell"]):nth-child(1) input')).not.toBeNull();
    });

    it('is a panel a screen reader can use', async () => {
        const { openFilter, panel } = mount();
        openFilter('city');
        await expectNoA11yViolations(panel()!);
    });
});

describe('a column’s menu', () => {
    const items = () => Array.from(document.querySelectorAll('[role="menuitem"], [role="menuitemradio"]'));
    const pick = (label: string) => (items().find((item) => item.textContent === label) as HTMLElement).click();

    it('sorts, pins and hides from a button in the header', () => {
        const { element, names, on } = mount({ columnMenu: true });
        const button = () => element.querySelector('[data-menu-button="total"]') as HTMLButtonElement;
        expect(button().getAttribute('aria-label')).toBe('Options for Total');
        button().click();
        expect(document.querySelector('[role="menu"]')!.getAttribute('aria-label')).toBe('Options for Total');
        expect(button().getAttribute('aria-expanded')).toBe('true');
        pick('Sort descending');
        expect(names()).toEqual(['Carla', 'Elisa', 'Ana', 'Bruno', 'Diego']);
        expect(on.sort).toHaveBeenCalledWith(expect.objectContaining({ sortField: 'total', sortOrder: -1 }));
        button().click();
        expect((items().find((item) => item.textContent === 'Sort descending') as HTMLButtonElement).disabled).toBe(true);
        pick('Pin column');
        pick('Pin to the start');
        expect(on['column-pin']).toHaveBeenCalledWith(expect.objectContaining({ key: 'total', side: 'left' }));
        button().click();
        pick('Hide column');
        expect(element.querySelector(':is([role="columnheader"],[role="rowheader"])[data-column="total"]')).toBeNull();
        (element.querySelector('[data-menu-button="customer"]') as HTMLButtonElement).click();
        pick('Reset columns');
        expect(element.querySelector(':is([role="columnheader"],[role="rowheader"])[data-column="total"]')).not.toBeNull();
    });

    it('opens its submenus by the keyboard, ticks the choice made, and goes back a level', async () => {
        const { element } = mount({ columnMenu: true });
        (element.querySelector('[data-menu-button="total"]') as HTMLButtonElement).click();
        const pin = items().find((item) => item.textContent === 'Pin column') as HTMLElement;
        expect(pin.getAttribute('aria-haspopup')).toBe('menu');
        expect(pin.getAttribute('aria-expanded')).toBe('false');
        // Walk down to it, then the right arrow opens it on its first item.
        const menu = document.querySelector('[role="menu"]') as HTMLElement;
        while (document.activeElement !== pin) menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(pin.closest('[role="none"]')!.querySelector('[data-submenu]')).not.toBeNull();
        expect(document.activeElement!.textContent).toBe('Pin to the start');
        const radios = Array.from(document.querySelectorAll('[data-submenu] [role="menuitemradio"]'), (item) => [item.textContent, item.getAttribute('aria-checked')]);
        expect(radios).toEqual([
            ['Pin to the start', 'false'],
            ['Pin to the end', 'false'],
            ['No pin', 'true']
        ]);
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(document.querySelector('[data-submenu]')).toBeNull();
        expect(document.querySelector('[role="menu"]')).not.toBeNull();
        expect(document.activeElement!.textContent).toBe('Pin column');
    });

    it('works a number column out by the aggregation picked, and none takes it off', () => {
        const aggregates = vi.fn();
        const { element } = mount({ columnMenu: true, totalRow: true, on: { 'aggregates-change': aggregates } });
        const open = () => (element.querySelector('[data-menu-button="total"]') as HTMLButtonElement).click();
        open();
        expect(items().map((item) => item.textContent)).toContain('Value aggregation');
        pick('Value aggregation');
        expect(Array.from(document.querySelectorAll('[data-submenu] [role="menuitemradio"]'), (item) => item.textContent)).toEqual(['None', 'Sum', 'Min', 'Max', 'Average', 'Count']);
        pick('Sum');
        expect(aggregates).toHaveBeenLastCalledWith({ aggregates: { total: 'sum' } });
        expect(element.querySelector('[data-section="foot"]')?.textContent ?? element.textContent).toContain('755');
        open();
        pick('Value aggregation');
        expect(document.querySelector('[data-submenu] [aria-checked="true"]')!.textContent).toBe('Sum');
        pick('None');
        expect(aggregates).toHaveBeenLastCalledWith({ aggregates: { total: undefined } });
        // A text column has nothing to work out.
        (element.querySelector('[data-menu-button="customer"]') as HTMLButtonElement).click();
        expect(items().map((item) => item.textContent)).not.toContain('Value aggregation');
    });

    it('moves a column left and right, the ends not going further', () => {
        const { element } = mount({ columnMenu: true });
        const headers = () => Array.from(element.querySelectorAll('[data-section="head"] [role="columnheader"]'), (th) => th.getAttribute('data-column'));
        (element.querySelector('[data-menu-button="total"]') as HTMLButtonElement).click();
        pick('Move left');
        expect(headers()).toEqual(['customer', 'total', 'city', 'placed']);
        (element.querySelector('[data-menu-button="total"]') as HTMLButtonElement).click();
        pick('Move right');
        expect(headers()).toEqual(['customer', 'city', 'total', 'placed']);
        (element.querySelector('[data-menu-button="customer"]') as HTMLButtonElement).click();
        expect((items().find((item) => item.textContent === 'Move left') as HTMLButtonElement).disabled).toBe(true);
    });

    it('fits a column, or all of them, to what they hold', () => {
        const resize = vi.fn();
        const { element } = mount({ columnMenu: true, on: { 'column-resize': resize } });
        // jsdom lays nothing out: every copy measures 0 wide, so the least width a column may have is what it gets.
        (element.querySelector('[data-menu-button="total"]') as HTMLButtonElement).click();
        pick('Autosize this column');
        (element.querySelector('[data-menu-button="total"]') as HTMLButtonElement).click();
        pick('Autosize all columns');
        expect(document.querySelector('[data-grid-table] > [aria-hidden="true"]')).toBeNull();
    });

    it('takes a function that changes what it offers', () => {
        const { element } = mount({
            columnMenu: ({ items, key }: { items: { label?: string }[]; key: string }) => [...items.filter((item) => item.label !== 'Hide column'), { label: `About ${key}` }]
        });
        (element.querySelector('[data-menu-button="customer"]') as HTMLButtonElement).click();
        expect(items().map((item) => item.textContent)).toContain('About customer');
        expect(items().map((item) => item.textContent)).not.toContain('Hide column');
    });

    it('is left out for a column that says so', () => {
        const { element } = mount({ columnMenu: true, columns: [{ ...columns[0]!, menu: false }, columns[1]] });
        expect(element.querySelector('[data-menu-button="customer"]')).toBeNull();
        expect(element.querySelector('[data-menu-button="city"]')).not.toBeNull();
    });
});

describe('a cell’s menu', () => {
    it('opens on a right click, and copies the cell or its row', async () => {
        const writeText = vi.fn(() => Promise.resolve());
        Object.assign(navigator, { clipboard: { writeText } });
        const { element } = mount({ contextMenu: true });
        const cell = element.querySelector('[role="row"][data-index="1"] :is([role="cell"],[role="gridcell"])[data-col="customer"]')!;
        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        cell.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        const labels = Array.from(document.querySelectorAll('[role="menuitem"]'), (item) => item.textContent);
        expect(labels).toEqual(['Copy', 'Copy row', 'Export to CSV', 'Export to Excel']);
        (document.querySelectorAll('[role="menuitem"]')[1] as HTMLElement).click();
        expect(writeText).toHaveBeenCalledWith('Bruno\tPorto\t80\t2026-02-03');
    });

    it('leaves the browser’s own menu alone unless asked for', () => {
        const { element } = mount();
        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        element.querySelector(':is([role="cell"],[role="gridcell"])[data-col="customer"]')!.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
    });

    it('hands the cell to a function that changes what it offers', () => {
        const seen: unknown[] = [];
        const { element } = mount({
            contextMenu: (context: { value: unknown; items: unknown[] }) => {
                seen.push(context.value);
                return [{ label: 'Call' }];
            }
        });
        element.querySelector('[role="row"][data-index="2"] :is([role="cell"],[role="gridcell"])[data-col="total"]')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        expect(seen).toEqual([300]);
        expect(Array.from(document.querySelectorAll('[role="menuitem"]'), (item) => item.textContent)).toEqual(['Call']);
    });
});
