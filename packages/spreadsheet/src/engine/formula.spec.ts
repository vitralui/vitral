import { describe, expect, it } from 'vitest';
import { columnIndex, columnLabel, formatRange, formatRef, normalizeRange, offsetRef, parseRange, parseRef, rangeArea } from './a1';
import { evaluate, type EvalContext } from './evaluate';
import { FormulaSyntaxError, formulaBody, offsetNode, parseFormula, printNode } from './parse';
import { isError, type CellAddress, type CellRange, type Scalar } from './types';

// The arithmetic on its own: no sheet, no DOM. A fixture answers for the
// cells, which is all an evaluator ever asks of one.

const grid: Record<string, Scalar> = {
    A1: 10,
    A2: 20,
    A3: 30,
    B1: 'Sales',
    B2: 'north',
    B3: true,
    C1: null,
    C2: 2.5
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
const error = (formula: string) => {
    const value = run(formula);
    expect(isError(value), `${formula} is an error`).toBe(true);
    return isError(value) ? value.error : '';
};

describe('addresses', () => {
    it('counts columns in a base with no zero in it', () => {
        expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(columnLabel)).toEqual(['A', 'B', 'Z', 'AA', 'AB', 'AZ', 'BA', 'ZZ', 'AAA']);
        expect(['A', 'B', 'Z', 'AA', 'AB', 'ZZ', 'AAA'].map(columnIndex)).toEqual([0, 1, 25, 26, 27, 701, 702]);
    });

    it('reads a reference and what a $ pinned of it', () => {
        expect(parseRef('B7')).toEqual({ row: 6, col: 1, rowAbsolute: false, colAbsolute: false });
        expect(parseRef('$B$7')).toEqual({ row: 6, col: 1, rowAbsolute: true, colAbsolute: true });
        expect(parseRef('b7')).toMatchObject({ row: 6, col: 1 });
        expect(parseRef('AA100')).toMatchObject({ row: 99, col: 26 });
        expect(parseRef('B')).toBeNull();
        expect(parseRef('7')).toBeNull();
        expect(parseRef('B0')).toBeNull();
        expect(formatRef({ row: 6, col: 1, rowAbsolute: true, colAbsolute: false })).toBe('B$7');
    });

    it('reads a rectangle, and sorts its corners whichever way it was dragged', () => {
        expect(formatRange(parseRange('A1:C3')!)).toBe('A1:C3');
        expect(formatRange(parseRange('B2')!)).toBe('B2');
        expect(parseRange('A1:B2:C3')).toBeNull();
        const dragged = { from: { row: 5, col: 4 }, to: { row: 1, col: 2 } };
        expect(formatRange(normalizeRange(dragged))).toBe('C2:E6');
        expect(rangeArea(dragged)).toBe(15);
    });

    it('carries a reference, leaving what is pinned where it is', () => {
        const ref = parseRef('$B2')!;
        expect(formatRef(offsetRef(ref, 3, 5))).toBe('$B5');
        expect(formatRef(offsetRef(parseRef('B2')!, 3, 5))).toBe('G5');
        expect(formatRef(offsetRef(parseRef('$B$2')!, 3, 5))).toBe('$B$2');
    });
});

describe('reading a formula', () => {
    it('holds the operators apart at the right strength', () => {
        expect(printNode(parseFormula('1+2*3'))).toBe('1+2*3');
        expect(printNode(parseFormula('(1+2)*3'))).toBe('1+2*3');
        expect(run('1+2*3')).toBe(7);
        expect(run('(1+2)*3')).toBe(9);
        // `^` gathers to the right, as it does everywhere else.
        expect(run('2^3^2')).toBe(512);
        expect(run('-2^2')).toBe(4);
        expect(run('10-2-3')).toBe(5);
        expect(run('1<2')).toBe(true);
        expect(run('2<=2')).toBe(true);
        expect(run('"a"<>"b"')).toBe(true);
        expect(run('50%')).toBe(0.5);
        expect(run('A1%')).toBe(0.1);
    });

    it('reads strings, with a doubled quote for a quote', () => {
        expect(run('"a""b"')).toBe('a"b');
        expect(run('"one" & " " & "two"')).toBe('one two');
        expect(run('B1 & "!"')).toBe('Sales!');
        expect(run('A1 & ""')).toBe('10');
    });

    it('refuses what does not read, and says what was typed is a formula', () => {
        expect(() => parseFormula('1+')).toThrow(FormulaSyntaxError);
        expect(() => parseFormula('SUM(1,')).toThrow(FormulaSyntaxError);
        expect(() => parseFormula('"unclosed')).toThrow(FormulaSyntaxError);
        expect(() => parseFormula('1 2')).toThrow(FormulaSyntaxError);
        expect(() => parseFormula('QQ')).toThrow(FormulaSyntaxError);
        expect(formulaBody('=A1+1')).toBe('A1+1');
        expect(formulaBody('A1+1')).toBeNull();
    });

    it('carries a whole formula to another cell', () => {
        const tree = parseFormula('SUM(A1:A3)*$B$1+B2');
        expect(printNode(offsetNode(tree, 1, 0))).toBe('SUM(A2:A4)*$B$1+B3');
        expect(printNode(offsetNode(tree, 0, 2))).toBe('SUM(C1:C3)*$B$1+D2');
    });
});

describe('working a formula out', () => {
    it('reads cells and rectangles', () => {
        expect(run('A1+A2')).toBe(30);
        expect(run('SUM(A1:A3)')).toBe(60);
        expect(run('AVERAGE(A1:A3)')).toBe(20);
        expect(run('COUNT(A1:B3)')).toBe(3);
        expect(run('COUNTA(A1:B3)')).toBe(6);
        expect(run('MIN(A1:A3)')).toBe(10);
        expect(run('MAX(A1:A3)')).toBe(30);
        // An empty cell is nothing in text and zero in arithmetic.
        expect(run('C1+1')).toBe(1);
        expect(run('C1&"x"')).toBe('x');
        expect(run('ISBLANK(C1)')).toBe(true);
    });

    it('lets text and empties in a rectangle be, but not one written into the call', () => {
        expect(run('SUM(A1:B3)')).toBe(60);
        expect(error('SUM(1,"x")')).toBe('#VALUE!');
        expect(run('SUM(1,"2")')).toBe(3);
    });

    it('says what went wrong, and carries it out of whatever it went into', () => {
        expect(error('1/0')).toBe('#DIV/0!');
        expect(error('SUM(1/0, 2)')).toBe('#DIV/0!');
        expect(error('NOPE(1)')).toBe('#NAME?');
        expect(error('B1+1')).toBe('#VALUE!');
        expect(error('NA()')).toBe('#N/A');
        expect(run('ISERROR(1/0)')).toBe(true);
        expect(run('IFERROR(1/0, "safe")')).toBe('safe');
        expect(run('IFERROR(A1, "safe")')).toBe(10);
    });

    it('leaves the branch it did not take alone', () => {
        expect(run('IF(A1>5, "big", "small")')).toBe('big');
        expect(run('IF(A1>50, "big", "small")')).toBe('small');
        // The point of the rule: the guard is there to stop the other branch.
        expect(run('IF(C1=0, 0, 1/C1)')).toBe(0);
        expect(run('IF(A1>5, A1)')).toBe(10);
        expect(run('IF(A1>50, A1)')).toBe(false);
    });

    it('counts and sums what a criterion picks', () => {
        expect(run('COUNTIF(A1:A3, ">15")')).toBe(2);
        expect(run('COUNTIF(A1:A3, 20)')).toBe(1);
        expect(run('COUNTIF(B1:B3, "north")')).toBe(1);
        expect(run('SUMIF(A1:A3, ">15")')).toBe(50);
        expect(run('SUMIF(B1:B2, "north", A1:A2)')).toBe(20);
    });

    it('rounds the way a person expects, away from zero', () => {
        expect(run('ROUND(2.5)')).toBe(3);
        expect(run('ROUND(-2.5)')).toBe(-3);
        expect(run('ROUND(1.2345, 2)')).toBe(1.23);
        expect(run('ROUNDUP(1.001, 2)')).toBe(1.01);
        expect(run('ROUNDDOWN(1.999, 2)')).toBe(1.99);
        expect(run('MOD(-3, 2)')).toBe(1);
        expect(run('INT(-1.5)')).toBe(-2);
        expect(run('TRUNC(-1.5)')).toBe(-1);
        expect(run('POWER(2, 10)')).toBe(1024);
        expect(run('ABS(-3)')).toBe(3);
    });

    it('works with text', () => {
        expect(run('LEN(B1)')).toBe(5);
        expect(run('UPPER(B2)')).toBe('NORTH');
        expect(run('LEFT(B1, 2)')).toBe('Sa');
        expect(run('RIGHT(B1, 3)')).toBe('les');
        expect(run('MID(B1, 2, 3)')).toBe('ale');
        expect(run('TRIM("  a   b ")')).toBe('a b');
        expect(run('FIND("a", B1)')).toBe(2);
        expect(run('SUBSTITUTE(B1, "S", "W")')).toBe('Wales');
        expect(run('REPT("ab", 3)')).toBe('ababab');
        expect(run('CONCAT(B1, "/", A1)')).toBe('Sales/10');
        expect(run('TEXTJOIN("-", TRUE, A1:A3)')).toBe('10-20-30');
        expect(run('VALUE("2.5")')).toBe(2.5);
    });

    it('counts days from 1899-12-30, which is what a date is', () => {
        // The anchor every spreadsheet agrees on: 2024-01-01 is 45292.
        expect(run('DATE(2024, 1, 1)')).toBe(45292);
        expect(run('DATE(2026, 9, 19)')).toBe(46284);
        expect(run('YEAR(DATE(2026, 9, 19))')).toBe(2026);
        expect(run('MONTH(DATE(2026, 9, 19))')).toBe(9);
        expect(run('DAY(DATE(2026, 9, 19))')).toBe(19);
        expect(run('DATE(2026, 9, 20) - DATE(2026, 9, 19)')).toBe(1);
        // The clock is the context's, so this is the same every time it runs.
        expect(run('TODAY()')).toBe(46284);
        expect(run('YEAR(TODAY())')).toBe(2026);
    });

    it('looks a value up by its row', () => {
        expect(run('INDEX(A1:B3, 2, 2)')).toBe('north');
        expect(run('INDEX(A1:A3, 3)')).toBe(30);
        expect(error('INDEX(A1:A3, 9)')).toBe('#REF!');
        expect(run('MATCH(20, A1:A3)')).toBe(2);
        expect(error('MATCH(99, A1:A3)')).toBe('#N/A');
        expect(run('VLOOKUP(20, A1:B3, 2)')).toBe('north');
        expect(error('VLOOKUP(99, A1:B3, 2)')).toBe('#N/A');
    });

    it('holds truth together', () => {
        expect(run('AND(A1>5, A2>5)')).toBe(true);
        expect(run('AND(A1>5, A2>50)')).toBe(false);
        expect(run('OR(A1>50, A2>5)')).toBe(true);
        expect(run('NOT(A1>50)')).toBe(true);
        expect(run('IF(AND(A1>5, B3), "yes", "no")')).toBe('yes');
    });
});
