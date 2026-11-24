import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Stock {
    id: number;
    symbol: string;
    week: number[];
    share: number;
}

const stocks: Stock[] = [
    { id: 1, symbol: 'ALFA', week: [10, 12, 9, 14, 13], share: 40 },
    { id: 2, symbol: 'BETA', week: [3, -2, 4, 1, -1], share: 80 },
    { id: 3, symbol: 'GAMA', week: [], share: 20 }
];

let handle: DataGridHandle<Stock> | null = null;

function mount(columns: DataGridColumn<Stock>[]) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createDataGrid<Stock>(element, { value: stocks, dataKey: 'id', columns: [{ field: 'symbol', header: 'Symbol' }, ...columns], ariaLabel: 'Stocks' });
    const cells = (n: number) => Array.from(element.querySelectorAll(`[data-section="body"] [role="row"] > :nth-child(${n})`)) as HTMLElement[];
    return { element, cells };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('sparklines', () => {
    it('draws a line named by its first, last, lowest and highest values, with a pointer target for each point', () => {
        const { cells } = mount([{ field: 'week', header: 'Week', sparkline: { markers: ['max', 'last'], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] } }]);
        const svg = cells(2)[0]!.querySelector('svg')!;
        expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(svg.getAttribute('role')).toBe('img');
        expect(svg.getAttribute('aria-label')).toBe('5 points, from 10 to 13, lowest 9, highest 14');
        expect(svg.querySelector('.vt-datagrid-sparkline-line')!.getAttribute('d')).toMatch(/^M0 /);
        expect(Array.from(svg.querySelectorAll('.vt-datagrid-sparkline-marker'), (m) => m.getAttribute('class'))).toEqual([
            'vt-datagrid-sparkline-marker vt-datagrid-sparkline-marker-max',
            'vt-datagrid-sparkline-marker vt-datagrid-sparkline-marker-last'
        ]);
        expect(Array.from(svg.querySelectorAll('title'), (t) => t.textContent)).toEqual(['Mon: 10', 'Tue: 12', 'Wed: 9', 'Thu: 14', 'Fri: 13']);
    });

    it('stands columns on zero, a fall hanging below it, and colours them by point', () => {
        const { cells } = mount([{ field: 'week', header: 'Week', sparkline: { type: 'column', color: (p) => (p.index === 0 ? 'rgb(1, 2, 3)' : undefined) } }]);
        const bars = Array.from(cells(2)[1]!.querySelectorAll('.vt-datagrid-sparkline-column')) as SVGRectElement[];
        expect(bars).toHaveLength(5);
        expect(bars.map((b) => b.classList.contains('vt-datagrid-sparkline-negative'))).toEqual([false, true, false, false, true]);
        // Zero is at y 66.67 of 100 when the values run from -2 to 4: the fall's column starts there.
        expect(bars[1]!.getAttribute('y')).toBe('66.67');
        expect(bars[0]!.style.fill).toBe('rgb(1, 2, 3)');
    });

    it('draws an area, and an empty cell where there are no numbers', () => {
        const { cells } = mount([{ field: 'week', header: 'Week', sparkline: { type: 'area', tooltip: false } }]);
        expect(cells(2)[0]!.querySelector('.vt-datagrid-sparkline-area')).not.toBeNull();
        expect(cells(2)[0]!.querySelector('title')).toBeNull();
        expect(cells(2)[2]!.querySelector('.vt-datagrid-sparkline-empty')).not.toBeNull();
    });

    it('shares a range across the rows when asked, so every line is drawn against the same scale', () => {
        const { cells } = mount([{ field: 'week', header: 'Week', sparkline: { domain: 'column' } }]);
        // Over every row the values run from -2 to 14: ALFA's first point, 10, stands at 25 of 100.
        expect(cells(2)[0]!.querySelector('.vt-datagrid-sparkline-line')!.getAttribute('d')).toMatch(/^M0 25 /);
    });

    it('draws one number as a bar, a share of the largest in the column, with the number beside it', () => {
        const { cells } = mount([{ field: 'share', header: 'Share', sparkline: { type: 'bar', format: (v) => `${v}%` } }]);
        const fills = cells(2).map((c) => (c.querySelector('.vt-datagrid-sparkline-fill') as HTMLElement).style.width);
        expect(fills).toEqual(['50%', '100%', '25%']);
        expect(cells(2)[0]!.querySelector('.vt-datagrid-sparkline-text')!.textContent).toBe('40%');
        expect(cells(2)[0]!.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('40%');
    });

    it('gives the domain fixed, and lets a column body win over the chart', () => {
        const { cells } = mount([
            { field: 'share', header: 'Share', sparkline: { type: 'bar', domain: [0, 200], text: false } },
            { field: 'week', header: 'Own', sparkline: {}, body: () => 'mine' }
        ]);
        expect((cells(2)[0]!.querySelector('.vt-datagrid-sparkline-fill') as HTMLElement).style.width).toBe('20%');
        expect(cells(2)[0]!.querySelector('.vt-datagrid-sparkline-text')).toBeNull();
        expect(cells(3)[0]!.textContent).toBe('mine');
    });

    it('has no accessibility violations', async () => {
        mount([
            { field: 'week', header: 'Week', sparkline: { type: 'line', markers: ['min', 'max'] } },
            { field: 'share', header: 'Share', sparkline: { type: 'bar' } }
        ]);
        await expectNoA11yViolations();
    });
});
