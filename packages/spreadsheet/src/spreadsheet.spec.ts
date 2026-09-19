import { ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../vue/test/a11y';
import { createSpreadsheet, type SpreadsheetHandle, type SpreadsheetOptions } from './spreadsheet';

// The framework-free renderer, driven directly: no component in sight.

const handles: SpreadsheetHandle[] = [];
afterEach(() => {
    handles.splice(0).forEach((sheet) => sheet.destroy());
    document.body.innerHTML = '';
});

const invoice = {
    A1: 'Item',
    B1: 'Price',
    C1: 'Qty',
    D1: 'Total',
    A2: 'Desk',
    B2: 320,
    C2: 2,
    D2: '=B2*C2',
    A3: 'Chair',
    B3: 95.5,
    C3: 4,
    D3: '=B3*C3',
    D4: '=SUM(D2:D3)'
};

function mount(config: SpreadsheetOptions = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const handle = createSpreadsheet(element, { cells: invoice, rows: 40, columns: 8, ...config });
    handles.push(handle);
    const grid = () => element.querySelector<HTMLElement>('[role="grid"]')!;
    const cell = (address: string) => element.querySelector<HTMLElement>(`#${grid().id}-${Number(address.slice(1)) - 1}-${address.charCodeAt(0) - 65}`);
    return {
        element,
        handle,
        grid,
        cell,
        cells: () => Array.from(element.querySelectorAll<HTMLElement>('[role="gridcell"]')),
        columns: () => Array.from(element.querySelectorAll<HTMLElement>('[role="columnheader"]')),
        address: () => element.querySelector<HTMLElement>('.vt-spreadsheet-address')!.textContent,
        formula: () => element.querySelector<HTMLInputElement>('.vt-spreadsheet-formula')!,
        editor: () => element.querySelector<HTMLInputElement>('.vt-spreadsheet-editor'),
        active: () => element.querySelector<HTMLElement>('.vt-spreadsheet-active')!,
        handleDot: () => element.querySelector<HTMLElement>('.vt-spreadsheet-handle')
    };
}

const key = (element: Element, name: string, init: KeyboardEventInit = {}) =>
    element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }));

/** jsdom has no `DataTransfer`, and a clipboard event is only what it carries. */
function clipboard(text = '') {
    const store = new Map<string, string>([['text/plain', text]]);
    return { getData: (type: string) => store.get(type) ?? '', setData: (type: string, value: string) => store.set(type, value) };
}

const clipboardEvent = (type: string, data: ReturnType<typeof clipboard>) =>
    Object.assign(new Event(type, { bubbles: true, cancelable: true }), { clipboardData: data }) as unknown as ClipboardEvent;

const pointer = (type: string, init: PointerEventInit = {}) =>
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0, ...init });

describe('a spreadsheet with no framework in it', () => {
    it('draws a named grid of cells, with the headers a person counts by', () => {
        const { element, grid, cells, columns } = mount({ ariaLabel: 'Invoice' });
        expect(element.classList.contains('vt-spreadsheet')).toBe(true);
        expect(grid().getAttribute('aria-label')).toBe('Invoice');
        expect(grid().getAttribute('aria-rowcount')).toBe('40');
        expect(grid().getAttribute('aria-colcount')).toBe('8');
        expect(grid().getAttribute('tabindex')).toBe('0');
        expect(columns().map((header) => header.textContent)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
        // Only what is on screen is in the document.
        expect(cells().length).toBeLessThan(40 * 8);
        expect(cells().length).toBeGreaterThan(0);
    });

    it('shows what a cell comes to, not what was typed into it', () => {
        const { cell, handle } = mount();
        expect(cell('D2')!.textContent).toBe('640');
        expect(cell('D4')!.textContent).toBe('1022');
        expect(handle.sheet.input({ row: 3, col: 3 })).toBe('=SUM(D2:D3)');
        // A number reads down its column.
        expect(cell('B2')!.className).toContain('vt-spreadsheet-cell-number');
        expect(cell('A2')!.className).not.toContain('vt-spreadsheet-cell-number');
    });

    it('says which cell the keyboard is in, and moves it with the arrows', () => {
        const { grid, address, handle } = mount();
        expect(address()).toBe('A1');
        expect(grid().getAttribute('aria-activedescendant')).toBe(`${grid().id}-0-0`);
        key(grid(), 'ArrowDown');
        key(grid(), 'ArrowRight');
        expect(address()).toBe('B2');
        expect(handle.selection().active).toEqual({ row: 1, col: 1 });
        // It stops at the edges rather than wrapping.
        key(grid(), 'ArrowUp');
        key(grid(), 'ArrowUp');
        key(grid(), 'ArrowLeft');
        key(grid(), 'ArrowLeft');
        expect(address()).toBe('A1');
    });

    it('extends a rectangle with Shift, and says what it covers', () => {
        const { grid, address, handle, cell } = mount();
        key(grid(), 'ArrowDown', { shiftKey: true });
        key(grid(), 'ArrowRight', { shiftKey: true });
        expect(address()).toBe('A1:B2');
        expect(handle.selection().range).toEqual({ from: { row: 0, col: 0 }, to: { row: 1, col: 1 } });
        expect(cell('B2')!.getAttribute('aria-selected')).toBe('true');
        expect(cell('C2')!.getAttribute('aria-selected')).toBe('false');
        // Escape gives the rectangle up and keeps the cell.
        key(grid(), 'Escape');
        expect(address()).toBe('B2');
    });

    it('jumps to the end of a run with Ctrl and an arrow', () => {
        const { grid, address } = mount();
        key(grid(), 'ArrowDown', { ctrlKey: true });
        // A1 down a run of four filled cells stops at the last of them.
        expect(address()).toBe('A3');
        key(grid(), 'ArrowDown', { ctrlKey: true });
        expect(address()).toBe('A40');
        key(grid(), 'Home', { ctrlKey: true });
        expect(address()).toBe('A1');
        key(grid(), 'End');
        expect(address()).toBe('H1');
    });

    it('takes typing straight into the cell, and puts it in', () => {
        const { grid, editor, cell, handle, address } = mount();
        key(grid(), 'ArrowDown');
        key(grid(), 'ArrowDown');
        key(grid(), 'ArrowRight');
        key(grid(), 'ArrowRight');
        expect(address()).toBe('C3');
        key(grid(), '7');
        expect(editor()!.value).toBe('7');
        editor()!.value = '10';
        editor()!.dispatchEvent(new Event('input', { bubbles: true }));
        key(editor()!, 'Enter');
        expect(editor()).toBeNull();
        expect(handle.sheet.input({ row: 2, col: 2 })).toBe('10');
        expect(cell('D3')!.textContent).toBe('955');
        // Enter moves on down, which is how a column gets typed in.
        expect(address()).toBe('C4');
    });

    it('gives an edit up on Escape, and keeps what was there', () => {
        const { grid, editor, handle } = mount();
        key(grid(), 'F2');
        expect(editor()!.value).toBe('Item');
        editor()!.value = 'Gone';
        editor()!.dispatchEvent(new Event('input', { bubbles: true }));
        key(editor()!, 'Escape');
        expect(editor()).toBeNull();
        expect(handle.sheet.input({ row: 0, col: 0 })).toBe('Item');
    });

    it('edits from the bar over the grid as well', () => {
        const { formula, handle, cell, grid } = mount();
        key(grid(), 'ArrowRight');
        key(grid(), 'ArrowDown');
        expect(formula().value).toBe('320');
        formula().value = '400';
        formula().dispatchEvent(new Event('input', { bubbles: true }));
        key(formula(), 'Enter');
        expect(handle.sheet.value({ row: 1, col: 1 })).toBe(400);
        expect(cell('D2')!.textContent).toBe('800');
        // A formula cell shows its formula there, not its answer.
        handle.select('D2');
        expect(formula().value).toBe('=B2*C2');
    });

    it('clears a rectangle, and takes it back', () => {
        const { grid, handle, cell } = mount();
        handle.select('B2:C3');
        key(grid(), 'Delete');
        expect(cell('B2')!.textContent).toBe('');
        expect(cell('D4')!.textContent).toBe('0');
        key(grid(), 'z', { ctrlKey: true });
        expect(cell('D4')!.textContent).toBe('1022');
        key(grid(), 'y', { ctrlKey: true });
        expect(cell('D4')!.textContent).toBe('0');
    });

    it('selects with the pointer, and drags a rectangle out', () => {
        const { cell, handle, address } = mount();
        cell('B2')!.dispatchEvent(pointer('pointerdown'));
        expect(address()).toBe('B2');
        cell('C3')!.dispatchEvent(pointer('pointerdown', { shiftKey: true }));
        expect(address()).toBe('B2:C3');
        expect(handle.selection().range).toEqual({ from: { row: 1, col: 1 }, to: { row: 2, col: 2 } });
    });

    it('selects a whole column from its header, and everything from the corner', () => {
        const { element, columns, address, handle } = mount();
        columns()[1]!.dispatchEvent(pointer('pointerdown'));
        expect(address()).toBe('B1:B40');
        element.querySelector('.vt-spreadsheet-corner')!.dispatchEvent(pointer('pointerdown'));
        expect(handle.selection().range).toEqual({ from: { row: 0, col: 0 }, to: { row: 39, col: 7 } });
    });

    it('opens the cell on a double press', () => {
        const { cell, editor } = mount();
        cell('A2')!.dispatchEvent(pointer('pointerdown'));
        cell('A2')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        expect(editor()!.value).toBe('Desk');
    });

    it('has a handle at the corner of the selection, and no handle when nothing can be typed', () => {
        const { handleDot } = mount();
        expect(handleDot()).not.toBeNull();
        const locked = mount({ readonly: true });
        expect(locked.handleDot()).toBeNull();
        expect(locked.cells()[0]!.getAttribute('aria-readonly')).toBe('true');
    });

    it('copies what it shows, and pastes a table into itself', () => {
        const { grid, handle, cell } = mount();
        handle.select('D2:D3');
        const copied = clipboard();
        grid().dispatchEvent(clipboardEvent('copy', copied));
        expect(copied.getData('text/plain')).toBe('640\n382');

        const pasted = clipboard('Lamp\t20\t3');
        handle.select('A5');
        grid().dispatchEvent(clipboardEvent('paste', pasted));
        expect(cell('A5')!.textContent).toBe('Lamp');
        expect(handle.sheet.value({ row: 4, col: 2 })).toBe(3);
        expect(handle.selection().range).toEqual({ from: { row: 4, col: 0 }, to: { row: 4, col: 2 } });
    });

    it('fills from the handle, carrying the formulas with it', () => {
        const { element, handle, cell, handleDot } = mount();
        handle.select('D3');
        // The handle is dragged down two rows; the pointer is in the cells.
        const at = (address: string) => {
            const node = cell(address)!;
            return { clientX: Number.parseFloat(node.style.left) + 4, clientY: Number.parseFloat((node.parentElement as HTMLElement).style.top) + 4 };
        };
        handleDot()!.dispatchEvent(pointer('pointerdown', at('D3')));
        document.dispatchEvent(pointer('pointermove', at('D5')));
        expect(element.querySelector('.vt-spreadsheet-range')).not.toBeNull();
        document.dispatchEvent(pointer('pointerup', at('D5')));
        expect(handle.sheet.input({ row: 3, col: 3 })).toBe('=B4*C4');
        expect(handle.sheet.input({ row: 4, col: 3 })).toBe('=B5*C5');
        expect(handle.selection().range).toEqual({ from: { row: 2, col: 3 }, to: { row: 4, col: 3 } });
    });

    it('resizes a column by the strip on its edge', () => {
        const resized = vi.fn();
        const { element, columns, cell } = mount({ on: { 'column-resize': resized } });
        const strip = element.querySelectorAll<HTMLElement>('.vt-spreadsheet-resizer-column')[1]!;
        const before = Number.parseFloat(columns()[1]!.style.width);
        strip.dispatchEvent(pointer('pointerdown', { clientX: 100 }));
        document.dispatchEvent(pointer('pointermove', { clientX: 160 }));
        expect(Number.parseFloat(columns()[1]!.style.width)).toBe(before + 60);
        document.dispatchEvent(pointer('pointerup', { clientX: 160 }));
        expect(resized).toHaveBeenCalledWith({ column: 1, width: before + 60 });
        // The one beside it is the width it always was, and the cells under
        // the moved edge went with it.
        expect(Number.parseFloat(columns()[2]!.style.width)).toBe(before);
        expect(Number.parseFloat(cell('C1')!.style.left)).toBe(before * 2 + 60);
    });

    it('draws the rows that are on screen, and moves the headers with them', () => {
        const { element, cells } = mount({ rows: 5000 });
        const viewport = element.querySelector<HTMLElement>('.vt-spreadsheet-viewport')!;
        const drawn = cells().length;
        expect(drawn).toBeLessThan(200);
        const first = () => element.querySelector<HTMLElement>('[role="row"][aria-rowindex]:not([aria-rowindex="1"])')!.getAttribute('aria-rowindex');
        expect(first()).toBe('2');
        Object.defineProperty(viewport, 'scrollTop', { value: 1400, writable: true, configurable: true });
        Object.defineProperty(viewport, 'scrollLeft', { value: 0, writable: true, configurable: true });
        viewport.dispatchEvent(new Event('scroll', { bubbles: false }));
        expect(Number(first())).toBeGreaterThan(40);
        expect(cells().length).toBeLessThan(200);
        // The row numbers went with the cells rather than being laid out again.
        const track = element.querySelector<HTMLElement>('.vt-spreadsheet-rows .vt-spreadsheet-track')!;
        expect(track.style.transform).toBe('translateY(-1400px)');
    });

    it('leaves a swipe to the page, and drags a rectangle from a finger that rests', async () => {
        const { cell, handle } = mount();
        const finger = (type: string, init: PointerEventInit = {}) => pointer(type, { pointerType: 'touch', ...init });
        cell('B2')!.dispatchEvent(finger('pointerdown'));
        expect(handle.selection().range).toEqual({ from: { row: 1, col: 1 }, to: { row: 1, col: 1 } });
        // A finger that moves before it has rested is scrolling, not selecting.
        document.dispatchEvent(finger('pointermove', { clientX: 60, clientY: 60 }));
        expect(handle.selection().range).toEqual({ from: { row: 1, col: 1 }, to: { row: 1, col: 1 } });
        document.dispatchEvent(finger('pointerup', { clientX: 60, clientY: 60 }));
    });

    it('says when the selection moved and when a cell changed', () => {
        const moved = vi.fn();
        const changed = vi.fn();
        const { grid, handle } = mount({ on: { 'selection-change': moved, change: changed } });
        key(grid(), 'ArrowDown');
        expect(moved).toHaveBeenLastCalledWith(expect.objectContaining({ address: 'A2' }));
        handle.sheet.setInput({ row: 1, col: 2 }, '9');
        expect(changed).toHaveBeenCalledTimes(1);
        expect(changed.mock.calls[0]![0].cells.D2).toBe('=B2*C2');
        expect(changed.mock.calls[0]![0].source).toBe('edit');
    });

    it('speaks the locale it is given', () => {
        const { element } = mount({ locale: ptBR });
        expect(element.querySelector('.vt-spreadsheet-address')!.getAttribute('aria-label')).toBe('Célula selecionada');
        expect(element.querySelector('[role="grid"]')!.getAttribute('aria-label')).toBe('Planilha');
    });

    it('clears up after itself', () => {
        const { element, handle } = mount();
        handle.destroy();
        expect(element.innerHTML).toBe('');
    });

    it('has nothing axe objects to', async () => {
        mount({ ariaLabel: 'Invoice' });
        await expectNoA11yViolations(document.body);
    });
});
