import { en, ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { createEditHistory, editorText, parseEdit } from './engine/edit';
import type { DataGridColumn } from './engine/types';
import { createDataGrid, type DataGridHandle } from './grid';

interface Item {
    id: number;
    name: string;
    price: number;
    due: Date;
    active: boolean;
}

const fresh = (): Item[] => [
    { id: 1, name: 'Desk', price: 120.5, due: new Date(2026, 0, 15), active: true },
    { id: 2, name: 'Lamp', price: 40, due: new Date(2026, 1, 1), active: false },
    { id: 3, name: 'Chair', price: 75, due: new Date(2026, 2, 3), active: true }
];

const columns: DataGridColumn<Item>[] = [
    { field: 'name', header: 'Name', editable: true, validate: (value) => (String(value ?? '').trim() ? true : 'A name is needed') },
    { field: 'price', header: 'Price', editable: true },
    { field: 'due', header: 'Due', editable: true, body: ({ value }) => (value as Date).toISOString().slice(0, 10) },
    { field: 'active', header: 'Active', editable: (row) => row.id !== 3 }
];

let handle: DataGridHandle<Item> | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const rows = fresh();
    const on = { 'cell-edit-complete': vi.fn(), 'cell-edit-cancel': vi.fn(), 'cell-edit-start': vi.fn(), 'row-edit-save': vi.fn(), 'cell-edit-undo': vi.fn() };
    handle = createDataGrid<Item>(element, { value: rows, dataKey: 'id', columns, ariaLabel: 'Items', on, ...config });
    const cell = (index: number, key: string) => element.querySelector(`[role="row"][data-index="${index}"] :is([role="cell"],[role="gridcell"])[data-col="${key}"]`) as HTMLElement;
    const editor = () => element.querySelector('[data-editor]') as HTMLInputElement | null;
    const key = (target: Element, name: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }));
    const type = (text: string) => {
        editor()!.value = text;
        editor()!.dispatchEvent(new Event('input', { bubbles: true }));
    };
    return { element, rows, on, cell, editor, key, type };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('reading an edit back', () => {
    it('reads a number in the reader’s own decimals, with or without thousands', () => {
        const column = { field: 'price' };
        expect(parseEdit('1.234,5', 1, column, {}, ptBR)).toEqual({ value: 1234.5 });
        expect(parseEdit('1,234.5', 1, column, {}, en)).toEqual({ value: 1234.5 });
        expect(parseEdit('-3', 1, column, {}, en)).toEqual({ value: -3 });
        expect(parseEdit('', 1, column, {}, en)).toEqual({ value: null });
        expect(parseEdit('twelve', 1, column, {}, ptBR)).toEqual({ error: 'Digite um número' });
    });

    it('writes a number back in those decimals, and a date as a date input reads it', () => {
        expect(editorText(1234.5, 'pt-BR')).toBe('1234,5');
        expect(editorText(new Date(2026, 0, 5), 'en')).toBe('2026-01-05');
        expect(parseEdit('2026-01-05', new Date(), { field: 'due' }, {}, en)).toEqual({ value: new Date(2026, 0, 5) });
        expect(parseEdit('soon', new Date(), { field: 'due' }, {}, en)).toEqual({ error: 'Enter a date' });
    });

    it('takes the column’s own reading over its own', () => {
        expect(parseEdit('7', 'x', { field: 'n', parseValue: (text) => Number(text) * 2 }, {}, en)).toEqual({ value: 14 });
    });

    it('walks a history back and forward, and forgets what could be redone once something new is done', () => {
        const history = createEditHistory<number>();
        const step = (n: number) => [{ row: n, key: 'k', column: {}, value: n, newValue: n + 1 }];
        history.push(step(1));
        history.push(step(2));
        expect(history.undo()![0]!.row).toBe(2);
        history.push(step(3));
        expect(history.canRedo()).toBe(false);
        expect(history.undo()![0]!.row).toBe(3);
        expect(history.undo()![0]!.row).toBe(1);
        expect(history.undo()).toBeUndefined();
        expect(history.redo()![0]!.row).toBe(1);
    });
});

describe('editing a cell', () => {
    it('makes the table an interactive grid whose cells take the keyboard, one in the tab order', () => {
        const { element, cell } = mount();
        expect(element.querySelector('[data-grid-table]')!.getAttribute('role')).toBe('grid');
        expect(cell(0, 'name').getAttribute('tabindex')).toBe('0');
        expect(element.querySelectorAll(':is([role="cell"],[role="gridcell"])[tabindex="0"]')).toHaveLength(1);
    });

    it('moves through cells with the arrows, Home and End', () => {
        const { cell, key } = mount();
        cell(0, 'name').focus();
        key(cell(0, 'name'), 'ArrowRight');
        expect(document.activeElement).toBe(cell(0, 'price'));
        key(cell(0, 'price'), 'ArrowDown');
        expect(document.activeElement).toBe(cell(1, 'price'));
        key(cell(1, 'price'), 'End');
        expect(document.activeElement).toBe(cell(1, 'active'));
        key(cell(1, 'active'), 'End', { ctrlKey: true });
        expect(document.activeElement).toBe(cell(2, 'active'));
        expect(cell(2, 'active').getAttribute('tabindex')).toBe('0');
    });

    it('opens on Enter with the value selected, keeps it on Enter, and reports it', () => {
        const { cell, editor, key, type, rows, on } = mount();
        cell(0, 'name').focus();
        key(cell(0, 'name'), 'Enter');
        expect(editor()!.value).toBe('Desk');
        expect(document.activeElement).toBe(editor());
        expect(editor()!.getAttribute('aria-label')).toBe('Edit Name');
        expect(on['cell-edit-start']).toHaveBeenCalledWith(expect.objectContaining({ key: 'name', value: 'Desk' }));
        type('Standing desk');
        key(editor()!, 'Enter');
        expect(rows[0]!.name).toBe('Standing desk');
        expect(cell(0, 'name').textContent).toBe('Standing desk');
        expect(document.activeElement).toBe(cell(0, 'name'));
        expect(on['cell-edit-complete']).toHaveBeenCalledWith(expect.objectContaining({ key: 'name', value: 'Desk', newValue: 'Standing desk', index: 0 }));
    });

    it('opens on typing, with what was typed, and drops it on Escape', () => {
        const { cell, editor, key, rows, on } = mount();
        cell(1, 'price').focus();
        key(cell(1, 'price'), '9');
        expect(editor()!.value).toBe('9');
        key(editor()!, 'Escape');
        expect(editor()).toBeNull();
        expect(rows[1]!.price).toBe(40);
        expect(on['cell-edit-cancel']).toHaveBeenCalled();
    });

    it('keeps a number a number, and refuses what is not one, saying why', () => {
        const { cell, editor, key, type, rows, element } = mount();
        cell(0, 'price').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        expect(editor()!.getAttribute('inputmode')).toBe('decimal');
        type('lots');
        key(editor()!, 'Enter');
        expect(editor()).not.toBeNull();
        expect(editor()!.getAttribute('aria-invalid')).toBe('true');
        const message = element.querySelector('[role="alert"]')!;
        expect(message.textContent).toBe('Enter a number');
        expect(editor()!.getAttribute('aria-errormessage')).toBe(message.id);
        type('99.9');
        key(editor()!, 'Enter');
        expect(rows[0]!.price).toBe(99.9);
    });

    it('lets the column refuse a value', () => {
        const { cell, editor, key, type, rows } = mount();
        cell(0, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        type('   ');
        key(editor()!, 'Enter');
        expect(editor()!.getAttribute('aria-invalid')).toBe('true');
        expect(rows[0]!.name).toBe('Desk');
    });

    it('edits a date in the kit’s date field and a boolean in a checkbox', () => {
        const { cell, editor, key, rows, element, type } = mount();
        cell(0, 'due').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        expect(editor()!.closest('.vt-datepicker')).not.toBeNull();
        expect(editor()!.value).toBe('01/15/2026');
        type('01/20/2026');
        key(editor()!, 'Enter');
        expect(rows[0]!.due).toEqual(new Date(2026, 0, 20));
        cell(1, 'active').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const box = element.querySelector('input[type="checkbox"][data-editor]') as HTMLInputElement;
        box.checked = true;
        box.dispatchEvent(new Event('change', { bubbles: true }));
        key(box, 'Enter');
        expect(rows[1]!.active).toBe(true);
    });

    it('does not open a cell its column will not let be edited', () => {
        const { cell, editor } = mount();
        cell(2, 'active').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        expect(editor()).toBeNull();
    });

    it('moves on to the next cell that can be edited with Tab, and back with Shift+Tab', () => {
        const { cell, editor, key, type, rows } = mount();
        cell(0, 'due').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        key(editor()!, 'Tab');
        // Active is a checkbox, so it is the next box; then past the row's end to the next row.
        expect(element().querySelector(':is([role="cell"],[role="gridcell"])[data-editing]')!.getAttribute('data-col')).toBe('active');
        key(document.activeElement!, 'Tab');
        expect(element().querySelector(':is([role="cell"],[role="gridcell"])[data-editing]')!.closest('[role="row"]')!.getAttribute('data-index')).toBe('1');
        type('Desk lamp');
        key(editor()!, 'Tab', { shiftKey: true });
        expect(rows[1]!.name).toBe('Desk lamp');
        expect(element().querySelector(':is([role="cell"],[role="gridcell"])[data-editing]')!.getAttribute('data-col')).toBe('active');
        function element() {
            return cell(0, 'name').closest('[data-grid-table]')!;
        }
    });

    it('empties a cell on Delete', () => {
        const { cell, key, rows } = mount();
        cell(1, 'price').focus();
        key(cell(1, 'price'), 'Delete');
        expect(rows[1]!.price).toBeNull();
    });

    it('keeps an edit when another cell is pressed', () => {
        const { cell, type, rows } = mount();
        cell(0, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        type('Table');
        cell(2, 'name').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(rows[0]!.name).toBe('Table');
    });

    it('follows a row that the sort moves once it is edited', () => {
        const { cell, editor, key, type, element } = mount({ sortField: 'name', sortOrder: 1 });
        // Chair, Desk, Lamp: rename Chair so it sorts last.
        cell(0, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        type('Zebra stool');
        key(editor()!, 'Enter');
        expect(element.querySelector('[role="row"][data-index="2"] :is([role="cell"],[role="gridcell"])')!.textContent).toBe('Zebra stool');
        expect(document.activeElement).toBe(cell(2, 'name'));
    });

    it('undoes and redoes with the keyboard, and says so', () => {
        const { cell, editor, key, type, rows, on, element } = mount();
        cell(0, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        type('Table');
        key(editor()!, 'Enter');
        key(cell(0, 'name'), 'z', { ctrlKey: true });
        expect(rows[0]!.name).toBe('Desk');
        expect(on['cell-edit-undo']).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'Table', newValue: 'Desk', redo: false }));
        expect(element.querySelector('[aria-live]')!.textContent).toBe('Undone: Name');
        key(cell(0, 'name'), 'y', { ctrlKey: true });
        expect(rows[0]!.name).toBe('Table');
        handle!.undo();
        expect(rows[0]!.name).toBe('Desk');
    });

    it('can have undo turned off', () => {
        const { cell, editor, key, type, rows } = mount({ undoRedo: false });
        cell(0, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        type('Table');
        key(editor()!, 'Enter');
        key(cell(0, 'name'), 'z', { ctrlKey: true });
        expect(rows[0]!.name).toBe('Table');
    });

    it('opens on a single click when told to', () => {
        const { cell, editor } = mount({ editOnClick: true });
        cell(1, 'name').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(editor()!.value).toBe('Lamp');
    });

    it('draws a host’s editor, which sets the value and keeps it', () => {
        const { cell, rows, element } = mount({
            columns: [
                {
                    field: 'name',
                    header: 'Name',
                    editable: true,
                    editor: ({ setValue, commit }: { setValue: (v: unknown) => void; commit: () => void }) => {
                        const button = document.createElement('button');
                        button.textContent = 'Pick Sofa';
                        button.onclick = () => {
                            setValue('Sofa');
                            commit();
                        };
                        return button;
                    }
                }
            ]
        });
        cell(0, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        (element.querySelector(':is([role="cell"],[role="gridcell"])[data-editing] button') as HTMLButtonElement).click();
        expect(rows[0]!.name).toBe('Sofa');
    });

    it('stays a table read by rows when told to, and edits on a double click', () => {
        const { element, cell, editor } = mount({ navigation: 'row' });
        expect(element.querySelector('[data-grid-table]')!.getAttribute('role')).toBe('table');
        expect(cell(0, 'name').hasAttribute('tabindex')).toBe(false);
        cell(0, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        expect(editor()).not.toBeNull();
    });

    it('is a grid a screen reader can read, editor open', async () => {
        const { element, cell } = mount();
        cell(0, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        await expectNoA11yViolations(element);
    });
});

describe('editing a row', () => {
    it('opens every editable cell of the row, and saves them together', () => {
        const { cell, element, key, rows, on } = mount({ editMode: 'row' });
        cell(0, 'price').focus();
        key(cell(0, 'price'), 'Enter');
        expect(element.querySelectorAll(':is([role="cell"],[role="gridcell"])[data-editing]')).toHaveLength(4);
        expect(document.activeElement).toBe(element.querySelector(':is([role="cell"],[role="gridcell"])[data-col="price"] [data-editor]'));
        const name = element.querySelector(':is([role="cell"],[role="gridcell"])[data-col="name"] [data-editor]') as HTMLInputElement;
        name.value = 'Desk XL';
        name.dispatchEvent(new Event('input', { bubbles: true }));
        const price = element.querySelector(':is([role="cell"],[role="gridcell"])[data-col="price"] [data-editor]') as HTMLInputElement;
        price.value = '130';
        price.dispatchEvent(new Event('input', { bubbles: true }));
        key(price, 'Enter');
        expect(rows[0]).toMatchObject({ name: 'Desk XL', price: 130 });
        expect(on['row-edit-save']).toHaveBeenCalledWith(expect.objectContaining({ changes: [expect.objectContaining({ key: 'name' }), expect.objectContaining({ key: 'price' })] }));
        // One step of undo takes the whole save back.
        handle!.undo();
        expect(rows[0]).toMatchObject({ name: 'Desk', price: 120.5 });
    });

    it('draws Edit, then Save and Cancel, in a row editor column', () => {
        const { element, rows } = mount({ navigation: 'row', columns: [...columns, { key: 'edit', rowEditor: true }] });
        (element.querySelector('[role="row"][data-index="1"] [data-row-editor="edit"]') as HTMLButtonElement).click();
        expect(element.querySelectorAll('[role="row"][data-index="1"] :is([role="cell"],[role="gridcell"])[data-editing]')).toHaveLength(4);
        const name = element.querySelector(':is([role="cell"],[role="gridcell"])[data-col="name"] [data-editor]') as HTMLInputElement;
        name.value = 'Floor lamp';
        name.dispatchEvent(new Event('input', { bubbles: true }));
        (element.querySelector('[data-row-editor="cancel"]') as HTMLButtonElement).click();
        expect(rows[1]!.name).toBe('Lamp');
        (element.querySelector('[role="row"][data-index="1"] [data-row-editor="edit"]') as HTMLButtonElement).click();
        (element.querySelector('[data-row-editor="save"]') as HTMLButtonElement).click();
        expect(element.querySelector(':is([role="cell"],[role="gridcell"])[data-editing]')).toBeNull();
        expect(document.activeElement).toBe(element.querySelector('[role="row"][data-index="1"] [data-row-editor="edit"]'));
    });
});
