import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { pivotOf, PIVOT_KEY } from './engine/pivot';
import { createDataGrid, type DataGridHandle } from './grid';

interface Sale {
    region: string;
    rep: string;
    year: number;
    quarter: string;
    amount: number;
    units: number;
}

const sales: Sale[] = [
    { region: 'Europe', rep: 'Ana', year: 2025, quarter: 'Q1', amount: 100, units: 1 },
    { region: 'Europe', rep: 'Ana', year: 2025, quarter: 'Q2', amount: 150, units: 2 },
    { region: 'Europe', rep: 'Bruno', year: 2026, quarter: 'Q1', amount: 80, units: 1 },
    { region: 'Americas', rep: 'Carla', year: 2025, quarter: 'Q1', amount: 200, units: 4 },
    { region: 'Americas', rep: 'Carla', year: 2026, quarter: 'Q2', amount: 50, units: 1 },
    { region: 'Americas', rep: 'Carla', year: 2026, quarter: 'Q2', amount: 25, units: 1 }
];

let handle: DataGridHandle<never> | null = null;

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('a pivot', () => {
    it('puts a row for each mix of the side’s values, and works each cell out over the rows that meet there', () => {
        const { rows, columns } = pivotOf(sales, { rows: ['region'], columns: ['year'], values: [{ field: 'amount' }] });
        expect(columns.map((column) => column.header)).toEqual(['region', '2025', '2026', 'Total']);
        const read = (line: Record<string, unknown>) => columns.slice(1).map((column) => line[column.field!]);
        expect(rows.map((line) => [line.region, ...read(line)])).toEqual([
            ['Europe', 250, 80, 330],
            ['Americas', 200, 75, 275]
        ]);
    });

    it('nests the values across the top, and groups several things worked out under each', () => {
        const { columns } = pivotOf(sales, {
            rows: ['rep'],
            columns: ['year', 'quarter'],
            values: [
                { field: 'amount', header: 'Amount' },
                { field: 'units', aggregate: 'avg', header: 'Avg units' }
            ],
            totals: false
        });
        const shape = (list: typeof columns): unknown => list.map((column) => (column.columns ? { [column.header!]: shape(column.columns) } : column.header));
        expect(shape(columns)).toEqual(['rep', { 2025: [{ Q1: ['Amount', 'Avg units'] }, { Q2: ['Amount', 'Avg units'] }] }, { 2026: [{ Q1: ['Amount', 'Avg units'] }, { Q2: ['Amount', 'Avg units'] }] }]);
    });

    it('takes a side column’s header from the grid’s own columns, and leaves a cell no rows met empty', () => {
        const { rows, columns } = pivotOf(sales, { rows: ['rep'], columns: ['quarter'], values: [{ field: 'amount' }] }, [{ field: 'rep', header: 'Sales rep' }]);
        expect(columns[0]!.header).toBe('Sales rep');
        const bruno = rows.find((line) => line.rep === 'Bruno')!;
        expect(bruno[columns[2]!.field!]).toBeUndefined();
        expect(bruno[PIVOT_KEY]).toBe('Bruno');
    });

    it('is drawn as a grid of column groups, which sorts its rows as any', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        handle = createDataGrid(element, {
            value: sales,
            ariaLabel: 'Pivot',
            columns: [{ field: 'rep', header: 'Rep' }],
            pivot: { rows: ['rep'], columns: ['year'], values: [{ field: 'amount', header: 'Amount' }, { field: 'units', header: 'Units' }] }
        }) as unknown as DataGridHandle<never>;
        expect(Array.from(element.querySelectorAll('thead th[data-group]'), (th) => th.textContent)).toEqual(['2025', '2026', 'Total']);
        const first = () => Array.from(element.querySelectorAll('tbody tr:first-child td'), (td) => td.textContent);
        expect(first()).toEqual(['Ana', '250', '3', '', '', '250', '3']);
        const totalAmount = element.querySelectorAll('thead th[data-column]')[5] as HTMLElement;
        expect(totalAmount.textContent).toBe('Amount');
        (totalAmount.querySelector('button') as HTMLButtonElement).click();
        expect(Array.from(element.querySelectorAll('tbody tr td:first-child'), (td) => td.textContent)).toEqual(['Bruno', 'Ana', 'Carla']);
    });

    it('is a table a screen reader can read', async () => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        handle = createDataGrid(element, { value: sales, ariaLabel: 'Pivot', pivot: { rows: ['region'], columns: ['quarter'], values: [{ field: 'amount' }] } }) as unknown as DataGridHandle<never>;
        await expectNoA11yViolations(element);
    });
});
