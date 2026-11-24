import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { CellContext } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Line {
    id: number;
    item: string;
    amount: number;
}

const lines: Line[] = [
    { id: 1, item: 'Rent', amount: 1200 },
    { id: 2, item: 'Power', amount: 90 },
    { id: 3, item: 'Water', amount: 40 }
];

const sum = (rows: Line[]) => rows.reduce((total, row) => total + row.amount, 0);

let handle: DataGridHandle<Line> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createDataGrid<Line>(element, {
        value: lines,
        dataKey: 'id',
        columns: [
            { field: 'item', header: 'Item', filterMatchMode: 'contains' },
            { field: 'amount', header: 'Amount', align: 'right', body: ({ value, pinned }: CellContext<Line>) => (pinned ? `= ${String(value)}` : String(value)) }
        ],
        ariaLabel: 'Bills',
        ...config
    });
    const text = (selector: string) => Array.from(element.querySelectorAll(selector)).map((row) => Array.from((row as HTMLElement).children).map((cell) => cell.textContent));
    return { element, text };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('rows pinned to the top and the bottom', () => {
    it('holds rows at the top, under the header, and at the bottom, out of the body', () => {
        const { element, text } = mount({ pinnedTopRows: [{ id: 0, item: 'Budget', amount: 1500 }], pinnedBottomRows: [{ id: -1, item: 'Total', amount: 1330 }] });
        expect(text('[data-section="head"] .vt-datagrid-pinned-row')).toEqual([['Budget', '= 1500']]);
        expect(text('[data-section="foot"] .vt-datagrid-pinned-row')).toEqual([['Total', '= 1330']]);
        expect(element.querySelectorAll('[data-section="body"] [role="row"]')).toHaveLength(3);
        expect(element.querySelector('[data-section="foot"]')!.className).toContain('vt-datagrid-tfoot-sticky');
    });

    it('works its rows out from the rows the filters let through, when it is a function', () => {
        const { text } = mount({ pinnedBottomRows: ({ rows }: { rows: Line[] }) => [{ id: -1, item: 'Total', amount: sum(rows) }] });
        expect(text('[data-section="foot"] .vt-datagrid-pinned-row')).toEqual([['Total', '= 1330']]);
        handle!.update({ filters: { item: { value: 'w', matchMode: 'contains' } } });
        expect(text('[data-section="foot"] .vt-datagrid-pinned-row')).toEqual([['Total', '= 130']]);
    });

    it('stays out of the sort, the selection and the export', () => {
        const { element } = mount({
            sortField: 'amount',
            sortOrder: 1,
            columns: [{ selectionMode: 'multiple' }, { field: 'item', header: 'Item' }, { field: 'amount', header: 'Amount' }],
            pinnedBottomRows: [{ id: -1, item: 'Total', amount: 1330 }]
        });
        const pinned = element.querySelector('[data-section="foot"] .vt-datagrid-pinned-row')!;
        expect(pinned.querySelector('input')).toBeNull();
        expect(element.querySelector('[data-section="body"] [role="row"] :is([role="cell"],[role="gridcell"]):nth-child(2)')!.textContent).toBe('Water');
        expect(handle!.toCSV()).not.toContain('Total');
    });

    it('sits above the footer row', () => {
        const { element } = mount({
            columns: [
                { field: 'item', header: 'Item', footer: 'Three bills' },
                { field: 'amount', header: 'Amount' }
            ],
            pinnedBottomRows: [{ id: -1, item: 'Total', amount: 1330 }]
        });
        const rows = Array.from(element.querySelectorAll('[data-section="foot"] [role="row"]'));
        expect(rows[0]!.className).toContain('vt-datagrid-pinned-row');
        expect(rows[1]!.textContent).toContain('Three bills');
    });

    it('counts in a virtual grid as rows of the table', () => {
        const { element } = mount({ virtualScroll: true, pinnedTopRows: [lines[0]], pinnedBottomRows: [lines[1], lines[2]] });
        expect(element.querySelector('[data-grid-table]')!.getAttribute('aria-rowcount')).toBe(String(1 + 1 + 3 + 2));
        expect(element.querySelector('[data-section="head"] .vt-datagrid-pinned-row')!.getAttribute('aria-rowindex')).toBe('2');
        expect(element.querySelector('[data-section="body"] [role="row"][data-index]')!.getAttribute('aria-rowindex')).toBe('3');
        expect(Array.from(element.querySelectorAll('[data-section="foot"] [role="row"]')).map((row) => row.getAttribute('aria-rowindex'))).toEqual(['6', '7']);
    });

    it('keeps every row one height, on one line, when it is told one', () => {
        const { element } = mount({ rowHeight: 32, pinnedBottomRows: [lines[0]] });
        expect(element.className).toContain('vt-datagrid-fixed-rows');
        expect((element.querySelector('[data-section="body"] [role="row"]') as HTMLElement).style.height).toBe('32px');
        expect((element.querySelector('[data-section="foot"] [role="row"]') as HTMLElement).style.height).toBe('32px');
    });

    it('is a table a screen reader can read', async () => {
        const { element } = mount({ pinnedTopRows: [lines[0]], pinnedBottomRows: [lines[1]] });
        await expectNoA11yViolations(element);
    });
});
