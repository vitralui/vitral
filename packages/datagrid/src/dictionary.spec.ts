import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Sale {
    id: number;
    customer: string;
    gross: number;
    discount: number;
}

const sales: Sale[] = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, customer: `Customer ${i + 1}`, gross: 100 + i, discount: i % 3 }));

const columns: DataGridColumn<Sale>[] = [
    { field: 'customer', header: 'Customer', description: 'Who bought.' },
    { field: 'gross', header: 'Gross sale', description: 'What was sold, before discounts.', formula: 'quantity × unit price' },
    { field: 'discount', header: 'Discount' }
];

let handle: DataGridHandle<Sale> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const on = { 'side-panel-change': vi.fn(), 'size-change': vi.fn() };
    handle = createDataGrid<Sale>(element, { value: sales, dataKey: 'id', columns, ariaLabel: 'Sales', on, ...config });
    const info = (key: string) => element.querySelector(`[data-info-button="${key}"]`) as HTMLButtonElement | null;
    const tool = (key: string) => element.querySelector(`[data-toolbar="${key}"]`) as HTMLButtonElement | null;
    const entries = () => Array.from(element.querySelectorAll('[data-dictionary]'), (entry) => entry.getAttribute('data-dictionary'));
    return { element, on, info, tool, entries };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('what a column holds', () => {
    it('draws an info button by a header with a description, which opens it with its formula', () => {
        const { info } = mount();
        expect(info('discount')).toBeNull();
        const button = info('gross')!;
        expect(button.getAttribute('aria-label')).toBe('About Gross sale');
        expect(button.getAttribute('aria-expanded')).toBe('false');
        button.click();
        const popover = document.querySelector('.vt-datagrid-column-info') as HTMLElement;
        expect(popover.getAttribute('role')).toBe('dialog');
        expect(popover.textContent).toContain('What was sold, before discounts.');
        expect(popover.querySelector('code')!.textContent).toBe('quantity × unit price');
        expect(info('gross')!.getAttribute('aria-expanded')).toBe('true');
        info('gross')!.click();
        expect(document.querySelector('.vt-datagrid-column-info')).toBeNull();
    });

    it('leaves the description to the dictionary when told to', () => {
        const { info } = mount({ columnInfo: false });
        expect(info('gross')).toBeNull();
    });

    it('lists every column in the data dictionary, hidden ones too, and finds them by what they say', () => {
        const { element, entries } = mount({ sideBar: true, sideBarOpen: 'dictionary', columnLayout: { hidden: ['discount'] } });
        expect(element.querySelector('[data-side-tab="dictionary"]')).not.toBeNull();
        expect(entries()).toEqual(['customer', 'gross', 'discount']);
        expect(element.querySelector('[data-dictionary="discount"]')!.textContent).toContain('Hidden');
        expect(element.querySelector('[data-dictionary="discount"]')!.textContent).toContain('No description yet.');
        const search = element.querySelector('[data-side-search]') as HTMLInputElement;
        search.value = 'desconto discounts';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        expect(entries()).toEqual([]);
        search.value = 'before discounts';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        expect(entries()).toEqual(['gross']);
    });

    it('takes the dictionary into `sideBar: true` only when a column has a description', () => {
        const { element } = mount({ sideBar: true, columns: [{ field: 'customer', header: 'Customer' }] });
        expect(element.querySelector('[data-side-tab="dictionary"]')).toBeNull();
    });

    it('opens a panel for the page, and says so', () => {
        const { element, on } = mount({ sideBar: ['columns', 'dictionary'] });
        handle!.openSidePanel('dictionary');
        expect(element.querySelector('.vt-datagrid-side-panel-dictionary')).not.toBeNull();
        expect(on['side-panel-change']).toHaveBeenLastCalledWith({ panel: 'dictionary' });
        handle!.openSidePanel('pivot');
        expect(element.querySelector('.vt-datagrid-side-panel')).toBeNull();
        expect(on['side-panel-change']).toHaveBeenLastCalledWith({ panel: null });
    });

    it('is a popover and a panel a screen reader can read', async () => {
        const { element, info } = mount({ sideBar: true, sideBarOpen: 'dictionary' });
        info('gross')!.click();
        await expectNoA11yViolations(element);
        await expectNoA11yViolations(document.querySelector('.vt-datagrid-column-info') as HTMLElement);
    });
});

describe('the toolbar', () => {
    it('draws the buttons that apply, the dictionary with its label', () => {
        const { element, tool } = mount({ toolbar: true, sideBar: ['columns', 'dictionary'] });
        expect(Array.from(element.querySelectorAll('[data-toolbar]'), (button) => button.getAttribute('data-toolbar'))).toEqual(['dictionary', 'export', 'density', 'columns']);
        expect(tool('dictionary')!.textContent).toBe('Data dictionary');
        expect(tool('export')!.getAttribute('aria-label')).toBe('Download');
        tool('dictionary')!.click();
        expect(element.querySelector('.vt-datagrid-side-panel-dictionary')).not.toBeNull();
        expect(tool('dictionary')!.getAttribute('aria-pressed')).toBe('true');
        tool('columns')!.click();
        expect(element.querySelector('.vt-datagrid-side-panel-columns')).not.toBeNull();
    });

    it('leaves a column out of the dictionary when told to', () => {
        const { tool, entries } = mount({
            toolbar: ['dictionary'],
            dictionaryDrawer: true,
            columns: [...columns, { key: 'actions', header: 'Actions', dictionary: false, body: () => '…' }]
        });
        tool('dictionary')!.click();
        expect(entries()).toEqual(['customer', 'gross', 'discount']);
    });

    it('opens the dictionary in a drawer when asked, with no side bar at all', () => {
        const { element, tool } = mount({ toolbar: ['dictionary'], dictionaryDrawer: true, dictionaryModule: 'Sales', dictionarySubtitle: 'What each column holds.' });
        expect(element.querySelector('[data-side-tab]')).toBeNull();
        tool('dictionary')!.click();
        const drawer = () => document.querySelector('[data-dictionary-drawer]');
        expect(drawer()!.getAttribute('role')).toBe('dialog');
        expect(tool('dictionary')!.getAttribute('aria-pressed')).toBe('true');
        expect(drawer()!.textContent).toContain('What each column holds.');
        expect(Array.from(drawer()!.querySelectorAll('[data-dictionary]'), (entry) => entry.getAttribute('data-dictionary'))).toEqual(['customer', 'gross', 'discount']);
        const search = drawer()!.querySelector('[data-side-search]') as HTMLInputElement;
        search.value = 'before discounts';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        expect(Array.from(drawer()!.querySelectorAll('[data-dictionary]'), (entry) => entry.getAttribute('data-dictionary'))).toEqual(['gross']);
        drawer()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(drawer()).toBeNull();
        tool('dictionary')!.click();
        // Opened again, the search starts over.
        expect(drawer()!.querySelectorAll('[data-dictionary]')).toHaveLength(3);
        (drawer()!.querySelector('[data-dictionary-close]') as HTMLButtonElement).click();
        expect(drawer()).toBeNull();
    });

    it('says what a button that is only an icon does, on hover, in a tooltip of its own rather than the browser\'s', async () => {
        const { tool } = mount({ toolbar: true, sideBar: ['columns', 'dictionary'] });
        const button = tool('density')!;
        expect(button.getAttribute('title')).toBeNull();
        button.dispatchEvent(new MouseEvent('mouseenter'));
        await new Promise((resolve) => setTimeout(resolve, 450));
        expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(button.getAttribute('aria-label'));
    });

    it('leaves out what does not apply, and takes buttons of the host’s own', () => {
        const press = vi.fn();
        const { element, tool } = mount({ toolbar: ['dictionary', 'columns', { key: 'refresh', label: 'Refresh', icon: 'refresh', onClick: press }] });
        expect(Array.from(element.querySelectorAll('[data-toolbar]'), (button) => button.getAttribute('data-toolbar'))).toEqual(['refresh']);
        tool('refresh')!.click();
        expect(press).toHaveBeenCalled();
    });

    it('picks how close the rows sit from a menu', () => {
        const { element, tool, on } = mount({ toolbar: ['density'] });
        tool('density')!.click();
        const compact = Array.from(document.querySelectorAll('[role="menuitem"]')).find((item) => item.textContent?.includes('Compact')) as HTMLElement;
        compact.click();
        expect(element.classList).toContain('vt-datagrid-sm');
        expect(on['size-change']).toHaveBeenCalledWith({ size: 'small' });
    });
});

describe('a page typed in', () => {
    it('goes to the page typed, kept between the first and the last', () => {
        const { element } = mount({ paginator: true, rows: 5, rowsPerPageOptions: [5, 10], paginatorTemplate: 'RowsPerPageLabel RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageInput NextPageLink LastPageLink' });
        const box = () => element.querySelector('[data-page-input]') as HTMLInputElement;
        expect(element.querySelector('.vt-paginator-rows-per-page-label')!.textContent).toBe('Page size:');
        expect(box().closest('label')!.textContent).toBe('Pageof 5');
        box().value = '3';
        box().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(handle!.state().first).toBe(10);
        expect(box().value).toBe('3');
        box().value = '99';
        box().dispatchEvent(new Event('change', { bubbles: true }));
        expect(handle!.state().first).toBe(20);
        box().value = 'x';
        box().dispatchEvent(new Event('change', { bubbles: true }));
        expect(box().value).toBe('5');
    });
});

describe('a header laid out as a report’s', () => {
    const sortable = columns.map((column) => ({ ...column, sortable: true, filter: true }));

    it('puts the info button right after the title, and the sort arrow in its place while sorted', () => {
        const { element, info } = mount({ columns: sortable, filterDisplay: 'menu', columnMenu: true });
        const header = () => element.querySelector('[data-column="gross"]')!;
        const order = () =>
            Array.from(header().querySelectorAll('.vt-datagrid-sort-icon, [data-info-button], [data-filter-button], [data-menu-button]'), (node) =>
                node.matches('.vt-datagrid-sort-icon') ? 'arrow' : node.hasAttribute('data-info-button') ? 'info' : node.hasAttribute('data-filter-button') ? 'filter' : 'menu'
            );
        expect(order()).toEqual(['info', 'filter', 'menu']);
        (header().querySelector('.vt-datagrid-sort-button') as HTMLButtonElement).click();
        expect(order()).toEqual(['arrow', 'filter', 'menu']);
        expect(info('gross')).toBeNull();
        // A column with nothing to say keeps its arrow, shown when pointed at.
        expect(element.querySelector('[data-column="discount"] .vt-datagrid-sort-icon')).not.toBeNull();
    });

    it('sorts from the room left in the header, not from its buttons', () => {
        const { element } = mount({ columns: sortable, filterDisplay: 'menu' });
        const content = element.querySelector('[data-column="customer"] .vt-datagrid-header-content') as HTMLElement;
        content.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(handle!.state().sortField).toBe('customer');
        (element.querySelector('[data-filter-button="customer"]') as HTMLButtonElement).click();
        expect(handle!.state().sortOrder).toBe(1);
    });

    it('keeps the info button by the title and the filter and menu together, at the column\'s edge unless told otherwise', () => {
        const { element } = mount({ columnMenu: true, filterDisplay: 'menu', columns: columns.map((column) => ({ ...column, filter: true })) });
        const content = element.querySelector('[data-section="head"] [data-column="customer"] .vt-datagrid-header-content')!;
        const parts = Array.from(content.children, (child) => (child.hasAttribute('data-info-button') ? 'info' : child.classList.contains('vt-datagrid-header-tools') ? 'tools' : 'title'));
        expect(parts).toEqual(['title', 'info', 'tools']);
        const tools = content.querySelector('.vt-datagrid-header-tools')!;
        expect(tools.querySelector('[data-filter-button]')).not.toBeNull();
        expect(tools.querySelector('[data-menu-button]')).not.toBeNull();
        const cell = (key: string) => element.querySelector(`[data-section="head"] [data-column="${key}"]`)!;
        expect(cell('customer').classList).not.toContain('vt-datagrid-header-tools-at-title');
        handle!.update({ headerToolsAt: 'title' });
        expect(cell('customer').classList).toContain('vt-datagrid-header-tools-at-title');
    });

    it('puts the info button with the filter and the menu when told to, for the grid or for one column', () => {
        const at = (key: string) => {
            const info = element.querySelector(`[data-info-button="${key}"]`)!;
            return info.parentElement!.classList.contains('vt-datagrid-header-tools') ? 'edge' : 'title';
        };
        const { element } = mount({
            columnMenu: true,
            headerInfoAt: 'edge',
            columns: [
                { field: 'customer', header: 'Customer', description: 'Who bought.' },
                { field: 'gross', header: 'Gross sale', description: 'Before discounts.', headerInfoAt: 'title', headerToolsAt: 'title' }
            ]
        });
        expect(at('customer')).toBe('edge');
        expect(at('gross')).toBe('title');
        expect(element.querySelector('[data-section="head"] [data-column="gross"]')!.classList).toContain('vt-datagrid-header-tools-at-title');
        // With nothing else at the edge, the info button still goes there when asked.
        handle!.update({ columnMenu: false });
        expect(at('customer')).toBe('edge');
    });

    it('goes on under the rows as empty ones when told to, on the columns\' tracks, striped on from the rows', () => {
        const { element } = mount({ fillRows: true, minHeight: '20rem', stripedRows: true });
        const fill = () => element.querySelector('[data-section="fill"]');
        expect(fill()!.getAttribute('aria-hidden')).toBe('true');
        // Three rows above: the first empty one is the fourth, an even one, striped.
        expect(fill()!.classList).toContain('vt-datagrid-fill-rows-odd');
        expect(fill()!.querySelectorAll('.vt-datagrid-fill-cell')).toHaveLength(3);
        expect(element.querySelector('.vt-datagrid-table-container')!.classList).toContain('vt-datagrid-table-container-fill');
        expect((element.querySelector('[data-grid-table]') as HTMLElement).style.gridTemplateRows).toBe('auto auto 1fr');
        // No rows: the empty message has the room, not empty rows.
        handle!.update({ value: [] });
        expect(fill()).toBeNull();
        handle!.update({ value: sales.slice(0, 2), fillRows: false });
        expect(fill()).toBeNull();
    });

    it('stacks each row into a card of labelled cells under its breakpoint, when told to', () => {
        const { element } = mount({ responsiveLayout: 'stack', breakpoint: '600px' });
        let width = 400;
        Object.defineProperty(element, 'clientWidth', { configurable: true, get: () => width });
        handle!.refresh();
        expect(element.classList).toContain('vt-datagrid-stacked');
        const cell = element.querySelector('[data-section="body"] [role="row"][data-index="0"] [data-col="gross"]')!;
        expect(cell.getAttribute('data-label')).toBe('Gross sale');
        width = 800;
        handle!.refresh();
        expect(element.classList).not.toContain('vt-datagrid-stacked');
        expect(element.querySelector('[data-label]')).toBeNull();
        width = 400;
        handle!.update({ columns: [{ ...columns[0], stackLabel: false }, { ...columns[1], stackLabel: 'Sale' }, columns[2]] });
        const label = (key: string) => element.querySelector(`[data-section="body"] [role="row"][data-index="0"] [data-col="${key}"]`)!.getAttribute('data-label');
        expect([label('customer'), label('gross'), label('discount')]).toEqual(['', 'Sale', 'Discount']);
        handle!.update({ responsiveLayout: undefined });
        expect(element.classList).not.toContain('vt-datagrid-stacked');
    });

    it('keeps the menu button in view unless told to show it on pointing, and keeps a least height', () => {
        const { element } = mount({ columnMenu: true, minHeight: '20rem', value: [] });
        expect(element.classList).not.toContain('vt-datagrid-tools-on-hover');
        expect((element.querySelector('.vt-datagrid-table-container') as HTMLElement).style.minHeight).toBe('20rem');
        handle!.update({ headerTools: 'hover' });
        expect(element.classList).toContain('vt-datagrid-tools-on-hover');
    });
});

describe('a dictionary as a report’s', () => {
    const described: DataGridColumn<Sale>[] = [
        { field: 'customer', header: 'Customer', kind: 'dimension', description: 'Who bought.', source: 'orders.customer_id', notes: 'Can be empty' },
        { field: 'gross', header: 'Gross sale', kind: 'metric', notes: ['Returns are taken off', 'Freight is not counted'] },
        { field: 'discount', header: 'Discount' }
    ];

    it('tags each column a dimension or a metric, says where it comes from, and warns of its rules', () => {
        const { element } = mount({ columns: described, sideBar: true, sideBarOpen: 'dictionary', dictionaryModule: 'Sales', dictionarySubtitle: 'Every column of the report.' });
        expect(element.querySelector('.vt-datagrid-dictionary-module')!.textContent).toBe('Module · Sales');
        expect(element.querySelector('.vt-datagrid-dictionary-subtitle')!.textContent).toBe('Every column of the report.');
        const customer = element.querySelector('[data-dictionary="customer"]')!;
        expect(customer.querySelector('.vt-datagrid-column-kind')!.textContent).toBe('Dimension');
        expect(customer.querySelector('.vt-datagrid-column-source')!.textContent).toBe('Source: orders.customer_id');
        expect(customer.querySelector('[role="note"]')!.textContent).toBe('Can be empty');
        const gross = element.querySelector('[data-dictionary="gross"]')!;
        expect(gross.querySelector('.vt-datagrid-column-kind-metric')!.textContent).toBe('Metric');
        expect(Array.from(gross.querySelectorAll('[role="note"] li'), (li) => li.textContent)).toEqual(['Returns are taken off', 'Freight is not counted']);
        // The search finds a column by its source and its rules too.
        const search = element.querySelector('[data-side-search]') as HTMLInputElement;
        search.value = 'freight';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        expect(Array.from(element.querySelectorAll('[data-dictionary]'), (entry) => entry.getAttribute('data-dictionary'))).toEqual(['gross']);
    });

    it('shows the tag and the rules in a header’s info popover too', async () => {
        const { element, info } = mount({ columns: described });
        info('gross')!.click();
        const popover = document.querySelector('.vt-datagrid-column-info') as HTMLElement;
        expect(popover.querySelector('.vt-datagrid-column-kind')!.textContent).toBe('Metric');
        expect(popover.querySelectorAll('[role="note"] li')).toHaveLength(2);
        await expectNoA11yViolations(popover);
        expect(element).toBeTruthy();
    });
});

describe('a dictionary handed in at once', () => {
    it('fills in what each column holds by its field, a column’s own words winning', () => {
        const plain: DataGridColumn<Sale>[] = [
            { field: 'customer', header: 'Customer', description: 'Said by the column.' },
            { field: 'gross', header: 'Gross sale' },
            { field: 'discount', header: 'Discount' }
        ];
        const { element, info } = mount({
            columns: plain,
            sideBar: true,
            sideBarOpen: 'dictionary',
            dictionary: {
                customer: { description: 'Said by the dictionary.', kind: 'dimension' },
                gross: { description: 'Before discounts.', kind: 'metric', source: 'orders.total', notes: 'Can be empty' }
            }
        });
        expect(element.querySelector('[data-side-tab="dictionary"]')).not.toBeNull();
        expect(info('gross')).not.toBeNull();
        expect(info('discount')).toBeNull();
        const customer = element.querySelector('[data-dictionary="customer"]')!;
        expect(customer.textContent).toContain('Said by the column.');
        expect(customer.querySelector('.vt-datagrid-column-kind')!.textContent).toBe('Dimension');
        expect(element.querySelector('[data-dictionary="gross"] .vt-datagrid-column-source')!.textContent).toBe('Source: orders.total');
    });
});

describe('the toolbar’s download and pivot', () => {
    it('downloads Excel or CSV from a menu, the rows the host hands over when it does', async () => {
        const all = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, customer: `Server ${i + 1}`, gross: i, discount: 0 }));
        const exportRows = vi.fn(async () => all);
        const { tool } = mount({ toolbar: ['export'], exportRows });
        const csv = vi.spyOn(handle!, 'exportCSV').mockImplementation(() => undefined);
        const excel = vi.spyOn(handle!, 'exportExcel').mockImplementation(() => undefined);
        tool('export')!.click();
        const items = () => Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
        expect(items().map((item) => item.textContent?.trim())).toEqual(['Excel (.xlsx)', 'CSV (.csv)']);
        items()[1]!.click();
        await vi.waitFor(() => expect(csv).toHaveBeenCalledWith({ rows: all }));
        tool('export')!.click();
        items()[0]!.click();
        await vi.waitFor(() => expect(excel).toHaveBeenCalledWith({ rows: all }));
        expect(exportRows).toHaveBeenCalledTimes(2);
    });

    it('writes the rows handed to it in place of the grid’s', () => {
        mount();
        const text = handle!.toCSV({ rows: [{ id: 9, customer: 'Only', gross: 1, discount: 0 }] });
        expect(text.split('\n')).toHaveLength(2);
        expect(text).toContain('Only');
    });

    it('turns the pivot on and off, opening its panel when there is nothing in it', () => {
        const { element, tool } = mount({ toolbar: true, sideBar: ['columns', 'pivot'] });
        expect(tool('pivot')!.getAttribute('aria-pressed')).toBe('false');
        tool('pivot')!.click();
        expect(tool('pivot')!.getAttribute('aria-pressed')).toBe('true');
        expect(element.querySelector('.vt-datagrid-side-panel-pivot')).not.toBeNull();
        tool('pivot')!.click();
        expect(tool('pivot')!.getAttribute('aria-pressed')).toBe('false');
    });
});

describe('what the reader chose', () => {
    it('stands when the host hands in its props again, and gives way when the host changes them', () => {
        const { element, tool } = mount({ toolbar: ['density'] });
        tool('density')!.click();
        (Array.from(document.querySelectorAll('[role="menuitem"]')).find((item) => item.textContent?.includes('Compact')) as HTMLElement).click();
        expect(element.classList).toContain('vt-datagrid-sm');
        handle!.update({ size: undefined, stripedRows: true });
        expect(element.classList).toContain('vt-datagrid-sm');
        handle!.update({ size: 'large' });
        expect(element.classList).toContain('vt-datagrid-lg');
    });
});

describe('the totals row', () => {
    const total = (element: HTMLElement, key: string) => element.querySelector(`[data-total="${key}"]`)?.textContent;

    it('works out each column over every row the filters let through, by its aggregate or the one picked', () => {
        const summed = columns.map((column) => (column.field === 'gross' ? { ...column, aggregate: 'sum' as const } : column));
        const { element } = mount({ columns: summed, totalRow: true, paginator: true, rows: 5 });
        // Every row, not the page: 100 + 101 + … + 122.
        expect(total(element, 'gross')).toBe('2553');
        expect(total(element, 'customer')).toBe('');
        handle!.update({ aggregates: { gross: 'max', discount: 'count' } });
        expect(total(element, 'gross')).toBe('122');
        expect(total(element, 'discount')).toBe('23');
    });

    it('draws the values a server gave', () => {
        const { element } = mount({ totalRow: { gross: 'R$ 9.999' } });
        expect(total(element, 'gross')).toBe('R$ 9.999');
    });
});
