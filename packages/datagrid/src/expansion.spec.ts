import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../vue/test/a11y';
import { createDataGrid, type DataGridHandle } from './grid';

interface Order {
    id: number;
    customer: string;
    items: string[];
}

const orders: Order[] = [
    { id: 1, customer: 'Ana', items: ['Desk', 'Lamp'] },
    { id: 2, customer: 'Bruno', items: ['Chair'] }
];

let handle: DataGridHandle<Order> | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const change = vi.fn();
    handle = createDataGrid<Order>(element, {
        value: orders,
        dataKey: 'id',
        ariaLabel: 'Orders',
        columns: [{ key: 'expand', expander: true }, { field: 'customer', header: 'Customer' }],
        content: { rowExpansion: ({ row }) => `Items: ${row.items.join(', ')}` },
        on: { change },
        ...config
    });
    return { element, change, buttons: () => Array.from(element.querySelectorAll<HTMLButtonElement>('.vt-datagrid-expander')) };
}

describe('rows with a detail', () => {
    it('opens a row’s detail under it, across the table, from a named button', () => {
        const { element, buttons, change } = mount();
        const [first] = buttons();
        expect(first!.getAttribute('aria-expanded')).toBe('false');
        expect(first!.getAttribute('aria-label')).toBe('Expand');
        first!.click();
        const detail = element.querySelector<HTMLTableRowElement>('.vt-datagrid-expansion-row')!;
        expect(detail.textContent).toBe('Items: Desk, Lamp');
        expect(detail.previousElementSibling!.textContent).toContain('Ana');
        expect(detail.cells[0]!.getAttribute('colspan')).toBe('2');
        const opened = buttons()[0]!;
        expect(opened.getAttribute('aria-expanded')).toBe('true');
        expect(opened.getAttribute('aria-controls')).toBe(detail.id);
        expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ expandedRows: [1] }));
        opened.click();
        expect(element.querySelector('.vt-datagrid-expansion-row')).toBeNull();
    });

    it('opens the rows it is told to, and keeps its hands off selection', () => {
        const { element, buttons } = mount({ expandedRows: [2], selectionMode: 'single' });
        expect(element.querySelectorAll('.vt-datagrid-expansion-row')).toHaveLength(1);
        expect(element.querySelector('.vt-datagrid-expansion-row')!.textContent).toBe('Items: Chair');
        buttons()[0]!.click();
        expect(handle!.state().selection).toBeFalsy();
    });

    it('draws no buttons without a detail to show', () => {
        const { buttons } = mount({ content: {} });
        expect(buttons()).toHaveLength(0);
    });

    it('has no accessibility violations with a row open', async () => {
        const { element } = mount({ expandedRows: [1] });
        await expectNoA11yViolations(element);
    });
});
