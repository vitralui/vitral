import { describe, expect, it } from 'vitest';
import { columnLabel, normalizeRange } from './a1';
import { serialFromParts } from './coerce';
import { evaluate, type EvalContext } from './evaluate';
import { parseFormula } from './parse';
import { isError, type CellAddress, type CellRange, type Scalar } from './types';

// A small sales table: region, product, units, price.
const grid: Record<string, Scalar> = {
    A1: 'north', B1: 'desk', C1: 4, D1: 320,
    A2: 'south', B2: 'chair', C2: 10, D2: 90,
    A3: 'north', B3: 'chair', C3: 6, D3: 90,
    A4: 'east', B4: 'lamp', C4: 2, D4: 45,
    F1: 'desk', F2: 'chair', F3: 'lamp',
    G1: 'Desk', G2: 'Chair', G3: 'Lamp'
};

const at = (address: CellAddress): Scalar => grid[`${columnLabel(address.col)}${address.row + 1}`] ?? null;
const context: EvalContext = {
    now: () => new Date(2026, 8, 19, 12, 0, 0),
    cell: at,
    range(range: CellRange) {
        const box = normalizeRange(range);
        const values: Scalar[] = [];
        for (let row = box.from.row; row <= box.to.row; row++) for (let col = box.from.col; col <= box.to.col; col++) values.push(at({ row, col }));
        return { rows: box.to.row - box.from.row + 1, cols: box.to.col - box.from.col + 1, values };
    }
};
const run = (formula: string) => evaluate(parseFormula(formula), context);
const code = (formula: string) => {
    const value = run(formula);
    return isError(value) ? value.error : value;
};

describe('the functions added in 0.3', () => {
    it('sums, counts and averages over several conditions', () => {
        expect(run('SUMIFS(C1:C4, A1:A4, "north", B1:B4, "chair")')).toBe(6);
        expect(run('COUNTIFS(A1:A4, "north", C1:C4, ">4")')).toBe(1);
        expect(run('AVERAGEIF(A1:A4, "north", C1:C4)')).toBe(5);
        expect(run('AVERAGEIFS(D1:D4, B1:B4, "chair")')).toBe(90);
        expect(run('MAXIFS(C1:C4, A1:A4, "north")')).toBe(6);
        expect(run('MINIFS(C1:C4, D1:D4, "<100")')).toBe(2);
        expect(code('AVERAGEIFS(D1:D4, B1:B4, "sofa")')).toBe('#DIV/0!');
    });

    it('looks things up across, and either way round', () => {
        expect(run('XLOOKUP("lamp", B1:B4, C1:C4)')).toBe(2);
        expect(run('XLOOKUP("sofa", B1:B4, C1:C4, "none")')).toBe('none');
        expect(code('XLOOKUP("sofa", B1:B4, C1:C4)')).toBe('#N/A');
        expect(run('HLOOKUP("desk", B1:D2, 2)')).toBe('chair');
        expect(run('HLOOKUP(4, B1:D2, 2)')).toBe(10);
        expect(run('CHOOSE(2, "a", "b", "c")')).toBe('b');
        expect(code('CHOOSE(5, "a")')).toBe('#VALUE!');
    });

    it('picks the first test that holds, and works out only its value', () => {
        expect(run('IFS(C1>5, "many", C1>2, "some", TRUE, "few")')).toBe('some');
        expect(run('IFS(FALSE, 1/0, TRUE, "safe")')).toBe('safe');
        expect(run('SWITCH(A4, "north", 1, "east", 2, 0)')).toBe(2);
        expect(run('SWITCH("west", "north", 1, 0)')).toBe(0);
        expect(code('SWITCH("west", "north", 1)')).toBe('#N/A');
        expect(run('XOR(TRUE, FALSE, TRUE)')).toBe(false);
        expect(run('IFNA(XLOOKUP("x", B1:B4, C1:C4), "missing")')).toBe('missing');
        expect(run('ISNA(MATCH("x", B1:B4))')).toBe(true);
    });

    it('does the statistics a report asks for', () => {
        expect(run('LARGE(C1:C4, 1)')).toBe(10);
        expect(run('SMALL(C1:C4, 2)')).toBe(4);
        expect(run('RANK(6, C1:C4)')).toBe(2);
        expect(run('RANK(6, C1:C4, TRUE)')).toBe(3);
        expect(run('SUMPRODUCT(C1:C4, D1:D4)')).toBe(4 * 320 + 10 * 90 + 6 * 90 + 2 * 45);
        expect(run('VARP(2, 4, 4, 4, 5, 5, 7, 9)')).toBe(4);
        expect(run('STDEVP(2, 4, 4, 4, 5, 5, 7, 9)')).toBe(2);
        expect(run('VAR(1, 2, 3, 4)')).toBeCloseTo(1.6667, 4);
        expect(run('LOG(8, 2)')).toBeCloseTo(3);
        expect(run('ISEVEN(4)')).toBe(true);
        expect(run('ISODD(-3)')).toBe(true);
    });

    it('works on text', () => {
        expect(run('PROPER("ana de souza")')).toBe('Ana De Souza');
        expect(run('EXACT(F1, G1)')).toBe(false);
        expect(run('SEARCH("CHA", "armchair")')).toBe(4);
        expect(run('REPLACE("2026-09", 6, 2, "10")')).toBe('2026-10');
    });

    it('counts months and working days', () => {
        const jan31 = serialFromParts(2026, 1, 31);
        expect(run(`EDATE(${jan31}, 1)`)).toBe(serialFromParts(2026, 2, 28));
        expect(run(`EOMONTH(${jan31}, 2)`)).toBe(serialFromParts(2026, 3, 31));
        expect(run(`EOMONTH(${jan31}, -1)`)).toBe(serialFromParts(2025, 12, 31));
        expect(run(`DAYS(${serialFromParts(2026, 3, 1)}, ${jan31})`)).toBe(29);
        // Mon 14 Sep to Fri 25 Sep 2026: two working weeks.
        expect(run(`NETWORKDAYS(${serialFromParts(2026, 9, 14)}, ${serialFromParts(2026, 9, 25)})`)).toBe(10);
        expect(run('HOUR(0.75)')).toBe(18);
        expect(run('MINUTE(0.5 + 1/48)')).toBe(30);
    });
});
