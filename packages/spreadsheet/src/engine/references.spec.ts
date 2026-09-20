import { describe, expect, it } from 'vitest';
import { formatRange } from './a1';
import { formulaReferences } from './references';

const found = (source: string) => formulaReferences(source).map((span) => span.text);
const ranges = (source: string) => formulaReferences(source).map((span) => formatRange(span.range));

describe('the references in a formula', () => {
    it('finds the cells and the rectangles, in the order they were written', () => {
        expect(found('=B4*C4')).toEqual(['B4', 'C4']);
        expect(found('=SUM(D2:D3)+E1')).toEqual(['D2:D3', 'E1']);
        expect(ranges('=SUM(D2:D3)')).toEqual(['D2:D3']);
        // Written backwards, it still points at the same rectangle.
        expect(ranges('=SUM(C9:A1)')).toEqual(['A1:C9']);
    });

    it('reads a formula that is only half typed, which is the point', () => {
        expect(found('=B4*')).toEqual(['B4']);
        expect(found('=SUM(')).toEqual([]);
        expect(found('=SUM(A1:')).toEqual(['A1']);
        expect(found('=B4*C4+')).toEqual(['B4', 'C4']);
    });

    it('leaves anything that is not a reference alone', () => {
        // Not a formula at all.
        expect(found('B4')).toEqual([]);
        expect(found('640')).toEqual([]);
        // A function whose name ends in digits, and an error value.
        expect(found('=LOG10(A1)')).toEqual(['A1']);
        expect(found('=#REF!+A1')).toEqual(['A1']);
        // A name that merely starts like an address.
        expect(found('=A1B2')).toEqual([]);
        // Addresses inside a string are text.
        expect(found('="B4 is "&B4')).toEqual(['B4']);
        expect(found('="he said ""C4"""')).toEqual([]);
    });

    it('keeps the dollars, and says where each one sits in the text', () => {
        const [first, second] = formulaReferences('=$B$4*C4');
        expect(first).toMatchObject({ text: '$B$4', start: 1, end: 5 });
        expect(second).toMatchObject({ text: 'C4', start: 6, end: 8 });
        // The dollars are kept in the text and dropped from the range: what is
        // pinned matters when a formula is filled, not when it is outlined.
        expect(formatRange(first!.range)).toBe('B4');
    });

    it('repeats a reference that is written twice', () => {
        expect(found('=B4+B4*2')).toEqual(['B4', 'B4']);
    });
});
