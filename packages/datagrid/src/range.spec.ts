import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { crc32, fillSeries, parseClipboard, rangeBox, rangeStats, toClipboard, zip } from './engine';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Stock {
    id: number;
    symbol: string;
    price: number;
    volume: number;
    listed: Date;
}

const fresh = (): Stock[] => [
    { id: 1, symbol: 'ACME', price: 10, volume: 100, listed: new Date(2020, 0, 2) },
    { id: 2, symbol: 'BOLT', price: 20, volume: 200, listed: new Date(2021, 5, 1) },
    { id: 3, symbol: 'CORE', price: 30, volume: 300, listed: new Date(2022, 2, 9) },
    { id: 4, symbol: 'DUNE', price: 40, volume: 400, listed: new Date(2023, 7, 15) }
];

const columns: DataGridColumn<Stock>[] = [
    { field: 'symbol', header: 'Symbol' },
    { field: 'price', header: 'Price', editable: true, validate: (value) => ((value as number) < 0 ? 'No' : true) },
    { field: 'volume', header: 'Volume', editable: true }
];

let handle: DataGridHandle<Stock> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const rows = fresh();
    const on = { 'range-change': vi.fn(), 'cells-change': vi.fn() };
    handle = createDataGrid<Stock>(element, { value: rows, dataKey: 'id', columns, ariaLabel: 'Stocks', cellSelection: true, on, ...config });
    const cell = (index: number, key: string) => element.querySelector(`[role="row"][data-index="${index}"] :is([role="cell"],[role="gridcell"])[data-col="${key}"]`) as HTMLElement;
    const key = (target: Element, name: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }));
    const marked = () => Array.from(element.querySelectorAll(':is([role="cell"],[role="gridcell"]).vt-datagrid-cell-in-range'), (td) => `${td.closest('[role="row"]')!.getAttribute('data-index')}:${td.getAttribute('data-col')}`);
    const clip = (type: 'copy' | 'paste', target: Element, text = '') => {
        const store = new Map<string, string>([['text/plain', text]]);
        const event = new Event(type, { bubbles: true, cancelable: true }) as ClipboardEvent;
        Object.defineProperty(event, 'clipboardData', { value: { getData: (kind: string) => store.get(kind) ?? '', setData: (kind: string, value: string) => store.set(kind, value) } });
        target.dispatchEvent(event);
        return store.get('text/plain');
    };
    const press = (target: Element, init: PointerEventInit = {}) => target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, ...init }) as PointerEvent);
    return { element, rows, on, cell, key, marked, clip, press };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('the workings of a block', () => {
    it('spans the rows and columns between two cells, either way round', () => {
        expect(rangeBox({ index: 2, key: 'b' }, { index: 0, key: 'a' }, [0, 1, 2, 3], ['a', 'b', 'c'])).toEqual({ rows: [0, 1, 2], keys: ['a', 'b'] });
        expect(rangeBox({ index: 9, key: 'a' }, { index: 0, key: 'a' }, [0, 1], ['a'])).toBeNull();
    });

    it('reads and writes the text a spreadsheet copies, quotes and all', () => {
        expect(parseClipboard('a\tb\r\nc\td\r\n')).toEqual([
            ['a', 'b'],
            ['c', 'd']
        ]);
        expect(parseClipboard('"two\nlines"\t"say ""hi"""')).toEqual([['two\nlines', 'say "hi"']]);
        expect(toClipboard([['two\nlines', 'tab\there', 'plain']])).toBe('"two\nlines"\t"tab\there"\tplain');
        expect(parseClipboard(toClipboard([['x"y', '']]))).toEqual([['x"y', '']]);
    });

    it('carries values on: an even step goes on stepping, anything else repeats', () => {
        expect(fillSeries([1, 2, 3], 3)).toEqual([4, 5, 6]);
        expect(fillSeries([0.1, 0.2], 2)).toEqual([0.3, 0.4]);
        expect(fillSeries([5], 3)).toEqual([5, 5, 5]);
        expect(fillSeries([1, 4, 5], 4)).toEqual([1, 4, 5, 1]);
        expect(fillSeries(['a', 'b'], 3)).toEqual(['a', 'b', 'a']);
        expect(fillSeries([new Date(2026, 0, 1), new Date(2026, 0, 8)], 1)).toEqual([new Date(2026, 0, 15)]);
    });

    it('adds up the numbers in a block and counts what it holds', () => {
        expect(rangeStats([1, 2, 'x', null, 3])).toEqual({ count: 4, numbers: 3, sum: 6, avg: 2, min: 1, max: 3 });
    });
});

describe('marking a block', () => {
    it('marks from a press to where the pointer is let go, and with Shift and a press', () => {
        const { cell, press, marked, on } = mount();
        press(cell(0, 'price'));
        press(cell(2, 'volume'), { shiftKey: true });
        expect(marked()).toEqual(['0:price', '0:volume', '1:price', '1:volume', '2:price', '2:volume']);
        expect(cell(0, 'price').className).toContain('vt-datagrid-cell-range-top');
        expect(cell(2, 'volume').className).toContain('vt-datagrid-cell-range-end');
        expect(cell(1, 'price').getAttribute('aria-selected')).toBe('true');
        expect(cell(3, 'price').getAttribute('aria-selected')).toBe('false');
        expect(on['range-change']).toHaveBeenLastCalledWith({ range: { rows: [0, 1, 2], keys: ['price', 'volume'] }, values: [[10, 100], [20, 200], [30, 300]] });
        expect(handle!.getRange()!.values).toEqual([[10, 100], [20, 200], [30, 300]]);
    });

    it('grows with Shift and the arrows, takes all with Ctrl+A, and goes with Escape', () => {
        const { cell, key, marked } = mount();
        cell(1, 'symbol').focus();
        key(cell(1, 'symbol'), 'ArrowDown', { shiftKey: true });
        key(cell(2, 'symbol'), 'ArrowRight', { shiftKey: true });
        expect(marked()).toEqual(['1:symbol', '1:price', '2:symbol', '2:price']);
        expect(document.activeElement).toBe(cell(2, 'price'));
        key(cell(2, 'price'), 'ArrowUp');
        expect(marked()).toEqual([]);
        key(cell(1, 'price'), 'a', { ctrlKey: true });
        expect(marked()).toHaveLength(12);
        key(cell(1, 'price'), 'Escape');
        expect(marked()).toEqual([]);
    });

    it('copies the block as a spreadsheet pastes it', () => {
        const { cell, press, clip } = mount();
        press(cell(0, 'symbol'));
        press(cell(1, 'price'), { shiftKey: true });
        expect(clip('copy', cell(1, 'price'))).toBe('ACME\t10\r\nBOLT\t20');
    });

    it('pastes a block from its corner into the cells that can be edited, as one step', () => {
        const { cell, clip, rows, on, element } = mount();
        cell(1, 'price').focus();
        cell(1, 'price').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        clip('paste', cell(1, 'price'), '25\t250\r\n35\t350\r\n');
        expect(rows.map((row) => [row.price, row.volume])).toEqual([
            [10, 100],
            [25, 250],
            [35, 350],
            [40, 400]
        ]);
        expect(on['cells-change']).toHaveBeenCalledWith(expect.objectContaining({ source: 'paste', changes: expect.arrayContaining([expect.objectContaining({ key: 'price', value: 20, newValue: 25 })]) }));
        expect(element.querySelector('[aria-live]')!.textContent).toBe('4 cells changed');
        handle!.undo();
        expect(rows[1]!.price).toBe(20);
        expect(rows[2]!.volume).toBe(300);
    });

    it('pastes one value over a whole block, refusing what does not read or pass', () => {
        const { cell, press, clip, rows, element } = mount();
        press(cell(0, 'symbol'));
        press(cell(3, 'price'), { shiftKey: true });
        clip('paste', cell(3, 'price'), '-5');
        // Symbol cannot be edited; Price refuses a negative.
        expect(rows.map((row) => row.price)).toEqual([10, 20, 30, 40]);
        expect(element.querySelector('[aria-live]')!.textContent).toBe('0 cells changed, 4 refused');
        clip('paste', cell(3, 'price'), '7');
        expect(rows.map((row) => row.price)).toEqual([7, 7, 7, 7]);
    });

    it('empties the editable cells of a block on Delete', () => {
        const { cell, press, key, rows } = mount();
        press(cell(0, 'price'));
        press(cell(1, 'volume'), { shiftKey: true });
        cell(1, 'volume').focus();
        key(cell(1, 'volume'), 'Delete');
        expect(rows.slice(0, 2).map((row) => [row.price, row.volume])).toEqual([
            [null, null],
            [null, null]
        ]);
    });

    it('adds the block up in the status bar', () => {
        const { cell, press, element } = mount({ statusBar: true });
        press(cell(0, 'price'));
        press(cell(2, 'price'), { shiftKey: true });
        expect(element.querySelector('.vt-datagrid-status-bar')!.textContent).toBe('4 rowsCount: 3Sum: 60Average: 20Min: 10Max: 30');
    });

    it('is a grid a screen reader can read with a block marked', async () => {
        const { cell, press, element } = mount();
        press(cell(0, 'price'));
        press(cell(1, 'volume'), { shiftKey: true });
        await expectNoA11yViolations(element);
    });
});

describe('the fill handle', () => {
    it('sits at the block’s corner and carries the block on down', () => {
        const { cell, press, element, rows, on } = mount({ fillHandle: true });
        press(cell(0, 'price'));
        press(cell(1, 'volume'), { shiftKey: true });
        const grip = cell(1, 'volume').querySelector('[data-fill-handle]')!;
        expect(grip).not.toBeNull();
        press(grip);
        // jsdom has no hit testing: the move is read from its target.
        cell(3, 'volume').dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
        expect(element.querySelectorAll('.vt-datagrid-cell-fill-target')).toHaveLength(4);
        document.dispatchEvent(new MouseEvent('pointerup'));
        expect(rows.map((row) => [row.price, row.volume])).toEqual([
            [10, 100],
            [20, 200],
            [30, 300],
            [40, 400]
        ]);
        expect(on['cells-change']).not.toHaveBeenCalled();
        rows[0]!.price = 1;
        rows[1]!.price = 3;
        handle!.refresh();
        press(cell(0, 'price'));
        press(cell(1, 'price'), { shiftKey: true });
        press(cell(1, 'price').querySelector('[data-fill-handle]')!);
        cell(3, 'price').dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
        document.dispatchEvent(new MouseEvent('pointerup'));
        expect(rows.map((row) => row.price)).toEqual([1, 3, 5, 7]);
        expect(on['cells-change']).toHaveBeenCalledWith(expect.objectContaining({ source: 'fill' }));
    });

    it('carries the block down and across at once when dragged on a slant', () => {
        const { cell, press, element, rows } = mount({ fillHandle: true });
        press(cell(0, 'price'));
        press(cell(1, 'price'), { shiftKey: true });
        press(cell(1, 'price').querySelector('[data-fill-handle]')!);
        cell(3, 'volume').dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
        // The outline goes round the grown block; the six cells past the old one are the ones written.
        expect(element.querySelectorAll('.vt-datagrid-cell-fill-target')).toHaveLength(6);
        document.dispatchEvent(new MouseEvent('pointerup'));
        // Price carried down its run, then each row across from it.
        expect(rows.map((row) => [row.price, row.volume])).toEqual([
            [10, 10],
            [20, 20],
            [30, 30],
            [40, 40]
        ]);
        expect(element.querySelector('[data-fill-handle]')!.closest('[data-col]')!.getAttribute('data-col')).toBe('volume');
    });
});

describe('cells that flash', () => {
    it('marks a cell whose value went up or down, once it was seen before', () => {
        const { element, rows } = mount({ flashCells: 500 });
        const price = () => element.querySelector('[role="row"][data-index="0"] :is([role="cell"],[role="gridcell"])[data-col="price"]') as HTMLElement;
        expect(price().hasAttribute('data-flash')).toBe(false);
        rows[0]!.price = 11;
        handle!.refresh();
        expect(price().getAttribute('data-flash')).toBe('up');
        expect(price().style.getPropertyValue('--vt-datagrid-flash-duration')).toBe('500ms');
        rows[0]!.symbol = 'ACM2';
        rows[0]!.price = 9;
        handle!.refresh();
        expect(price().getAttribute('data-flash')).toBe('down');
        expect(element.querySelector('[role="row"][data-index="0"] :is([role="cell"],[role="gridcell"])[data-col="symbol"]')!.getAttribute('data-flash')).toBe('change');
    });

    it('does nothing unless asked for', () => {
        const { element, rows } = mount();
        rows[0]!.price = 11;
        handle!.refresh();
        expect(element.querySelector('[data-flash]')).toBeNull();
    });
});

describe('a workbook', () => {
    it('keeps a CRC that zip readers check', () => {
        expect(crc32(new TextEncoder().encode('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339);
    });

    it('is a zip of the workbook’s parts, values kept as their kinds', () => {
        mount();
        const bytes = handle!.toXlsx({ sheetName: 'Stocks: 2026' });
        expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
        const text = new TextDecoder().decode(bytes);
        expect(text).toContain('[Content_Types].xml');
        expect(text).toContain('<sheet name="Stocks  2026"');
        expect(text).toContain('<c r="A1" t="inlineStr" s="1"><is><t>Symbol</t></is></c>');
        expect(text).toContain('<c r="B2"><v>10</v></c>');
        // Dates are not exported unless a column shows them; numbers stay numbers.
        expect(text).toContain('<c r="C5"><v>400</v></c>');
        const end = bytes.length - 22;
        expect(new DataView(bytes.buffer).getUint16(end + 10, true)).toBe(6);
    });

    it('writes a date as a date', () => {
        mount({ columns: [{ field: 'listed', header: 'Listed' }] });
        const text = new TextDecoder().decode(handle!.toXlsx());
        expect(text).toContain('<c r="A2" s="2"><v>43832</v></c>');
    });

    it('stores what it is given', () => {
        const bytes = zip([['a.txt', new TextEncoder().encode('hi')]]);
        expect(new TextDecoder().decode(bytes)).toContain('a.txthi');
    });
});
