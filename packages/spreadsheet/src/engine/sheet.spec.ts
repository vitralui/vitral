import { describe, expect, it, vi } from 'vitest';
import { cellKey, parseRange, parseRef } from './a1';
import { createDependencies, referencesOf } from './deps';
import { parseFormula } from './parse';
import { createSheet, type Sheet } from './sheet';
import { isError, type CellAddress } from './types';

// The document on its own: what is in it, what that comes to, and what has to
// be worked out again when one cell changes.

const ref = (address: string): CellAddress => parseRef(address)!;
const range = (text: string) => parseRange(text)!;
const value = (sheet: Sheet, address: string) => sheet.value(ref(address));
const shown = (sheet: Sheet, address: string) => sheet.display(ref(address));
const errorAt = (sheet: Sheet, address: string) => {
    const result = value(sheet, address);
    return isError(result) ? result.error : result;
};

const invoice = () =>
    createSheet({
        cells: {
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
        },
        now: () => new Date(2026, 8, 19)
    });

describe('a sheet', () => {
    it('holds what was typed, and says what it came to', () => {
        const sheet = invoice();
        expect(sheet.input(ref('D2'))).toBe('=B2*C2');
        expect(value(sheet, 'D2')).toBe(640);
        expect(value(sheet, 'D3')).toBe(382);
        expect(value(sheet, 'D4')).toBe(1022);
        expect(value(sheet, 'A1')).toBe('Item');
        expect(value(sheet, 'Z9')).toBeNull();
    });

    it('works a cell out again only when something it reads has changed', () => {
        const sheet = invoice();
        expect(value(sheet, 'D4')).toBe(1022);
        sheet.setInput(ref('C2'), '5');
        expect(value(sheet, 'D2')).toBe(1600);
        expect(value(sheet, 'D4')).toBe(1982);
        // A cell nothing reads changes nothing else.
        sheet.setInput(ref('A2'), 'Standing desk');
        expect(value(sheet, 'D4')).toBe(1982);
    });

    it('follows a chain of formulas as far as it goes', () => {
        const sheet = createSheet({ cells: { A1: 1, A2: '=A1*2', A3: '=A2*2', A4: '=A3*2' } });
        expect(value(sheet, 'A4')).toBe(8);
        sheet.setInput(ref('A1'), '3');
        expect(value(sheet, 'A4')).toBe(24);
    });

    it('says so rather than going round for ever', () => {
        const sheet = createSheet({ cells: { A1: '=A1+1', B1: '=C1', C1: '=B1', D1: '=B1+1' } });
        expect(errorAt(sheet, 'A1')).toBe('#CIRCULAR!');
        expect(errorAt(sheet, 'B1')).toBe('#CIRCULAR!');
        expect(errorAt(sheet, 'D1')).toBe('#CIRCULAR!');
        // And comes back to itself once the loop is cut.
        sheet.setInput(ref('C1'), '7');
        expect(value(sheet, 'B1')).toBe(7);
        expect(value(sheet, 'D1')).toBe(8);
    });

    it('keeps a formula that does not read rather than refusing it', () => {
        const sheet = createSheet({ cells: { A1: '=1+' } });
        expect(errorAt(sheet, 'A1')).toBe('#ERROR!');
        // Nothing the person typed is lost: it is still there to be fixed.
        expect(sheet.input(ref('A1'))).toBe('=1+');
        sheet.setInput(ref('A1'), '=1+1');
        expect(value(sheet, 'A1')).toBe(2);
    });

    it('reads what was typed as what it plainly is', () => {
        const sheet = createSheet({ cells: { A1: '42', A2: 'hello', A3: 'TRUE', A4: '50%', A5: '2026-09-19', A6: '' } });
        expect(value(sheet, 'A1')).toBe(42);
        expect(value(sheet, 'A2')).toBe('hello');
        expect(value(sheet, 'A3')).toBe(true);
        expect(value(sheet, 'A4')).toBe(0.5);
        expect(shown(sheet, 'A4')).toBe('50%');
        expect(sheet.format(ref('A5'))?.kind).toBe('date');
        expect(shown(sheet, 'A5')).toContain('2026');
        expect(value(sheet, 'A6')).toBeNull();
    });

    it('writes a value out the way its format says', () => {
        const sheet = createSheet({
            cells: { A1: 1234.5678, A2: 0.256, A3: 1234.5 },
            formats: { A1: { kind: 'number', decimals: 2 }, A2: { kind: 'percent', decimals: 1 }, A3: { kind: 'currency', currency: 'USD' } },
            locale: { code: 'en-US' } as never
        });
        expect(shown(sheet, 'A1')).toBe('1,234.57');
        expect(shown(sheet, 'A2')).toBe('25.6%');
        expect(shown(sheet, 'A3')).toBe('$1,234.50');
        // Without one, a number reads as itself — and without the noise a
        // binary float leaves behind.
        const plain = createSheet({ cells: { A1: '=0.1+0.2' } });
        expect(value(plain, 'A1')).toBeCloseTo(0.3, 10);
        expect(plain.display(ref('A1'))).toBe('0.3');
    });

    it('takes a format over a rectangle, and gives it back', () => {
        const sheet = invoice();
        sheet.setFormat(range('B2:B3'), { kind: 'currency', currency: 'EUR' });
        expect(sheet.format(ref('B2'))).toMatchObject({ kind: 'currency', currency: 'EUR' });
        expect(shown(sheet, 'B3')).toContain('95.50');
        expect(value(sheet, 'B3')).toBe(95.5);
    });

    it('fills a formula down, carrying its references with it', () => {
        const sheet = invoice();
        sheet.setInput(ref('B4'), '10');
        sheet.setInput(ref('C4'), '3');
        sheet.fill(range('D3'), range('D3:D4'));
        expect(sheet.input(ref('D4'))).toBe('=B4*C4');
        expect(value(sheet, 'D4')).toBe(30);
    });

    it('leaves what a $ pinned where it is', () => {
        const sheet = createSheet({ cells: { A1: 2, B1: 10, B2: 20, C1: '=B1*$A$1' } });
        sheet.fill(range('C1'), range('C1:C2'));
        expect(sheet.input(ref('C2'))).toBe('=B2*$A$1');
        expect(value(sheet, 'C2')).toBe(40);
    });

    it('carries a series on rather than repeating it', () => {
        const sheet = createSheet({ cells: { A1: 1, A2: 2 } });
        sheet.fill(range('A1:A2'), range('A1:A5'));
        expect([3, 4, 5].map((row) => sheet.value({ row: row - 1, col: 0 }))).toEqual([3, 4, 5]);
        // Across, from a single row.
        const across = createSheet({ cells: { A1: 5, B1: 10 } });
        across.fill(range('A1:B1'), range('A1:E1'));
        expect([2, 3, 4].map((col) => across.value({ row: 0, col }))).toEqual([15, 20, 25]);
        // Anything that is not a run of numbers is copied as it stands.
        const months = createSheet({ cells: { A1: 'Jan' } });
        months.fill(range('A1'), range('A1:A3'));
        expect(months.input(ref('A3'))).toBe('Jan');
        // And a block wider than one column repeats rather than counting.
        const block = createSheet({ cells: { A1: 1, B1: 2, A2: 3, B2: 4 } });
        block.fill(range('A1:B2'), range('A1:B4'));
        expect(block.copyText(range('A3:B4'))).toBe('1\t2\n3\t4');
    });

    it('takes a table pasted into it, and gives one back', () => {
        const sheet = createSheet();
        sheet.paste(ref('B2'), 'Name\tScore\nAda\t99\nAlan\t93');
        expect(value(sheet, 'B2')).toBe('Name');
        expect(value(sheet, 'C4')).toBe(93);
        expect(sheet.copyText(range('B2:C4'))).toBe('Name\tScore\nAda\t99\nAlan\t93');
        // What is copied is what is shown, unless the formulas are asked for.
        const invoiced = invoice();
        expect(invoiced.copyText(range('D2:D2'))).toBe('640');
        expect(invoiced.copyText(range('D2:D2'), { formulas: true })).toBe('=B2*C2');
    });

    it('undoes an edit, a paste and a fill, one step each', () => {
        const sheet = invoice();
        expect(sheet.canUndo()).toBe(false);
        sheet.setInput(ref('C2'), '5');
        sheet.paste(ref('A6'), 'x\ty');
        expect(value(sheet, 'B6')).toBe('y');
        expect(sheet.undo()).toBe(true);
        expect(value(sheet, 'B6')).toBeNull();
        expect(value(sheet, 'D2')).toBe(1600);
        expect(sheet.undo()).toBe(true);
        expect(value(sheet, 'D2')).toBe(640);
        expect(sheet.undo()).toBe(false);
        expect(sheet.redo()).toBe(true);
        expect(value(sheet, 'D2')).toBe(1600);
        expect(sheet.canRedo()).toBe(true);
    });

    it('says what moved, and stops saying it when nothing did', () => {
        const sheet = invoice();
        const heard = vi.fn();
        const stop = sheet.subscribe(heard);
        sheet.setInput(ref('C2'), '5');
        expect(heard).toHaveBeenCalledWith({ keys: [cellKey(1, 2)], source: 'edit' });
        // The same text again is not a change.
        sheet.setInput(ref('C2'), '5');
        expect(heard).toHaveBeenCalledTimes(1);
        sheet.undo();
        expect(heard).toHaveBeenLastCalledWith({ keys: [cellKey(1, 2)], source: 'undo' });
        stop();
        sheet.setInput(ref('C2'), '9');
        expect(heard).toHaveBeenCalledTimes(2);
    });

    it('clears a rectangle, and knows how far it goes', () => {
        const sheet = invoice();
        expect(sheet.usedRange()).toEqual({ from: { row: 0, col: 0 }, to: { row: 3, col: 3 } });
        sheet.clear(range('A1:D4'));
        expect(sheet.usedRange()).toBeNull();
        sheet.undo();
        expect(value(sheet, 'D4')).toBe(1022);
    });

    it('saves as what was typed, keyed by A1, and comes back the same', () => {
        const sheet = invoice();
        const saved = sheet.toJSON();
        expect(saved.D4).toBe('=SUM(D2:D3)');
        expect(saved.B2).toBe('320');
        expect(Object.keys(saved)).toHaveLength(13);
        const again = createSheet({ cells: saved });
        expect(again.value(ref('D4'))).toBe(1022);
    });
});

describe('what reads what', () => {
    const key = (address: string) => {
        const at = ref(address);
        return cellKey(at.row, at.col);
    };

    it('reads a formula for the cells it looks at', () => {
        expect(referencesOf(parseFormula('A1+B2'))).toHaveLength(2);
        // What a `$` pinned does not matter here: the graph is about which
        // cells were read, not how they were written.
        expect(referencesOf(parseFormula('SUM(A$1:A9)*2'))).toEqual([{ from: { row: 0, col: 0 }, to: { row: 8, col: 0 } }]);
        expect(referencesOf(parseFormula('IF(A1>0, B1, C1)'))).toHaveLength(3);
        expect(referencesOf(parseFormula('1+2'))).toEqual([]);
    });

    it('answers which formulas a change reaches, and stops where nothing does', () => {
        const deps = createDependencies();
        deps.set(key('B1'), referencesOf(parseFormula('A1*2')));
        deps.set(key('C1'), referencesOf(parseFormula('B1+1')));
        deps.set(key('D1'), referencesOf(parseFormula('SUM(X1:X9)')));
        expect([...deps.dirtyFrom([key('A1')])].sort()).toEqual([key('B1'), key('C1')].sort());
        expect([...deps.dirtyFrom([key('X5')])]).toEqual([key('D1')]);
        expect([...deps.dirtyFrom([key('Z9')])]).toEqual([]);
        // What a formula read before stops counting once it reads something else.
        deps.set(key('B1'), referencesOf(parseFormula('Q1*2')));
        expect([...deps.dirtyFrom([key('A1')])]).toEqual([]);
        deps.remove(key('C1'));
        expect([...deps.dirtyFrom([key('Q1')])]).toEqual([key('B1')]);
    });

    it('keeps a rectangle too wide to spread whole, and still answers for it', () => {
        const deps = createDependencies();
        deps.set(key('A1'), referencesOf(parseFormula('SUM(B1:B9000)')));
        expect(deps.reads(key('A1'))).toHaveLength(1);
        expect([...deps.dirtyFrom([key('B5000')])]).toEqual([key('A1')]);
        expect([...deps.dirtyFrom([key('C5000')])]).toEqual([]);
    });
});
